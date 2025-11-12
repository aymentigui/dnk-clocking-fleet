"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getParksAdmin } from "@/actions/park/get";
import { getRegionsAdmin } from "@/actions/region/get";
import { getCountDevices, getDevices, getDevicesAll, getDevicesWithIds } from "@/actions/device/get";
import { deleteDevices } from "@/actions/device/delete";
import { createDevice, createDevices } from "@/actions/device/set";
import { UpdateDevice } from "@/actions/device/update";
import { DeviceTable } from "./DeviceTable";
import { DeviceFilters } from "./DeviceFilters";
import { DeviceForm } from "./DeviceForm";
import toast from "react-hot-toast";
import ExportButton from "@/components/my/export-button";
import { generateFileClient } from "@/actions/util/export-data/export-client";
import { useImportSheetsStore } from "@/hooks/use-import-csv";
import { getColumns } from "@/actions/util/sheet-columns/device";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Cpu, Building, MapPin } from "lucide-react";

interface Device {
    id: string;
    code: string;
    username: string;
    type: number;
    password: string;
    park: string;
    parkId: string;
    region: string;
    regionId: string;
}

const selectors = [
    { title: "id", selector: "id" },
    { title: "code", selector: "code" },
    { title: "username", selector: "username" },
    { title: "password", selector: "password" },
];

