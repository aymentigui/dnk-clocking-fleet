import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import {
    getVehicleDetails,
    getVehicleStatistics,
    getVehicleParkHistory,
    getVehicleRegionHistory,
    getVehicleClockings,
    getVehicleCourses,
} from '@/actions/vehicle/get-vehicle';
import VehicleContent from '../_component/vehicle/vehicle-content';


export default async function VehiclePage({ params }: any) {
    const t = await getTranslations('Vehicle');
    const paramsId= await params;
    const id = paramsId.id;

    // Get all data in parallel
    const [vehicleDetails, statistics, parkHistory, regionHistory, clockings, courses] =
        await Promise.all([
            getVehicleDetails(id),
            getVehicleStatistics(id),
            getVehicleParkHistory(id),
            getVehicleRegionHistory(id),
            getVehicleClockings(id, new Date()),
            getVehicleCourses(id, new Date()),
        ]);

    // If vehicle not found, return 404
    if (!vehicleDetails) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-8">
            <div className="mx-auto max-w-7xl">
                <Suspense fallback={<div>{t('loading')}</div>}>
                    <VehicleContent
                        vehicleId={id}
                        vehicleDetails={vehicleDetails}
                        initialStatistics={statistics}
                        initialParkHistory={parkHistory}
                        initialRegionHistory={regionHistory}
                        initialClockings={clockings}
                        initialCourses={courses}
                    />
                </Suspense>
            </div>
        </div>
    );
}

export async function generateMetadata({ params }: any) {
    const paramsId= await params;
    const id = paramsId.id;
    const vehicle = await getVehicleDetails(id);

    return {
        title: vehicle ? `Vehicle ${vehicle.matricule}` : 'Vehicle',
        description: `Details for vehicle ${vehicle?.matricule || id}`,
    };
}