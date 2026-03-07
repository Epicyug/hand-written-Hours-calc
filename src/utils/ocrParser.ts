import type { WeekSheet } from '../components/TimesheetForm';
import type { GoogleCloudVisionResponse } from './googleCloudOcr';



const createEmptyWeek = (): WeekSheet => ({
    employeeName: '',
    weekOf: '',
    days: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => ({
        day,
        morningIn: '', morningOut: '',
        afternoonIn: '', afternoonOut: '',
        overtimeIn: '', overtimeOut: ''
    }))
});

// Helper to separate day numbers from times
// Helper to separate day numbers from times
// (Removed unused isDayNumber helper)


export function parseTimesheet(ocrData: GoogleCloudVisionResponse): { week1: WeekSheet; week2: WeekSheet } {
    const week1 = createEmptyWeek();
    const week2 = createEmptyWeek();

    const fullText = ocrData.fullTextAnnotation?.text || '';
    if (!fullText) return { week1, week2 };

    // Token Stream Strategy
    // 1. Sanitize the entire text slightly to ensure AM/PM attached numbers don't get lost,
    //    but mainly we rely on tokenizing by whitespace.
    // 2. We scan for "Week 1" and "Week 2" triggers.
    // 3. We look for Day Numbers (1, 2, 3...) to switch rows.

    // Normalize text: lowercase, replace newlines with space
    const textStream = fullText.toLowerCase().replace(/\n/g, ' ');

    // Split into tokens
    let tokens = textStream.split(/\s+/).filter(t => t.trim().length > 0);

    let currentWeek: WeekSheet | null = null;
    let timeSlotIndex = 0; // 0=M_In, 1=M_Out, 2=A_In, 3=A_Out



    // --- METADATA EXTRACTION (Name & Week) ---
    // User requested to REMOVE auto-fill for Name and Week Of.
    // Extraction logic removed.
    // ------------------------------------------
    // ------------------------------------------

    // Map day strings to index
    const dayMap: Record<string, number> = {
        'sat': 0, 'sat.': 0, 'saturday': 0,
        'sun': 1, 'sun.': 1, 'sunday': 1,
        'mon': 2, 'mon.': 2, 'monday': 2,
        'tue': 3, 'tue.': 3, 'tues': 3, 'tues.': 3, 'tuesday': 3,
        'wed': 4, 'wed.': 4, 'wednesday': 4,
        'thur': 5, 'thur.': 5, 'thu': 5, 'thu.': 5, 'thursday': 5,
        'fri': 6, 'fri.': 6, 'friday': 6
    };

    const isDayName = (str: string): number | null => {
        const cleaned = str.toLowerCase().replace(/[^a-z.]/g, '');
        return dayMap.hasOwnProperty(cleaned) ? dayMap[cleaned] : null;
    };

    // We iterate through tokens manually to control the pointer
    let activeDayIndex = -1;
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];

        // 1. Detect Week Headers
        if (t === 'week' && tokens[i + 1] === '1') {
            currentWeek = week1;
            activeDayIndex = -1;
            timeSlotIndex = 0;
            i++; // skip '1'
            console.log('[Parser] Switched to Week 1');
            continue;
        }
        if (t === 'week' && tokens[i + 1] === '2') {
            currentWeek = week2;
            activeDayIndex = -1;
            timeSlotIndex = 0;
            i++; // skip '2'
            console.log('[Parser] Switched to Week 2');
            continue;
        }

        // 2. Ignore Table Headers
        if (['day', 'in', 'out', 'am', 'pm', 'total', 'hours'].includes(t)) {
            continue;
        }

        // 3. Process Data if inside a week
        if (currentWeek) {
            // Check for Day Name
            const potentialDayIndex = isDayName(t);
            if (potentialDayIndex !== null) {
                // Found a day label (e.g. "Mon")
                console.log(`[Parser] Found Day Keyword: ${t} -> Index ${potentialDayIndex}`);
                activeDayIndex = potentialDayIndex;
                timeSlotIndex = 0;
                continue;
            }

            // If we have an active day, look for times
            if (activeDayIndex >= 0 && activeDayIndex < 7) {
                // Regex checks for digits OR potential 1/11 shapes (l, I, |)
                if ((/\d/.test(t) || /^[lIi|!]+$/.test(t)) || /^\d{1,2}$/.test(t)) {
                    const cleanTime = sanitizeTime(t);
                    if (cleanTime && timeSlotIndex < 4) {
                        const days = currentWeek.days;
                        if (timeSlotIndex === 0) days[activeDayIndex].morningIn = cleanTime;
                        else if (timeSlotIndex === 1) days[activeDayIndex].morningOut = cleanTime;
                        else if (timeSlotIndex === 2) days[activeDayIndex].afternoonIn = cleanTime;
                        else if (timeSlotIndex === 3) days[activeDayIndex].afternoonOut = cleanTime;

                        console.log(`[Parser] Set W${currentWeek === week1 ? 1 : 2} D${activeDayIndex} Slot${timeSlotIndex} = ${cleanTime}`);
                        timeSlotIndex++;
                    }
                }
            }
        }
    }

    return { week1, week2 };
}

function sanitizeTime(raw: string): string {
    // Basic cleanup
    // STRICT: Only allow digits and colon.
    // User requested "only numbers" and "remove am pm feature".

    // Case-sensitive Character Mapping (User Requests)
    // 5 with S, 2 with Z, 6 with G or b, 8 with B
    // 3 with E, 9 with g or q, 7 with T
    let mapped = raw;

    mapped = mapped.replace(/[Ss]/g, '5');
    mapped = mapped.replace(/[Zz]/g, '2');
    mapped = mapped.replace(/[G]/g, '6');
    mapped = mapped.replace(/b/g, '6');
    mapped = mapped.replace(/B/g, '8');
    mapped = mapped.replace(/[Ee]/g, '3');
    mapped = mapped.replace(/g/g, '9');
    mapped = mapped.replace(/[qQ]/g, '9');
    mapped = mapped.replace(/[Tt]/g, '7');

    // Existing mappings
    mapped = mapped.replace(/[ll]/g, '1'); // Lowercase L
    mapped = mapped.replace(/[I]/g, '1'); // Capital I
    mapped = mapped.replace(/[i]/g, '1'); // Lowercase i
    mapped = mapped.replace(/[!]/g, '1'); // Exclamation
    mapped = mapped.replace(/[oO]/g, '0');
    mapped = mapped.replace(/\|\|/g, '11'); // User request: || -> 11
    mapped = mapped.replace(/\|/g, '1'); // Also map single pipe to 1
    mapped = mapped.replace(/\\/g, '1'); // Backslash
    mapped = mapped.replace(/\//g, '1'); // Forward slash
    mapped = mapped.replace(/१/g, '9'); // Devanagari 1 -> 9

    // Common separators
    mapped = mapped.replace(/[;]/g, ':');

    // Lowercase for final cleanup
    mapped = mapped.toLowerCase();

    // Final Strict Filter: Digits and Colon ONLY.
    const final = mapped.replace(/[^0-9:]/g, '');

    // Normalize colons (prevent double colon)
    return final.replace(/:+/g, ':');
}
