'use client';

import { useTranslations } from 'next-intl';
import { TrendingUp, Truck, Hourglass, CheckCircle, Clock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RegionStatistics } from '@/actions/clocking/get-statistics-courses';

interface StatisticsCardsProps {
    statistics: RegionStatistics[];
}

export default function StatisticsCards({ statistics }: StatisticsCardsProps) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statistics.map((stat) => (
                <Card key={stat.regionId} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span>{stat.regionName}</span>
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Truck className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Total Courses */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-slate-600" />
                                <span className="text-sm text-muted-foreground">{t('totalCourses')}</span>
                            </div>
                            <span className="font-semibold text-lg">{stat.totalCourses}</span>
                        </div>

                        {/* Pending Courses */}
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Hourglass className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm text-muted-foreground">{t('pendingCourses')}</span>
                            </div>
                            <span className="font-semibold text-lg text-yellow-600">{stat.pendingCourses}</span>
                        </div>

                        {/* In Progress Courses */}
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-muted-foreground">{t('inProgressCourses')}</span>
                            </div>
                            <span className="font-semibold text-lg text-blue-600">{stat.inProgressCourses}</span>
                        </div>

                        {/* Completed Courses */}
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-muted-foreground">{t('completedCourses')}</span>
                            </div>
                            <span className="font-semibold text-lg text-green-600">{stat.completedCourses}</span>
                        </div>

                        {/* Vehicles & Average */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <div className="text-center p-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">{t('totalVehicles')}</p>
                                <p className="text-xl font-bold text-purple-600">{stat.totalVehicles}</p>
                            </div>
                            <div className="text-center p-2 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">{t('averagePerVehicle')}</p>
                                <p className="text-xl font-bold text-indigo-600">
                                    {stat.averageCoursesPerVehicle.toFixed(1)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
