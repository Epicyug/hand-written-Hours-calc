import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { calculateDailyMinutes, formatMinutes } from '../utils/timeUtils';

export interface DayEntry {
    day: string;
    morningIn: string;
    morningOut: string;
    afternoonIn: string;
    afternoonOut: string;
    overtimeIn: string;
    overtimeOut: string;
}

export interface WeekSheet {
    employeeName: string;
    weekOf: string;
    days: DayEntry[];
}

interface TimesheetFormProps {
    initialData?: { week1: WeekSheet; week2: WeekSheet; hourlyRate?: string };
    onSave: (data: { week1: WeekSheet; week2: WeekSheet; hourlyRate?: string }) => void;
}

const DAYS = ['Mon.', 'Tues.', 'Wed.', 'Thur.', 'Fri.', 'Sat.', 'Sun.'];

const createEmptyWeek = (): WeekSheet => ({
    employeeName: '',
    weekOf: '',
    days: DAYS.map(day => ({
        day,
        morningIn: '',
        morningOut: '',
        afternoonIn: '',
        afternoonOut: '',
        overtimeIn: '',
        overtimeOut: ''
    }))
});

export function TimesheetForm({ initialData, onSave }: TimesheetFormProps) {
    const [data, setData] = useState<{ week1: WeekSheet; week2: WeekSheet; hourlyRate?: string }>(
        initialData || { week1: createEmptyWeek(), week2: createEmptyWeek(), hourlyRate: '' }
    );

    // Sync state if parent updates initialData (e.g. after OCR)
    useEffect(() => {
        if (initialData) {
            setData(initialData);
        }
    }, [initialData]);

    const handleWeekChange = (weekKey: 'week1' | 'week2', field: keyof WeekSheet, value: string) => {
        setData(prev => ({
            ...prev,
            [weekKey]: { ...prev[weekKey], [field]: value }
        }));
    };

    const handleDayChange = (weekKey: 'week1' | 'week2', dayIndex: number, field: keyof DayEntry, value: string) => {
        setData(prev => {
            const newDays = [...prev[weekKey].days];
            newDays[dayIndex] = { ...newDays[dayIndex], [field]: value };
            return {
                ...prev,
                [weekKey]: { ...prev[weekKey], days: newDays }
            };
        });
    };

    const renderWeekTable = (weekKey: 'week1' | 'week2') => {
        const week = data[weekKey];
        const weekLabel = weekKey === 'week1' ? 'Week One' : 'Week Two';

        // Calculate Weekly Total
        const weeklyTotalMins = week.days.reduce((acc, day) => {
            const dMins = calculateDailyMinutes(
                day.morningIn, day.morningOut,
                day.afternoonIn, day.afternoonOut,
                '', ''
            );
            return acc + (dMins > 0 ? dMins : 0);
        }, 0);
        const weeklyTotalStr = formatMinutes(weeklyTotalMins);

        return (
            <div className="mb-8 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {weekKey === 'week1' && (
                    <div className="p-4 bg-gray-50/50 border-b border-gray-200 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Name Of Employee</label>
                            <input
                                type="text"
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={week.employeeName}
                                onChange={e => handleWeekChange(weekKey, 'employeeName', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Week Of</label>
                            <input
                                type="text"
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={week.weekOf}
                                onChange={e => handleWeekChange(weekKey, 'weekOf', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-black uppercase bg-gray-100 font-bold">
                            <tr>
                                <th className="px-4 py-2 border-r border-gray-200 w-24" rowSpan={2}>{weekLabel}</th>
                                <th colSpan={2} className="px-2 py-1 border-r border-gray-200 text-center border-b border-gray-200">Morning</th>
                                <th colSpan={2} className="px-2 py-1 border-r border-gray-200 text-center border-b border-gray-200">Afternoon</th>
                                <th className="px-4 py-2 text-center w-24" rowSpan={2}>Total</th>
                            </tr>
                            <tr>
                                <th className="px-2 py-1 border-r border-gray-200 text-center w-24">In</th>
                                <th className="px-2 py-1 border-r border-gray-200 text-center w-24">Out</th>
                                <th className="px-2 py-1 border-r border-gray-200 text-center w-24">In</th>
                                <th className="px-2 py-1 border-r border-gray-200 text-center w-24">Out</th>
                            </tr>
                        </thead>
                        <tbody>
                            {week.days.map((day, idx) => {
                                const dailyMins = calculateDailyMinutes(
                                    day.morningIn, day.morningOut,
                                    day.afternoonIn, day.afternoonOut,
                                    '', ''
                                );
                                const totalStr = formatMinutes(dailyMins);

                                return (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-white/60 transition-colors">
                                        <td className="px-4 py-2 font-medium text-gray-900 border-r border-gray-200">{day.day}</td>
                                        {['morningIn', 'morningOut', 'afternoonIn', 'afternoonOut'].map((field) => (
                                            <td key={field} className="px-1 py-1 border-r border-gray-200 last:border-r-0">
                                                <input
                                                    type="text"
                                                    className="w-full text-center text-gray-900 bg-transparent focus:bg-blue-50/50 rounded px-1 py-1 outline-none transition-all"
                                                    value={day[field as keyof DayEntry]}
                                                    onChange={(e) => handleDayChange(weekKey, idx, field as keyof DayEntry, e.target.value)}
                                                />
                                            </td>
                                        ))}
                                        <td className="px-4 py-2 text-center font-bold text-gray-900">
                                            {totalStr !== '0.00' ? totalStr : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-gray-50 font-bold text-black border-t border-gray-300">
                                <td className="px-4 py-2 border-r border-gray-200">Total Hours</td>
                                <td colSpan={4} className="px-4 py-2 text-right"></td>
                                <td className="px-4 py-2 text-center text-black">
                                    {weeklyTotalStr !== '0.00' ? weeklyTotalStr : '0.00'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-5xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Verify & Edit Data</h2>
                <button
                    onClick={() => onSave(data)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                    <Save className="w-4 h-4" />
                    <span>Save & Generate PDF</span>
                </button>
            </div>

            {renderWeekTable('week1')}

            {renderWeekTable('week2')}

            {/* Grand Total & Pay Section */}
            <div className="mt-6 bg-white/80 backdrop-blur rounded-xl border border-gray-200 shadow-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

                    {/* Pay Rate Input */}
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hourly Pay Rate ($)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="bg-white border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            value={data.hourlyRate || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                setData(prev => ({ ...prev, hourlyRate: val }));
                            }}
                        />
                    </div>

                    {/* Total Hours Display */}
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Combined Total Hours</span>
                        <span className="text-3xl font-extrabold text-gray-900">
                            {(() => {
                                const w1 = data.week1.days.reduce((acc, d) => acc + calculateDailyMinutes(d.morningIn, d.morningOut, d.afternoonIn, d.afternoonOut, '', ''), 0);
                                const w2 = data.week2.days.reduce((acc, d) => acc + calculateDailyMinutes(d.morningIn, d.morningOut, d.afternoonIn, d.afternoonOut, '', ''), 0);
                                return formatMinutes(w1 + w2);
                            })()}
                        </span>
                    </div>

                    {/* Total Pay Display */}
                    <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Total Pay</span>
                        <span className="text-3xl font-extrabold text-green-700">
                            {(() => {
                                const w1 = data.week1.days.reduce((acc, d) => acc + calculateDailyMinutes(d.morningIn, d.morningOut, d.afternoonIn, d.afternoonOut, '', ''), 0);
                                const w2 = data.week2.days.reduce((acc, d) => acc + calculateDailyMinutes(d.morningIn, d.morningOut, d.afternoonIn, d.afternoonOut, '', ''), 0);
                                const totalHours = (w1 + w2) / 60;
                                const rate = parseFloat(data.hourlyRate || '0');
                                return isNaN(rate) ? '$0.00' : `$${(totalHours * rate).toFixed(2)}`;
                            })()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
