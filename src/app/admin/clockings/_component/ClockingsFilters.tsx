"use client";

import { useTranslations } from "next-intl";

interface ClockingsFiltersProps {
    searchDate: string;
    onDateChange: (date: string) => void;
    onReset: () => void;
    totalCount: number;
    displayedCount: number;
    parks?: Array<{ id: string; name: string }>;
    selectedPark?: string;
    onParkChange?: (parkId: string) => void;
    onParkReset?: () => void;
    // Ajout des nouvelles props pour type et status
    selectedType?: string;
    onTypeChange?: (type: string) => void;
    onTypeReset?: () => void;
    selectedStatus?: string;
    onStatusChange?: (status: string) => void;
    onStatusReset?: () => void;
}

export function ClockingsFilters({
    searchDate,
    onDateChange,
    onReset,
    totalCount,
    displayedCount,
    parks = [],
    selectedPark = "",
    onParkChange,
    onParkReset,
    selectedType = "",
    onTypeChange,
    onTypeReset,
    selectedStatus = "",
    onStatusChange,
    onStatusReset,
}: ClockingsFiltersProps) {
    const t = useTranslations("Clocking");
    const s = useTranslations("System");

    // Définition des types et status
    const types = [
        { id: "0", name: "Sortie" },
        { id: "1", name: "Entre" },
        { id: "3", name: "Controller Sortie" },
        { id: "4", name: "Controller Entre" }
    ];

    const status = [
        { id: "1", name: "Bien" },
        { id: "0", name: "Pas bien" }
    ];

    return (
        <div className="bg-background dark:bg-gray-800 shadow-sm rounded-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-6">
                    {/* Filtre par date */}
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-background-700 dark:text-background-300 mb-2">
                            {t("filter_by_date")}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="date"
                                id="date"
                                value={searchDate}
                                onChange={(e) => onDateChange(e.target.value)}
                                className="px-3 py-2 bg-background border border-background-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white flex-1"
                            />
                            <button
                                onClick={onReset}
                                className="px-4 py-2 text-sm font-medium text-foreground-700 dark:text-background-300 bg-background-100 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 whitespace-nowrap"
                            >
                                {t("all_dates")}
                            </button>
                        </div>
                    </div>

                    {/* Filtre par parc */}
                    <div>
                        <label htmlFor="park" className="block text-sm font-medium text-background-700 dark:text-background-300 mb-2">
                            {t("filter_by_park")}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <select
                                id="park"
                                value={selectedPark}
                                onChange={(e) => onParkChange?.(e.target.value)}
                                className="px-3 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white flex-1"
                            >
                                <option value="">{t("all_parks")}</option>
                                {parks.map((park) => (
                                    <option key={park.id} value={park.id}>
                                        {park.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={onParkReset}
                                className="px-4 py-2 text-sm font-medium text-background-700 dark:text-background-300 bg-background-100 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 whitespace-nowrap"
                            >
                                {t("all_parks")}
                            </button>
                        </div>
                    </div>

                    {/* Filtre par type */}
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-background-700 dark:text-background-300 mb-2">
                            {t("filter_by_type")}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <select
                                id="type"
                                value={selectedType}
                                onChange={(e) => onTypeChange?.(e.target.value)}
                                className="px-3 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white flex-1"
                            >
                                <option value="">{t("all")}</option>
                                {types.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={onTypeReset}
                                className="px-4 py-2 text-sm font-medium text-background-700 dark:text-background-300 bg-background-100 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 whitespace-nowrap"
                            >
                                {t("all")}
                            </button>
                        </div>
                    </div>

                    {/* Filtre par status */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-background-700 dark:text-background-300 mb-2">
                            {t("filter_by_status")}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <select
                                id="status"
                                value={selectedStatus}
                                onChange={(e) => onStatusChange?.(e.target.value)}
                                className="px-3 py-2 bg-background border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white flex-1"
                            >
                                <option value="">{t("all")}</option>
                                {status.map((st) => (
                                    <option key={st.id} value={st.id}>
                                        {st.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={onStatusReset}
                                className="px-4 py-2 text-sm font-medium text-background-700 dark:text-background-300 bg-background-100 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 whitespace-nowrap"
                            >
                                {t("all")}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}