"use client";

import { useTranslations } from "next-intl";

interface DeviceFiltersProps {
    searchQuery: string;
    searchPark: string;
    searchRegion: string;
    parks: any[];
    regions: any[];
    onSearchChange: (query: string) => void;
    onParkChange: (parkId: string) => void;
    onRegionChange: (regionId: string) => void;
    onReset: () => void;
}

export function DeviceFilters({
    searchQuery,
    searchPark,
    searchRegion,
    parks,
    regions,
    onSearchChange,
    onParkChange,
    onRegionChange,
    onReset
}: DeviceFiltersProps) {
    const t = useTranslations("Device");
    const s = useTranslations("System");

    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search Input */}
                <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {s("search")}
                    </label>
                    <input
                        type="text"
                        id="search"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={t("search_placeholder")}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* Park Filter */}
                <div>
                    <label htmlFor="park" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t("park")}
                    </label>
                    <select
                        id="park"
                        value={searchPark}
                        onChange={(e) => onParkChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="0">{t("selectpark")}</option>
                        {parks.map((park) => (
                            <option key={park.id} value={park.id}>
                                {park.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Region Filter */}
                <div>
                    <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t("region")}
                    </label>
                    <select
                        id="region"
                        value={searchRegion}
                        onChange={(e) => onRegionChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="0">{t("selectregion")}</option>
                        {regions.map((region) => (
                            <option key={region.id} value={region.id}>
                                {region.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                    <button
                        onClick={onReset}
                        className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                    >
                        {s("reset")}
                    </button>
                </div>
            </div>
        </div>
    );
}