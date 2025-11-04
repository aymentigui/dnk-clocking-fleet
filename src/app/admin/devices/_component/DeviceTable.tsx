"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Device } from "@/types/device";

interface DeviceTableProps {
    devices: Device[];
    selectedDevices: string[];
    onSelectDevice: (id: string) => void;
    onSelectAll: (checked: boolean) => void;
    onEdit: (device: Device) => void;
    onDelete: (ids: string[]) => void;
    loading: boolean;
}

export function DeviceTable({
    devices,
    selectedDevices,
    onSelectDevice,
    onSelectAll,
    onEdit,
    onDelete,
    loading
}: DeviceTableProps) {
    const t = useTranslations("Device");
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const handleDeleteClick = (id: string) => {
        setDeleteConfirm(id);
    };

    const handleConfirmDelete = (id: string) => {
        onDelete([id]);
        setDeleteConfirm(null);
    };

    const allSelected = devices.length > 0 && selectedDevices.length === devices.length;

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (devices.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t("no_devices")}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={(e) => onSelectAll(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t("code")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t("username")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t("type")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t("park")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t("region")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {t("actions")}
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {devices.map((device) => (
                        <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedDevices.includes(device.id)}
                                    onChange={() => onSelectDevice(device.id)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {device.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {device.username}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {getDeviceTypeLabel(device.type, t)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {device.park || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {device.region || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => onEdit(device)}
                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        {t("edit")}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(device.id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        {t("delete")}
                                    </button>
                                </div>

                                {deleteConfirm === device.id && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                                {t("confirm_delete")}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
                                                {t("confermationdeletemessage")}
                                            </p>
                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleConfirmDelete(device.id)}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                                >
                                                    {t("delete")}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function getDeviceTypeLabel(type: number, t: any): string {
    switch (type) {
        case 0:
            return t("deviceentree");
        case 1:
            return t("devicesortie");
        case 2:
            return t("devicesortieentree");
        case 3:
            return t("devicecontroller");
        default:
            return "Unknown";
    }
}