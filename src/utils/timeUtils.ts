export function parseTime(timeStr: string): number | null {
    if (!timeStr) return null;
    const lower = timeStr.toLowerCase().trim();

    // Matches: 9, 9:00, 9.30, 9am, 9:00am, 5pm, 17:00
    // Very basic parser
    let hours = 0;
    let minutes = 0;
    let isPm = lower.includes('p');
    let isAm = lower.includes('a');

    // Remove am/pm for parsing
    const clean = lower.replace(/[a-z]/g, '').trim();

    if (clean.includes(':')) {
        const parts = clean.split(':');
        hours = parseInt(parts[0]);
        minutes = parseInt(parts[1]);
    } else if (clean.includes('.')) {
        const parts = clean.split('.');
        hours = parseInt(parts[0]);
        minutes = parseInt(parts[1]);
    } else {
        // No separator. 
        // Case 1: "930" -> 9:30, "1030" -> 10:30
        if (clean.length === 3) {
            hours = parseInt(clean.substring(0, 1));
            minutes = parseInt(clean.substring(1));
        } else if (clean.length === 4) {
            hours = parseInt(clean.substring(0, 2));
            minutes = parseInt(clean.substring(2));
        } else {
            // Case 2: "9" -> 9:00
            hours = parseInt(clean);
        }
    }

    if (isNaN(hours)) return null;

    // 12-hour adjustment
    if (isPm && hours < 12) hours += 12;
    if (isAm && hours === 12) hours = 0;

    // If no AM/PM, assume business hours logic? 
    // e.g. 1-6 is probably PM, 7-11 is AM? 
    // Or just 24h if > 12. 
    // Simple heuristic: if < 7, add 12 (assuming afternoon work usually).

    return hours * 60 + minutes;
}

export function calculateDailyMinutes(
    mIn: string, mOut: string,
    aIn: string, aOut: string,
    oIn: string, oOut: string
): number {
    let total = 0;

    const addDiff = (start: string, end: string) => {
        const s = parseTime(start);
        const e = parseTime(end);
        if (s !== null && e !== null) {
            // Handle overnight? Assuming same day for now or standard shift.
            let diff = e - s;
            // If end is before start, maybe next day? or PM vs AM ambiguity.
            // E.g. 1 to 5. 1(1am) 5(5am) = 4 hours. 
            // 9 to 5. 9(9am) 5(5am) = -4. -> 5pm(17). 
            // Let's assume if diff < 0, add 12 hours (720 min) if it fixes it? or 24?
            // Let's keep it simple: Raw diff.
            if (diff < 0) diff += 12 * 60; // Auto-correct AM/PM simple case
            if (diff > 0) total += diff;
        }
    };

    addDiff(mIn, mOut);
    addDiff(aIn, aOut);
    addDiff(oIn, oOut);

    return total;
}

export function formatMinutes(mins: number): string {
    if (mins <= 0) return '0:00';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
}