export default function DevicesPage() {
    const t = useTranslations("Device");
    const s = useTranslations("System");
    const e = useTranslations("Error");

    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [searchPark, setSearchPark] = useState("0");
    const [searchRegion, setSearchRegion] = useState("0");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Data for filters
    const [parks, setParks] = useState<any[]>([]);
    const [regions, setRegions] = useState<any[]>([]);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        byType: {
            entry: 0,
            exit: 0,
            entryExit: 0,
            controller: 0
        }
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    const { data: sheetData, setColumns, setData: setSheetData } = useImportSheetsStore();

    const [sheetNotCreated, setSheetNotCreated] = useState<any>([])
    const [sheetCreated, setSheetCreated] = useState(false)

    const [data, setData] = useState<any[]>([]);

    const columnsSheet = getColumns()

    useEffect(() => {
        setColumns(columnsSheet);
    }, []);

    useEffect(() => {
        loadDevices();
        loadFiltersData();
    }, [currentPage, pageSize, searchQuery, searchPark, searchRegion]);

    // Calculate stats when devices change
    useEffect(() => {
        if (devices.length > 0) {
            const statsData = {
                total: totalCount,
                byType: {
                    entry: devices.filter(device => device.type === 0).length,
                    exit: devices.filter(device => device.type === 1).length,
                    entryExit: devices.filter(device => device.type === 2).length,
                    controller: devices.filter(device => device.type === 3).length
                }
            };
            setStats(statsData);
        }
    }, [devices, totalCount]);

    // pour la creation depuis les sheet
    useEffect(() => {
        if (sheetData && sheetData.length > 0) {
            createDevices(sheetData).then((res) => {
                if (res.status === 200) {
                    if (res.data.devices) {
                        res.data.devices.forEach((device) => {
                            if (device.status !== 200) {
                                setSheetNotCreated((prev: any) => [...prev, device.data])
                            } else {
                                setSheetCreated(true)
                            }
                        })
                    }
                } else {
                    toast.error(res.data.message);
                }
            }).catch((error) => {
                toast.error(s("errorcreate"));
            }).finally(() => {
                setSheetData([]); // Mettre à jour le tableau avec les données créées
            });
        }
    }, [sheetData]);

    const loadFiltersData = async () => {
        try {
            const [parksResponse, regionsResponse] = await Promise.all([
                getParksAdmin(), // Get all parks
                getRegionsAdmin() // Get all regions
            ]);

            if (parksResponse.status === 200) {
                setParks(parksResponse.data);
            }

            if (regionsResponse.status === 200) {
                setRegions(regionsResponse.data);
            }
        } catch (error) {
            console.log("Error loading filters data:", error);
        }
    };

    const loadDevices = async () => {
        setLoading(true);
        try {
            const [devicesResponse, countResponse] = await Promise.all([
                getDevices(currentPage, pageSize, searchQuery, searchPark, searchRegion),
                getCountDevices(searchQuery, searchPark, searchRegion)
            ]);

            if (devicesResponse.status === 200) {
                setDevices(devicesResponse.data);
            } else {
                console.log("Error loading devices:", devicesResponse.data);
            }

            if (countResponse.status === 200) {
                setTotalCount(countResponse.data);
            }
        } catch (error) {
            console.log("Error loading devices:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDevice = (id: string) => {
        setSelectedDevices(prev =>
            prev.includes(id) ? prev.filter(deviceId => deviceId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        setSelectedDevices(checked ? devices.map(device => device.id) : []);
    };

    const handleDelete = async (ids: string[]) => {
        if (!confirm(t("confermationdeletemessage"))) return;

        try {
            const response = await deleteDevices(ids);
            if (response.status === 200) {
                setSelectedDevices(prev => prev.filter(id => !ids.includes(id)));
                loadDevices();
                // Show success message
                toast(t("delete_success"));
            } else {
                toast.error(e("error"));
            }
        } catch (error) {
            console.log("Error deleting devices:", error);
            toast.error(e("error"));
        }
    };

    const handleCreate = async (formData: any) => {
        setFormLoading(true);
        try {
            const response = await createDevice(formData);
            if (response.status === 200) {
                setShowForm(false);
                loadDevices();
                toast(t("create_success"));
            } else {
                toast.error(response.data.message || e("error"));
            }
        } catch (error) {
            console.log("Error creating device:", error);
            toast.error(e("error"));
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdate = async (formData: any) => {
        if (!editingDevice) return;

        setFormLoading(true);
        try {
            const response = await UpdateDevice(editingDevice.id, formData);
            if (response.status === 200) {
                setShowForm(false);
                setEditingDevice(null);
                loadDevices();
                toast(t("update_success"));
            } else {
                toast.error(response.data.message || e("error"));
            }
        } catch (error) {
            console.log("Error updating device:", error);
            toast.error(e("error"));
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (device: Device) => {
        setEditingDevice(device);
        setShowForm(true);
    };

    const handleFormSubmit = (formData: any) => {
        if (editingDevice) {
            handleUpdate(formData);
        } else {
            handleCreate(formData);
        }
    };

    const resetFilters = () => {
        setSearchQuery("");
        setSearchPark("0");
        setSearchRegion("0");
        setCurrentPage(1);
    };

    const exportSelected = async (type: number = 1) => {
        const res = await getDevicesWithIds(selectedDevices)

        if (res.status !== 200) {
            toast.error(e("badrequest"))
            return
        }

        const users = res.data
        generateFileClient(selectors, users, type);
    };

    const exportAll = async (type: number = 1) => {
        const res = await getDevicesAll()

        if (res.status !== 200) {
            toast.error(e("badrequest"))
            return
        }

        generateFileClient(selectors, res.data, type);
    };

    // Stats Cards Component
    const StatsCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Devices Card */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">{t("title")}</p>
                            <p className="text-3xl font-bold mt-2">{totalCount.toLocaleString()}</p>
                            <p className="text-blue-100 text-xs mt-1">{s("total")}</p>
                        </div>
                        <div className="bg-blue-400/20 p-3 rounded-full">
                            <Cpu className="h-8 w-8" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Entry Devices Card */}
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">{t("deviceentree")}</p>
                            <p className="text-3xl font-bold mt-2">{stats.byType.entry}</p>
                            <p className="text-green-100 text-xs mt-1">Devices</p>
                        </div>
                        <div className="bg-green-400/20 p-3 rounded-full">
                            <MapPin className="h-8 w-8" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Exit Devices Card */}
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">{t("devicesortie")}</p>
                            <p className="text-3xl font-bold mt-2">{stats.byType.exit}</p>
                            <p className="text-orange-100 text-xs mt-1">Devices</p>
                        </div>
                        <div className="bg-orange-400/20 p-3 rounded-full">
                            <MapPin className="h-8 w-8" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Controller Devices Card */}
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">{t("devicecontroller")}</p>
                            <p className="text-3xl font-bold mt-2">{stats.byType.controller}</p>
                            <p className="text-purple-100 text-xs mt-1">Devices</p>
                        </div>
                        <div className="bg-purple-400/20 p-3 rounded-full">
                            <Building className="h-8 w-8" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    // Simple Stats Bar (Alternative)
    const SimpleStatsBar = () => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                    <div className="flex items-center space-x-2">
                        <Cpu className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {totalCount.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {t("title")}
                        </span>
                    </div>

                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

                    <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">
                                {t("deviceentree")}: {stats.byType.entry}
                            </span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">
                                {t("devicesortie")}: {stats.byType.exit}
                            </span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">
                                {t("devicesortieentree")}: {stats.byType.entryExit}
                            </span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">
                                {t("devicecontroller")}: {stats.byType.controller}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {s("page")} {currentPage} {s("of")} {totalPages} • {devices.length} {s("displayed")}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t("title")}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {t("list")}
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <div className="flex gap-2 justify-between items-center">
                                <div className="flex gap-2">
                                    <Link href="/admin/sheetimport">
                                        <Button>{s('import')}</Button>
                                    </Link>
                                    <ExportButton all={true} handleExportCSV={() => exportAll(1)} handleExportXLSX={() => exportAll(2)} />
                                    {selectedDevices.length > 0 && <ExportButton all={false} handleExportCSV={() => exportSelected(1)} handleExportXLSX={() => exportSelected(2)} />}
                                </div>
                            </div>
                            {selectedDevices.length > 0 && (
                                <button
                                    onClick={() => handleDelete(selectedDevices)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    {t("delete_selected")} ({selectedDevices.length})
                                </button>
                            )}
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {t("adddevice")}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Section - Choose one of the following: */}

                {/* Option 1: Beautiful Stats Cards */}
                <StatsCards />

                {/* Option 2: Simple Stats Bar (uncomment to use instead) */}
                {/* <SimpleStatsBar /> */}

                {/* Filters */}
                <DeviceFilters
                    searchQuery={searchQuery}
                    searchPark={searchPark}
                    searchRegion={searchRegion}
                    parks={parks}
                    regions={regions}
                    onSearchChange={setSearchQuery}
                    onParkChange={setSearchPark}
                    onRegionChange={setSearchRegion}
                    onReset={resetFilters}
                />

                <div className="p-4">
                    {sheetCreated && (
                        <div className="bg-blue-500 text-white p-4 mb-4 rounded">
                            {s("mustrefreshtoseedata")}
                        </div>
                    )}
                    {sheetNotCreated && sheetNotCreated.length > 0 && (
                        <div className="max-h-48 my-2 overflow-auto">
                            {sheetNotCreated.map((data: any, index: any) => (
                                <div key={index} className="mt-4 p-4 bg-red-200 text-red-700 rounded">
                                    <h2 className="font-bold">{t("Error.errors")}</h2>
                                    <ul className="list-disc pl-5">
                                        <li>
                                            {
                                                (data.message ? data.message + " : " : "") + " " + (data.device.code ?? "") + " " + (data.device.username ?? "") + " " + (data.device.password ?? "")
                                            }
                                        </li>
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Devices Table */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                    <DeviceTable
                        devices={devices}
                        selectedDevices={selectedDevices}
                        onSelectDevice={handleSelectDevice}
                        onSelectAll={handleSelectAll}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        loading={loading}
                    />
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {s("pagesize")}:
                            </span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-6">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                {s("page")} {currentPage} {s("of")} {totalPages} • {totalCount} {s("total")}
                                {selectedDevices.length > 0 && ` • ${selectedDevices.length} ${s("selected")}`}
                            </div>

                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Device Form Modal */}
                {showForm && (
                    <DeviceForm
                        device={editingDevice || undefined}
                        parks={parks}
                        regions={regions}
                        onSubmit={handleFormSubmit}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingDevice(null);
                        }}
                        loading={formLoading}
                    />
                )}
            </div>
        </div>
    );
}