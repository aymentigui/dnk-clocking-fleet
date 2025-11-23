"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Car, User, AlertTriangle } from "lucide-react";
import { ClockingsFilters } from "./ClockingsFilters";
import { ClockingsTable } from "./ClockingsTable";
import { VehiclesWithoutEnteringRegionTable } from "./VehiclesWithoutEnteringRegionTable"; // Nouveau composant
import { getClockings } from "@/actions/clocking/get";
import { getParksAdmin } from "@/actions/park/get";

interface Clocking {
    id: string;
    created_at: string;
    vehicle: string;
    device: any;
    deviceType: number;
    type: number;
    conducteur: any;
    conducteur_name: string;
    conducteur_matricule: string;
    vehicle_matricule: string;
    vehicle_id: string;
    status: string;
    park: string;
}

interface VehicleWithoutEnteringRegion {
    id: string;
    vehicle_id: string;
    vehicle_matricule: string;
    exit_time: string;
    exit_park: string;
    conducteur_name?: string;
    conducteur_matricule?: string;
}

export default function ClockingsPage() {
    const t = useTranslations("Clocking");
    const s = useTranslations("System");
    const e = useTranslations("Error");

    const [clockings, setClockings] = useState<Clocking[]>([]);
    const [vehiclesWithoutEnteringRegion, setVehiclesWithoutEnteringRegion] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingVehiclesWithoutRegion, setLoadingVehiclesWithoutRegion] = useState(false);
    const [searchDate, setSearchDate] = useState<string>(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    // Filtres
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalScannBusHaveExistedParkAndNotEntredRegion, setTotalScannBusHaveExistedParkAndNotEntredRegion] = useState(0);
    const [totalCountExit, setTotalCountExit] = useState(0);
    const [uniqueConductors, setUniqueConductors] = useState(0);
    const [uniqueVehicles, setUniqueVehicles] = useState(0);
    const [parks, setParks] = useState<any[]>([]);
    const [parkFilter, setParkFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const totalPages = Math.ceil(totalCount / pageSize);

    useEffect(() => {
        getParksAdmin().then((response) => {
            if (response.status === 200) {
                setParks(response.data);
            }
        });
    }, []);

    useEffect(() => {
        loadClockings();
        loadVehiclesWithoutEnteringRegion();
    }, [currentPage, pageSize, searchDate, parkFilter, typeFilter, statusFilter]);

    const loadClockings = async () => {
        setLoading(true);
        try {
            const response = await getClockings(
                currentPage,
                pageSize,
                searchDate ? searchDate : undefined,
                parkFilter || undefined,
                typeFilter ? Number(typeFilter) : undefined,
                statusFilter ? Number(statusFilter) : undefined
            );

            if (response.status === 200) {
                setClockings(response.data);
                setTotalCount(response.total_clockings);
                setTotalScannBusHaveExistedParkAndNotEntredRegion(response.totalScannBusHaveExistedParkAndNotEntredRegion);
                setTotalCountExit(response.countExit);
                setUniqueConductors(response.uniqueConducteurs);
                setUniqueVehicles(response.uniqueVehicles);
                setVehiclesWithoutEnteringRegion(response.scannBusHaveExistedParkAndNotEntredRegion || []);
            } else {
                console.log("Error loading clockings:", response.data);
            }
        } catch (error) {
            console.log("Error loading clockings:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadVehiclesWithoutEnteringRegion = async () => {
        setLoadingVehiclesWithoutRegion(true);
        try {
            const response = await getClockings(
                1, // Première page pour les véhicules sans région
                50, // Limite raisonnable pour l'affichage
                searchDate ? searchDate : undefined,
                parkFilter || undefined,
                typeFilter ? Number(typeFilter) : undefined,
                statusFilter ? Number(statusFilter) : undefined
            );

            if (response.status === 200 && response.scannBusHaveExistedParkAndNotEntredRegion) {
                // Transformer les données pour l'affichage
                const formattedVehicles = response.scannBusHaveExistedParkAndNotEntredRegion
                setVehiclesWithoutEnteringRegion(formattedVehicles);
            }
        } catch (error) {
            console.log("Error loading vehicles without entering region:", error);
        } finally {
            setLoadingVehiclesWithoutRegion(false);
        }
    };

    const handleParkChange = (parkId: string) => {
        setParkFilter(parkId);
        setCurrentPage(1);
    }

    const handleTypeChange = (type: string) => {
        setTypeFilter(type);
        setCurrentPage(1);
    }

    const handleStatusChange = (status: string) => {
        setStatusFilter(status);
        setCurrentPage(1);
    }

    const handleDateChange = (date: string) => {
        setSearchDate(date);
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setSearchDate("");
        setParkFilter("");
        setTypeFilter("");
        setStatusFilter("");
        setCurrentPage(1);
    };

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
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Clockings */}
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">{t("total_clockings")}</p>
                                    <p className="text-3xl font-bold mt-2">{totalCount.toLocaleString()}</p>
                                    <p className="text-blue-100 text-xs mt-1">{s("total")}</p>
                                </div>
                                <div className="bg-blue-400/20 p-3 rounded-full">
                                    <Calendar className="h-8 w-8" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Today's Clockings */}
                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">{t("today_clockings")}</p>
                                    <p className="text-3xl font-bold mt-2">{totalCountExit}</p>
                                    <p className="text-green-100 text-xs mt-1"></p>
                                </div>
                                <div className="bg-green-400/20 p-3 rounded-full">
                                    <Clock className="h-8 w-8" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Unique Vehicles */}
                    <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm font-medium">{t("vehicle")}</p>
                                    <p className="text-3xl font-bold mt-2">{uniqueVehicles}</p>
                                    <p className="text-orange-100 text-xs mt-1">Unique</p>
                                </div>
                                <div className="bg-orange-400/20 p-3 rounded-full">
                                    <Car className="h-8 w-8" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Unique Conductors */}
                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">{t("conducteur")}</p>
                                    <p className="text-3xl font-bold mt-2">{uniqueConductors}</p>
                                    <p className="text-purple-100 text-xs mt-1">Unique</p>
                                </div>
                                <div className="bg-purple-400/20 p-3 rounded-full">
                                    <User className="h-8 w-8" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vehicles Without Entering Region */}
                    <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-100 text-sm font-medium">{t("totalScannBusHaveExistedParkAndNotEntredRegion")}</p>
                                    <p className="text-3xl font-bold mt-2">{totalScannBusHaveExistedParkAndNotEntredRegion}</p>
                                </div>
                                <div className="bg-red-400/20 p-3 rounded-full">
                                    <AlertTriangle className="h-8 w-8" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <ClockingsFilters
                    searchDate={searchDate}
                    onDateChange={handleDateChange}
                    onReset={resetFilters}
                    totalCount={totalCount}
                    displayedCount={clockings.length}
                    parks={parks}
                    selectedPark={parkFilter}
                    onParkChange={handleParkChange}
                    onParkReset={() => handleParkChange("")}
                    selectedType={typeFilter}
                    onTypeChange={handleTypeChange}
                    onTypeReset={() => handleTypeChange("")}
                    selectedStatus={statusFilter}
                    onStatusChange={handleStatusChange}
                    onStatusReset={() => handleStatusChange("")}
                />

                {/* Clockings Table */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                    <ClockingsTable
                        clockings={clockings}
                        loading={loading}
                    />
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                                {s("page")} {currentPage} {s("of")} {totalPages} • {clockings.length} {s("displayed")}
                                {s("of_total")} {totalCount}
                            </div>

                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    {s("back")}
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    {s("next")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table des véhicules sans entrée en région */}
                {vehiclesWithoutEnteringRegion.length > 0 && (
                    <div className="mb-8">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-2" />
                                <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">
                                    Véhicules sortis du parking mais non entrés en région
                                </h2>
                                <span className="ml-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                    {vehiclesWithoutEnteringRegion.length}
                                </span>
                            </div>
                            <VehiclesWithoutEnteringRegionTable
                                vehicles={vehiclesWithoutEnteringRegion}
                                loading={loadingVehiclesWithoutRegion}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}