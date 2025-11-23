'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getVehicleClockings, VehicleClocking } from '@/actions/vehicle/get-vehicle';

interface VehicleClockingsTableProps {
    vehicleId: string;
    selectedDate: string;
    initialClockings: VehicleClocking[];
    onDateChange: (date: string) => void;
}

export default function VehicleClockingsTable({
    vehicleId,
    selectedDate,
    initialClockings,
    onDateChange,
}: VehicleClockingsTableProps) {
    const t = useTranslations('Vehicle');
    const t2 = useTranslations('Clocking');
    const [clockings, setClockings] = useState<VehicleClocking[]>(initialClockings);
    const [isLoading, setIsLoading] = useState(false);

    const handleDateChange = useCallback(
        async (newDate: string) => {
            onDateChange(newDate);
            setIsLoading(true);

            try {
                const date = new Date(newDate);
                const newClockings = await getVehicleClockings(vehicleId, date);
                setClockings(newClockings);
            } catch (error) {
                console.error('Error fetching clockings:', error);
            } finally {
                setIsLoading(false);
            }
        },
        [vehicleId, onDateChange]
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {t('clockings')}
                    </CardTitle>
                    <div className="flex gap-2 items-center">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="px-2 py-1 border rounded-md text-sm"
                            disabled={isLoading}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDateChange(format(new Date(), 'yyyy-MM-dd'))}
                            disabled={isLoading}
                        >
                            {t('today')}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {clockings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">{t('no_clockings')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('time')}</TableHead>
                                    <TableHead>{t('park')}</TableHead>
                                    <TableHead>{t('driver')}</TableHead>
                                    <TableHead className="text-right">{t('type')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clockings.map((clocking) => (
                                    <TableRow key={clocking.id} className="hover:bg-muted/50">
                                        <TableCell className="font-mono text-sm">
                                            {format(clocking.created_at, 'HH:mm:ss')}
                                        </TableCell>
                                        <TableCell>{clocking.parkName || 'N/A'}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-semibold text-sm">{clocking.conducteur_name || 'N/A'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {clocking.conducteur_matricule || 'N/A'}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary">{
                                                clocking.type === 0 ? t2('exit') 
                                                : clocking.type === 1 ? t2('entry')
                                                : clocking.type === 3 ? t2("controller")+" "+t2('exit')
                                                : clocking.type === 4 ? t2("controller")+" "+t2('entry')
                                                : "N/A"
                                            }</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}