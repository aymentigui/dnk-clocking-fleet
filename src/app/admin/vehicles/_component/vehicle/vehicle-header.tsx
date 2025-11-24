'use client';

import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { ArrowLeft, Truck, Info } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VehicleDetails, VehicleStatistics } from '@/actions/vehicle/get-vehicle';

interface VehicleHeaderProps {
    vehicleDetails: VehicleDetails;
    statistics: VehicleStatistics;
}

export default function VehicleHeader({ vehicleDetails, statistics }: VehicleHeaderProps) {
    const t = useTranslations('Vehicle');

    const statusColor = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        maintenance: 'bg-yellow-100 text-yellow-800',
        damaged: 'bg-red-100 text-red-800',
    };

    const getStatusColor = (status: string | null) => {
        if (!status) return statusColor.inactive;
        if (status.toLowerCase().includes('maintenance')) return statusColor.maintenance;
        if (status.toLowerCase().includes('damaged')) return statusColor.damaged;
        if (status.toLowerCase().includes('active')) return statusColor.active;
        return statusColor.inactive;
    };

    return (
        <div className="space-y-4">
            {/* Back Button */}
            <div>
                <Link href="/admin/vehicles">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        {t('back')}
                    </Button>
                </Link>
            </div>

            {/* Header Card */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between gap-4">
                    {/* Left */}
                    <div className="flex gap-4">
                        <div className="bg-white p-3 rounded-lg">
                            <Truck className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold">{vehicleDetails.matricule || 'N/A'}</h1>
                                <Badge className={getStatusColor(vehicleDetails.status)}>
                                    {vehicleDetails.status || t('unknown')}
                                </Badge>
                                <Badge variant={statistics.inPark ? 'default' : 'secondary'}>
                                    {statistics.inPark ? t('in_park') : t('on_road')}
                                </Badge>
                            </div>
                            <p className="text-gray-600">
                                {vehicleDetails.brand} {vehicleDetails.model} ({vehicleDetails.year})
                            </p>
                            <div className="flex gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold">{t('vin')}:</span>
                                    {vehicleDetails.vin || 'N/A'}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold">{t('registered')}:</span>
                                    {format(vehicleDetails.created_at, 'dd MMM yyyy')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Quick Stats */}
                    <div className="flex gap-4">
                        <div className="bg-white p-3 rounded-lg text-center">
                            <p className="text-2xl font-bold text-blue-600">{statistics.totalCourses}</p>
                            <p className="text-xs text-gray-600">{t('total_courses')}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg text-center">
                            <p className="text-2xl font-bold text-green-600">{statistics.totalClockings}</p>
                            <p className="text-xs text-gray-600">{t('clockings')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}