"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { getCourseStatistics } from "@/actions/vehicle/get-statistics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2, Search, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StatisticsData = Awaited<ReturnType<typeof getCourseStatistics>>;

export default function CourseStatisticsTab() {
    const t = useTranslations("vehicleStatistics");
    const [date, setDate] = useState<Date>(new Date());
    const [minCourses, setMinCourses] = useState<string>("");
    const [data, setData] = useState<StatisticsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [activeSubTab, setActiveSubTab] = useState("completed");

    useEffect(() => {
        fetchData();
    }, [date, page]);

    const fetchData = async () => {
        setLoading(true);
        const min = minCourses ? parseInt(minCourses) : undefined;
        const result = await getCourseStatistics(date, min, page, 20);
        setData(result);
        setLoading(false);
    };

    const handleFilter = () => {
        setPage(1);
        fetchData();
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("course.filters")}</CardTitle>
                    <CardDescription>{t("course.filtersDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>{t("course.selectDate")}</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>{t("course.pickDate")}</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>{t("course.minCourses")}</Label>
                            <Input
                                type="number"
                                min="0"
                                value={minCourses}
                                onChange={(e) => setMinCourses(e.target.value)}
                                placeholder={t("course.minCoursesPlaceholder")}
                            />
                        </div>

                        <div className="flex items-end">
                            <Button onClick={handleFilter} className="w-full">
                                <Search className="mr-2 h-4 w-4" />
                                {t("course.search")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : !data?.success || !data.data ? (
                <Card>
                    <CardContent className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">{t("course.error")}</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t("course.completed")}</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{data.data.completedCourses}</div>
                                <p className="text-xs text-muted-foreground mt-1">{t("course.completedDescription")}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t("course.pending")}</CardTitle>
                                <Clock className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{data.data.pendingCourses}</div>
                                <p className="text-xs text-muted-foreground mt-1">{t("course.pendingDescription")}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t("course.waiting")}</CardTitle>
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">{data.data.waitingCourses}</div>
                                <p className="text-xs text-muted-foreground mt-1">{t("course.waitingDescription")}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t("course.withoutCourses")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{data.data.vehiclesWithoutCourses.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">{t("course.noActivity")}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Vehicles Without Courses */}
                    {data.data.vehiclesWithoutCourses.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("course.withoutCourses")}</CardTitle>
                                <CardDescription>
                                    {t("course.withoutCoursesDescription")} ({data.data.vehiclesWithoutCourses.length})
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t("table.matricule")}</TableHead>
                                            <TableHead>{t("table.model")}</TableHead>
                                            <TableHead>{t("table.brand")}</TableHead>
                                            <TableHead>{t("table.park")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.data.vehiclesWithoutCourses.slice(0, 10).map((vehicle) => (
                                            <TableRow key={vehicle.id}>
                                                <TableCell className="font-medium">{vehicle.matricule}</TableCell>
                                                <TableCell>{vehicle.model}</TableCell>
                                                <TableCell>{vehicle.brand}</TableCell>
                                                <TableCell>{vehicle.park}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {data.data.vehiclesWithoutCourses.length > 10 && (
                                    <p className="text-sm text-muted-foreground mt-4 text-center">
                                        {t("course.showingFirst")} 10 {t("course.of")} {data.data.vehiclesWithoutCourses.length}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Tabs for Different Course Types */}
                    <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="completed">{t("course.completed")}</TabsTrigger>
                            <TabsTrigger value="pending">{t("course.pending")}</TabsTrigger>
                            <TabsTrigger value="waiting">{t("course.waiting")}</TabsTrigger>
                        </TabsList>

                        {/* Completed Courses */}
                        <TabsContent value="completed">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("course.completedCourses")}</CardTitle>
                                    <CardDescription>{t("course.completedCoursesDescription")}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("table.matricule")}</TableHead>
                                                <TableHead>{t("table.model")}</TableHead>
                                                <TableHead>{t("table.brand")}</TableHead>
                                                <TableHead>{t("table.park")}</TableHead>
                                                <TableHead>{t("table.region")}</TableHead>
                                                <TableHead className="text-right">{t("table.courses")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.data.vehiclesWithCompletedCourses.length > 0 ? (
                                                data.data.vehiclesWithCompletedCourses.map((vehicle) => (
                                                    <TableRow key={vehicle.vehicle_id}>
                                                        <TableCell className="font-medium">{vehicle.matricule}</TableCell>
                                                        <TableCell>{vehicle.model}</TableCell>
                                                        <TableCell>{vehicle.brand}</TableCell>
                                                        <TableCell>{vehicle.park}</TableCell>
                                                        <TableCell>{vehicle.region}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge variant="default" className="bg-green-600">{vehicle.completedCourseCount}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                                        {t("course.noData")}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination */}
                                    {data.data.pagination.totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4">
                                            <p className="text-sm text-muted-foreground">
                                                {t("course.page")} {data.data.pagination.currentPage} {t("course.of")}{" "}
                                                {data.data.pagination.totalPages} ({data.data.pagination.totalItems} {t("course.items")})
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPage(page - 1)}
                                                    disabled={page === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    {t("course.previous")}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPage(page + 1)}
                                                    disabled={page === data.data.pagination.totalPages}
                                                >
                                                    {t("course.next")}
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Pending Courses */}
                        <TabsContent value="pending">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("course.pendingCourses")}</CardTitle>
                                    <CardDescription>{t("course.pendingCoursesDescription")}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("table.matricule")}</TableHead>
                                                <TableHead>{t("table.model")}</TableHead>
                                                <TableHead>{t("table.brand")}</TableHead>
                                                <TableHead>{t("table.park")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.data.vehiclesWithPending.length > 0 ? (
                                                data.data.vehiclesWithPending.map((vehicle) => (
                                                    <TableRow key={vehicle.vehicle_id}>
                                                        <TableCell className="font-medium">{vehicle.matricule}</TableCell>
                                                        <TableCell>{vehicle.model}</TableCell>
                                                        <TableCell>{vehicle.brand}</TableCell>
                                                        <TableCell>{vehicle.park}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                        {t("course.noData")}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Waiting Courses */}
                        <TabsContent value="waiting">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("course.waitingCourses")}</CardTitle>
                                    <CardDescription>{t("course.waitingCoursesDescription")}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("table.matricule")}</TableHead>
                                                <TableHead>{t("table.model")}</TableHead>
                                                <TableHead>{t("table.brand")}</TableHead>
                                                <TableHead>{t("table.park")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.data.vehiclesWithWaiting.length > 0 ? (
                                                data.data.vehiclesWithWaiting.map((vehicle) => (
                                                    <TableRow key={vehicle.vehicle_id}>
                                                        <TableCell className="font-medium">{vehicle.matricule}</TableCell>
                                                        <TableCell>{vehicle.model}</TableCell>
                                                        <TableCell>{vehicle.brand}</TableCell>
                                                        <TableCell>{vehicle.park}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                        {t("course.noData")}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
}