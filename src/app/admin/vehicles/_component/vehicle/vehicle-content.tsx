'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Truck, Calendar, MapPin, Settings } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    VehicleDetails,
    VehicleStatistics,
    VehicleParkHistory,
    VehicleRegionHistory,
    VehicleClocking,
    VehicleCourse,
} from '@/actions/vehicle/get-vehicle';
import VehicleHeader from './vehicle-header';
import VehicleStatisticsCards from './vehicle-statistics-cards';
import VehicleParkHistoryTable from './vehicle-park-history';
import VehicleRegionHistoryTable from './vehicle-region-history';
import VehicleClockingsTable from './vehicle-clockings-table';
import VehicleCoursesTable from './vehicle-courses-table';

interface VehicleContentProps {
    vehicleId: string;
    vehicleDetails: VehicleDetails;
    initialStatistics: VehicleStatistics;
    initialParkHistory: VehicleParkHistory[];
    initialRegionHistory: VehicleRegionHistory[];
    initialClockings: VehicleClocking[];
    initialCourses: VehicleCourse[];
}

export default function VehicleContent({
    vehicleId,
    vehicleDetails,
    initialStatistics,
    initialParkHistory,
    initialRegionHistory,
    initialClockings,
    initialCourses,
}: VehicleContentProps) {
    const t = useTranslations('Vehicle');
    const [selectedClockingDate, setSelectedClockingDate] = useState<string>(
        format(new Date(), 'yyyy-MM-dd')
    );
    const [selectedCourseDate, setSelectedCourseDate] = useState<string>(
        format(new Date(), 'yyyy-MM-dd')
    );

    return (
        <div className="space-y-8">
            {/* Vehicle Header */}
            <VehicleHeader vehicleDetails={vehicleDetails} statistics={initialStatistics} />

            {/* Statistics Cards */}
            <VehicleStatisticsCards statistics={initialStatistics} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - History */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Park History */}
                    <VehicleParkHistoryTable parkHistory={initialParkHistory} />

                    {/* Region History */}
                    <VehicleRegionHistoryTable regionHistory={initialRegionHistory} />
                </div>

                {/* Right Column - Clockings and Courses */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Clockings Table */}
                    <VehicleClockingsTable
                        vehicleId={vehicleId}
                        selectedDate={selectedClockingDate}
                        initialClockings={initialClockings}
                        onDateChange={setSelectedClockingDate}
                    />

                    {/* Courses Table */}
                    <VehicleCoursesTable
                        vehicleId={vehicleId}
                        selectedDate={selectedCourseDate}
                        initialCourses={initialCourses}
                        onDateChange={setSelectedCourseDate}
                    />
                </div>
            </div>
        </div>
    );
}