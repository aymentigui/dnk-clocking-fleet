'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Calendar, BarChart3, Table2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import StatisticsCards from './statistics-cards';
import StatisticsTable from './statistics-table';
import { getRegionStatistics, RegionStatistics } from '@/actions/clocking/get-statistics-courses';
import VehicleStatisticsSection from './vehicle-statics-region';

interface StatisticsContentProps {
    initialStats: RegionStatistics[];
    regions: { id: string; name: string }[];
    onRefresh: (date: Date) => Promise<void>;
}

export default function StatisticsContent({
    initialStats,
    regions,
    onRefresh,
}: StatisticsContentProps) {
    const t = useTranslations('Statistics');
    const [selectedDate, setSelectedDate] = useState<string>(
        format(new Date(), 'yyyy-MM-dd')
    );
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [statistics, setStatistics] = useState<RegionStatistics[]>(initialStats);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDateChange = useCallback(
        async (newDate: string) => {
            setSelectedDate(newDate);
            setIsLoading(true);
            setError(null);

            try {
                const date = new Date(newDate);
                // Call the server action first
                await onRefresh(date);

                // Then fetch the new statistics
                const newStats = await getRegionStatistics(date);

                setStatistics(newStats);
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Error refreshing statistics');
            } finally {
                setIsLoading(false);
            }
        },
        [onRefresh]
    );

    const totalStats = useMemo(() => {
        return statistics.reduce(
            (acc, stat) => ({
                totalCourses: acc.totalCourses + stat.totalCourses,
                pendingCourses: acc.pendingCourses + stat.pendingCourses,
                completedCourses: acc.completedCourses + stat.completedCourses,
                inProgressCourses: acc.inProgressCourses + stat.inProgressCourses,
                totalVehicles: acc.totalVehicles + stat.totalVehicles,
            }),
            {
                totalCourses: 0,
                pendingCourses: 0,
                completedCourses: 0,
                inProgressCourses: 0,
                totalVehicles: 0,
            }
        );
    }, [statistics]);

    const averageCoursesPerVehicle = useMemo(() => {
        return totalStats.totalVehicles > 0
            ? (totalStats.totalCourses / totalStats.totalVehicles).toFixed(2)
            : '0';
    }, [totalStats]);

    return (
        <div className="space-y-8">
            {/* Error Alert */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    <p className="font-semibold">❌ Erreur</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Header with Controls */}
            <div className="space-y-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground mt-2">{t('description')}</p>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4 flex-wrap items-end">
                    {/* Date Picker */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium mb-2 block">{t('selectDate')}</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm disabled:opacity-50"
                                    disabled={isLoading}
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => handleDateChange(format(new Date(), 'yyyy-MM-dd'))}
                                disabled={isLoading}
                            >
                                {t('today')}
                            </Button>
                        </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === 'cards' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('cards')}
                            className="gap-2"
                            disabled={isLoading}
                        >
                            <BarChart3 className="h-4 w-4" />
                            {t('cards')}
                        </Button>
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className="gap-2"
                            disabled={isLoading}
                        >
                            <Table2 className="h-4 w-4" />
                            {t('table')}
                        </Button>
                    </div>
                </div>

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        {t('loading')}
                    </div>
                )}
            </div>

            {/* Overall Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('totalCourses')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStats.totalCourses}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('pendingCourses')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {totalStats.pendingCourses}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('completedCourses')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {totalStats.completedCourses}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('inProgressCourses')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {totalStats.inProgressCourses}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('totalVehicles')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStats.totalVehicles}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Region Statistics */}
            {statistics.length === 0 && !isLoading ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">{t('noCourses')}</p>
                    </CardContent>
                </Card>
            ) : viewMode === 'cards' ? (
                <StatisticsCards statistics={statistics} />
            ) : (
                <StatisticsTable statistics={statistics} averageCoursesPerVehicle={averageCoursesPerVehicle} />
            )}

            {/* Vehicle Statistics Section */}
            <VehicleStatisticsSection
                regions={regions}
                selectedDate={selectedDate}
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
            />
        </div>
    );
}