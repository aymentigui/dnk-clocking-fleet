"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { getGlobalStatistics, type PeriodType } from "@/actions/vehicle/get-statistics";
import { Bus, TrendingUp, TrendingDown, Activity, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type StatisticsData = Awaited<ReturnType<typeof getGlobalStatistics>>;

export default function GlobalStatisticsTab() {
    const t = useTranslations("vehicleStatistics");
    const [period, setPeriod] = useState<PeriodType>("today");
    const [data, setData] = useState<StatisticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        setLoading(true);
        const result = await getGlobalStatistics(period);
        setData(result);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data?.success || !data.data) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">{t("global.error")}</p>
                </CardContent>
            </Card>
        );
    }

    const stats = data.data;

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("global.periodSelector")}</CardTitle>
                    <CardDescription>{t("global.periodDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
                        <SelectTrigger className="w-full sm:w-[280px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">{t("periods.today")}</SelectItem>
                            <SelectItem value="3days">{t("periods.3days")}</SelectItem>
                            <SelectItem value="week">{t("periods.week")}</SelectItem>
                            <SelectItem value="month">{t("periods.month")}</SelectItem>
                            <SelectItem value="3months">{t("periods.3months")}</SelectItem>
                            <SelectItem value="year">{t("periods.year")}</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("global.totalVehicles")}</CardTitle>
                        <Bus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalVehicles}</div>
                        <p className="text-xs text-muted-foreground mt-1">{t("global.activeVehicles")}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("global.workedVehicles")}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.totalWorkedVehicles}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("global.utilizationRate")}: {stats.utilizationRate}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("global.withoutClocking")}</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.vehiclesWithoutClocking}</div>
                        <p className="text-xs text-muted-foreground mt-1">{t("global.noActivity")}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("global.withCourses")}</CardTitle>
                        <Activity className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.totalVehiclesWithCourses}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("global.withoutCourses")}: {stats.vehiclesWithoutCourses}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Clocking Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("global.clockingStats")}</CardTitle>
                    <CardDescription>{t("global.clockingStatsDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        {stats.clockingsByType.map((clocking) => (
                            <div key={clocking.type} className="flex flex-col p-4 border rounded-lg">
                                <span className="text-sm text-muted-foreground">
                                    {t(`clockingTypes.type${clocking.type}`)}
                                </span>
                                <span className="text-2xl font-bold mt-1">{clocking.count}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Course Statistics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("global.totalCourses")}</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCourses}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("global.completedCourses")}</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.completedCourses}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("global.pendingCourses")}</CardTitle>
                        <Clock className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.pendingCourses}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("global.waitingCourses")}</CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.waitingCourses}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Vehicles by Clocking */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("global.topVehiclesClocking")}</CardTitle>
                    <CardDescription>{t("global.topVehiclesClockingDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("table.rank")}</TableHead>
                                <TableHead>{t("table.matricule")}</TableHead>
                                <TableHead>{t("table.model")}</TableHead>
                                <TableHead>{t("table.brand")}</TableHead>
                                <TableHead className="text-right">{t("table.clockings")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.topVehiclesByClocking.map((vehicle, index) => (
                                <TableRow key={vehicle.vehicle_id}>
                                    <TableCell>
                                        <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{vehicle.matricule}</TableCell>
                                    <TableCell>{vehicle.model}</TableCell>
                                    <TableCell>{vehicle.brand}</TableCell>
                                    <TableCell className="text-right font-bold">{vehicle.count}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Top Vehicles by Courses */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("global.topVehiclesCourses")}</CardTitle>
                    <CardDescription>{t("global.topVehiclesCoursesDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("table.rank")}</TableHead>
                                <TableHead>{t("table.matricule")}</TableHead>
                                <TableHead>{t("table.model")}</TableHead>
                                <TableHead>{t("table.brand")}</TableHead>
                                <TableHead className="text-right">{t("table.courses")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.topVehiclesByCourses.map((vehicle, index) => (
                                <TableRow key={vehicle.vehicle_id}>
                                    <TableCell>
                                        <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{vehicle.matricule}</TableCell>
                                    <TableCell>{vehicle.model}</TableCell>
                                    <TableCell>{vehicle.brand}</TableCell>
                                    <TableCell className="text-right font-bold">{vehicle.count}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}