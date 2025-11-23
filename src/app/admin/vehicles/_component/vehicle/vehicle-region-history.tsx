'use client';

import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Navigation } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VehicleRegionHistory } from '@/actions/vehicle/get-vehicle';

interface VehicleRegionHistoryTableProps {
    regionHistory: VehicleRegionHistory[];
}

export default function VehicleRegionHistoryTable({ regionHistory }: VehicleRegionHistoryTableProps) {
    const t = useTranslations('Vehicle');

    const getTypeLabel = (type: string | null) => {
        if (type === '1') return t('region_type_1');
        if (type === '2') return t('region_type_2');
        return type || 'Unknown';
    };

    const getTypeBadgeColor = (type: string | null) => {
        if (type === '1') return 'bg-blue-100 text-blue-800';
        if (type === '2') return 'bg-purple-100 text-purple-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Navigation className="h-5 w-5" />
                    {t('region_history')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {regionHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">{t('no_data')}</p>
                ) : (
                    <div className="space-y-2">
                        {regionHistory.slice(0, 5).map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm">{item.regionName || 'N/A'}</p>
                                        <Badge className={getTypeBadgeColor(item.type)} variant="outline">
                                            {getTypeLabel(item.type)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {format(item.added_at, 'dd MMM yyyy HH:mm')}
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {item.added_by_username || 'System'}
                                </Badge>
                            </div>
                        ))}
                        {regionHistory.length > 5 && (
                            <p className="text-xs text-muted-foreground text-center pt-2">
                                +{regionHistory.length - 5} {t('more')}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}