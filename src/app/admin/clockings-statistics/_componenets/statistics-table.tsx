'use client';

import { useTranslations } from 'next-intl';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RegionStatistics } from '@/actions/clocking/get-statistics-courses';

interface StatisticsTableProps {
    statistics: RegionStatistics[];
    averageCoursesPerVehicle: string;
}

export default function StatisticsTable({
    statistics,
    averageCoursesPerVehicle,
}: StatisticsTableProps) {
    const t = useTranslations('Statistics');

    if (statistics.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">{t('noData')}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('region')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('region')}</TableHead>
                                <TableHead className="text-right">{t('totalCourses')}</TableHead>
                                <TableHead className="text-right">{t('pendingCourses')}</TableHead>
                                <TableHead className="text-right">{t('completedCourses')}</TableHead>
                                <TableHead className="text-right">{t('inProgressCourses')}</TableHead>
                                <TableHead className="text-right">{t('totalVehicles')}</TableHead>
                                <TableHead className="text-right">{t('averagePerVehicle')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {statistics.map((stat) => (
                                <TableRow key={stat.regionId} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">{stat.regionName}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="secondary">{stat.totalCourses}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                            {stat.pendingCourses}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                            {stat.completedCourses}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                            {stat.inProgressCourses}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline">{stat.totalVehicles}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {stat.averageCoursesPerVehicle.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}