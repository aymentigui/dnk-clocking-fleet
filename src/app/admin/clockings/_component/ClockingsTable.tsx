"use client";

import { useTranslations } from "next-intl";

interface Clocking {
    id: string;
    created_at: string;
    vehicle: string;
    device: any;
    deviceType: number;
    conducteur: any;
    status: string;
    park: string;
}

interface ClockingsTableProps {
    clockings: Clocking[];
    loading: boolean;
}

export function ClockingsTable({ clockings, loading }: ClockingsTableProps) {
    const t = useTranslations("Clocking");
    const s = useTranslations("System");

    const getDeviceTypeLabel = (type: number): string => {
        switch (type) {
            case 0:
                return t("exit");
            case 1:
                return t("entry");
            case 2:
                return t("entry_exit");
            case 3:
                return t("controller") + t("exit");;
            case 4:
                return t("controller") + t("entry");;
            default:
                return "Unknown";
        }
    };

    const getStatusColor = (status: any): string => {
        switch (status) {
            case 1:
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            // case "pending":
            //     return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case 0:
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (clockings.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t("no_clockings")}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    {s("noresults")}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t("date")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t("vehicle")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t("device")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t("device_type")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t("conducteur")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t("status")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t("location")}
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {clockings.map((clocking) => (
                        <tr key={clocking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {clocking.created_at}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {clocking.vehicle}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {clocking.device?.code || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${clocking.deviceType === 0 ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                                    clocking.deviceType === 1 ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" :
                                        clocking.deviceType === 2 ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
                                            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    }`}>
                                    {getDeviceTypeLabel(clocking.deviceType)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {clocking.conducteur?.firstname + clocking.conducteur?.lastname + clocking.conducteur?.matricule || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(clocking.status)}`}>
                                    {clocking.status || "Unknown"}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {clocking.park || "-"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}