'use client';

import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { MapPin } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { VehicleParkHistory } from '@/actions/vehicle/get-vehicle';

interface VehicleParkHistoryTableProps {
    parkHistory: VehicleParkHistory[];
}

export default function VehicleParkHistoryTable({ parkHistory }: VehicleParkHistoryTableProps) {
    const t = useTranslations('Vehicle');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    {t('park_history')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {parkHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">{t('no_data')}</p>
                ) : (
                    <div className="space-y-2">
                        {parkHistory.slice(0, 5).map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50">
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{item.parkName || 'N/A'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(item.added_at, 'dd MMM yyyy HH:mm')}
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {item.added_by_username || 'System'}
                                </Badge>
                            </div>
                        ))}
                        {parkHistory.length > 5 && (
                            <p className="text-xs text-muted-foreground text-center pt-2">
                                +{parkHistory.length - 5} {t('more')}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
