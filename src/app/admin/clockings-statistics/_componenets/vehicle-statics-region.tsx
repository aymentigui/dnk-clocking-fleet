'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Truck } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getVehicleStatisticsByRegion, VehicleStatistics } from '@/actions/clocking/get-statistics-courses';

interface VehicleStatisticsSectionProps {
    regions: { id: string; name: string }[];
    selectedDate: string;
    selectedRegion: string;
    onRegionChange: (regionId: string) => void;
}

export default function VehicleStatisticsSection({
    regions,
    selectedDate,
    selectedRegion,
    onRegionChange,
}: VehicleStatisticsSectionProps) {
    const t = useTranslations('Statistics');
    const [vehicleStats, setVehicleStats] = useState<VehicleStatistics[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleRegionSelect = useCallback(
        async (regionId: string) => {
            onRegionChange(regionId);
            setIsLoading(true);
            setHasSearched(true);

            try {
                const date = new Date(selectedDate);
                const stats = await getVehicleStatisticsByRegion(regionId, date);
                setVehicleStats(stats);
            } catch (error) {
                console.error('Error fetching vehicle statistics:', error);
                setVehicleStats([]);
            } finally {
                setIsLoading(false);
            }
        },
        [selectedDate, onRegionChange]
    );

    const totalCourses = vehicleStats.reduce((acc, stat) => acc + stat.totalCourses, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {t('vehicleStatistics')}
                </CardTitle>
                <CardDescription>{t('vehicleStatisticsDescription')}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Region Selection */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">{t('selectRegion')}</label>
                        <Select value={selectedRegion} onValueChange={handleRegionSelect}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('selectRegion')} />
                            </SelectTrigger>
                            <SelectContent>
                                {regions.map((region) => (
                                    <SelectItem key={region.id} value={region.id}>
                                        {region.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Vehicle Statistics Table */}
                {hasSearched ? (
                    isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">{t('loading')}</div>
                    ) : vehicleStats.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-2">{t('noCourses')}</p>
                            <p className="text-sm text-muted-foreground">{t('chooseRegionAndDate')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Summary Card */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                                    <CardContent className="pt-6">
                                        <p className="text-sm text-muted-foreground mb-1">{t('totalVehicles')}</p>
                                        <p className="text-3xl font-bold text-blue-600">{vehicleStats.length}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                                    <CardContent className="pt-6">
                                        <p className="text-sm text-muted-foreground mb-1">{t('vehicleCourses')}</p>
                                        <p className="text-3xl font-bold text-green-600">{totalCourses}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Vehicle Statistics Table */}
                            <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>{t('matricule')}</TableHead>
                                            <TableHead>{t('brand')}</TableHead>
                                            <TableHead>{t('model')}</TableHead>
                                            <TableHead className="text-right">{t('courses')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vehicleStats.map((vehicle) => (
                                            <TableRow key={vehicle.vehicleId} className="hover:bg-muted/50">
                                                <TableCell className="font-semibold">{vehicle.matricule}</TableCell>
                                                <TableCell>{vehicle.brand || '—'}</TableCell>
                                                <TableCell>{vehicle.model || '—'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                                                        {vehicle.totalCourses}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="text-center py-12">
                        <Truck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">{t('chooseRegionAndDate')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}