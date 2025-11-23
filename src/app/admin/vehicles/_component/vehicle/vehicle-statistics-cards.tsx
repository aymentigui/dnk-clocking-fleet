'use client';

import { useTranslations } from 'next-intl';
import { TrendingUp, Clock, MapPin, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleStatistics } from '@/actions/vehicle/get-vehicle';
import { format } from 'date-fns';

interface VehicleStatisticsCardsProps {
    statistics: VehicleStatistics;
}

export default function VehicleStatisticsCards({ statistics }: VehicleStatisticsCardsProps) {
    const t = useTranslations('Vehicle');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        {t('total_courses')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{statistics.totalCourses}</div>
                    {statistics.lastCourseDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('last')}: {format(statistics.lastCourseDate, 'dd MMM HH:mm')}
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {t('total_clockings')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-green-600">{statistics.totalClockings}</div>
                    {statistics.lastClockingDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('last')}: {format(statistics.lastClockingDate, 'dd MMM HH:mm')}
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {t('park_history')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{statistics.totalParkHistory}</div>
                    <p className="text-xs text-muted-foreground mt-1">{t('locations')}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {t('region_history')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-purple-600">{statistics.totalRegionHistory}</div>
                    <p className="text-xs text-muted-foreground mt-1">{t('assignments')}</p>
                </CardContent>
            </Card>
        </div>
    );
}