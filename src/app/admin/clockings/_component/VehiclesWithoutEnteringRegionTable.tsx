"use client";

import { useTranslations } from "next-intl";

interface VehicleWithoutEnteringRegion {
    id: string;
    vehicle_id: string;
    vehicle_matricule: string;
    exit_time: string;
    exit_park: string;
    conducteur_name?: string;
    conducteur_matricule?: string;
}

interface VehiclesWithoutEnteringRegionTableProps {
    vehicles: VehicleWithoutEnteringRegion[];
    loading: boolean;
}

export function VehiclesWithoutEnteringRegionTable({ vehicles, loading }: VehiclesWithoutEnteringRegionTableProps) {
    const t = useTranslations("Clocking");
    const s = useTranslations("System");

    if (loading) {
        return (
            <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
            </div>
        );
    }

    if (vehicles.length === 0) {
        return null;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-yellow-200 dark:divide-yellow-800">
                <thead className="bg-yellow-100 dark:bg-yellow-900/30">
                    <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-yellow-800 dark:text-yellow-300 uppercase tracking-wider">
                            Véhicule
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-yellow-800 dark:text-yellow-300 uppercase tracking-wider">
                            Conducteur
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-yellow-800 dark:text-yellow-300 uppercase tracking-wider">
                            Heure de sortie
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-yellow-800 dark:text-yellow-300 uppercase tracking-wider">
                            Parking de sortie
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-yellow-800 dark:text-yellow-300 uppercase tracking-wider">
                            Statut
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-yellow-50 dark:bg-yellow-900/10 divide-y divide-yellow-200 dark:divide-yellow-800">
                    {vehicles.map((vehicle) => (
                        <tr key={vehicle.id} className="hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-yellow-900 dark:text-yellow-100">
                                {vehicle.vehicle_matricule}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-yellow-800 dark:text-yellow-200">
                                {(vehicle.conducteur_name || vehicle.conducteur_matricule)
                                    ? `${vehicle.conducteur_name || ''} ${vehicle.conducteur_matricule || ''}`.trim()
                                    : "-"
                                }
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-yellow-800 dark:text-yellow-200">
                                {vehicle.exit_time}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-yellow-800 dark:text-yellow-200">
                                {vehicle.exit_park}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    Non entré en région
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}