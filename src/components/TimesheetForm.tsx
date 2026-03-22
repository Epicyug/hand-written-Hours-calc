import { Plus, X, Save } from 'lucide-react';
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

export interface PageData {
    id: string;
    label: string;
    week1: WeekSheet;
    week2: WeekSheet;
}

interface TimesheetFormProps {
    pages: PageData[];
    currentPageIndex: number;
    hourlyRate: string;
    onPageChange: (index: number) => void;
    onAddPage: () => void;
    onDeletePage: (index: number) => void;
    onDayChange: (pageIndex: number, weekKey: 'week1' | 'week2', dayIndex: number, field: keyof DayEntry, value: string) => void;
    onWeekChange: (pageIndex: number, weekKey: 'week1' | 'week2', field: keyof WeekSheet, value: string) => void;
    onHourlyRateChange: (value: string) => void;
    onSave: () => void;
}

const renderWeekTable = (
    page: PageData,
    pageIndex: number,
    weekKey: 'week1' | 'week2',
    onDayChange: TimesheetFormProps['onDayChange'],
    onWeekChange: TimesheetFormProps['onWeekChange']
) => {
    const week = page[weekKey];
    const weekLabel = weekKey === 'week1' ? 'Week One' : 'Week Two';

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
                            onChange={e => onWeekChange(pageIndex, weekKey, 'employeeName', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Week Of</label>
                        <input
                            type="text"
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={week.weekOf}
                            onChange={e => onWeekChange(pageIndex, weekKey, 'weekOf', e.target.value)}
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
                                    {(['morningIn', 'morningOut', 'afternoonIn', 'afternoonOut'] as (keyof DayEntry)[]).map((field) => (
                                        <td key={field} className="px-1 py-1 border-r border-gray-200 last:border-r-0">
                                            <input
                                                type="text"
                                                className="w-full text-center text-gray-900 bg-transparent focus:bg-blue-50/50 rounded px-1 py-1 outline-none transition-all"
                                                value={day[field]}
                                                onChange={(e) => onDayChange(pageIndex, weekKey, idx, field, e.target.value)}
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

export function TimesheetForm({
    pages,
    currentPageIndex,
    hourlyRate,
    onPageChange,
    onAddPage,
    onDeletePage,
    onDayChange,
    onWeekChange,
    onHourlyRateChange,
    onSave,
}: TimesheetFormProps) {
    const currentPage = pages[currentPageIndex];

    // Grand total across ALL pages
    const grandTotalMins = pages.reduce((total, page) => {
        const w1 = page.week1.days.reduce((acc, d) => acc + calculateDailyMinutes(d.morningIn, d.morningOut, d.afternoonIn, d.afternoonOut, '', ''), 0);
        const w2 = page.week2.days.reduce((acc, d) => acc + calculateDailyMinutes(d.morningIn, d.morningOut, d.afternoonIn, d.afternoonOut, '', ''), 0);
        return total + w1 + w2;
    }, 0);
    const grandTotalHours = grandTotalMins / 60;
    const rate = parseFloat(hourlyRate || '0');
    const totalPay = isNaN(rate) ? 0 : grandTotalHours * rate;

    return (
        <div className="w-full max-w-5xl animate-fade-in-up">
            {/* Header row */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Verify & Edit Data</h2>
                <button
                    onClick={onSave}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                    <Save className="w-4 h-4" />
                    <span>Save & Generate PDF</span>
                </button>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
                {pages.map((page, index) => (
                    <div key={page.id} className="relative flex-shrink-0">
                        <button
                            onClick={() => onPageChange(index)}
                            className={`px-4 py-2 rounded-t-lg text-sm font-medium border transition-colors pr-7 ${
                                index === currentPageIndex
                                    ? 'bg-white border-gray-300 border-b-white text-blue-600 shadow-sm'
                                    : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {page.label}
                        </button>
                        {pages.length > 1 && (
                            <button
                                onClick={() => onDeletePage(index)}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                                title={`Delete ${page.label}`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
                <button
                    onClick={onAddPage}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 text-sm border border-gray-200 transition-colors"
                    title="Add a new page"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add Page
                </button>
            </div>

            {/* Current page's two week tables */}
            {renderWeekTable(currentPage, currentPageIndex, 'week1', onDayChange, onWeekChange)}
            {renderWeekTable(currentPage, currentPageIndex, 'week2', onDayChange, onWeekChange)}

            {/* Grand Total & Pay Section (sums ALL pages) */}
            <div className="mt-6 bg-white/80 backdrop-blur rounded-xl border border-gray-200 shadow-md p-6">
                {pages.length > 1 && (
                    <p className="text-xs text-gray-500 mb-3 text-center">
                        Grand total across all {pages.length} pages
                    </p>
                )}
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
                            value={hourlyRate}
                            onChange={(e) => onHourlyRateChange(e.target.value)}
                        />
                    </div>

                    {/* Total Hours Display */}
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Combined Total Hours</span>
                        <span className="text-3xl font-extrabold text-gray-900">{formatMinutes(grandTotalMins)}</span>
                    </div>

                    {/* Total Pay Display */}
                    <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Total Pay</span>
                        <span className="text-3xl font-extrabold text-green-700">
                            {rate > 0 ? `$${totalPay.toFixed(2)}` : '$0.00'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
