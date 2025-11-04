"use client";

import { useTranslations } from "next-intl";

interface ClockingsFiltersProps {
    searchDate: string;
    onDateChange: (date: string) => void;
    onReset: () => void;
    totalCount: number;
    displayedCount: number;
}

export function ClockingsFilters({
    searchDate,
    onDateChange,
    onReset,
    totalCount,
    displayedCount
}: ClockingsFiltersProps) {
    const t = useTranslations("Clocking");
    const s = useTranslations("System");

    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("filter_by_date")}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="date"
                            id="date"
                            value={searchDate}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                            onClick={onReset}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                        >
                            {t("all_dates")}
                        </button>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 min-w-[200px]">
                    <div className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                        {t("total_clockings")}
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {totalCount.toLocaleString()}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-300">
                        {displayedCount} {s("displayed")}
                    </div>
                </div>
            </div>
        </div>
    );
}