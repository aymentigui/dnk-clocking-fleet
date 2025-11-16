"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { getClockingStatistics } from "@/actions/vehicle/get-statistics";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
    CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StatisticsData = Awaited<ReturnType<typeof getClockingStatistics>>;

export default function ClockingStatisticsTab() {
    const t = useTranslations("vehicleStatistics");
    const [date, setDate] = useState<Date>(new Date());
    const [clockingType, setClockingType] = useState<string>("all");
    const [minClockings, setMinClockings] = useState<string>("");
    const [data, setData] = useState<StatisticsData | null>(null);
    const [loading, setLoading] = useState(false);

    // Pagination principale pour vehiclesWithClockings (SERVER SIDE)
    const [page, setPage] = useState(1);

    // Pagination locale pour vehiclesWithoutClockings (CLIENT SIDE)
    const [pageWithout, setPageWithout] = useState(1);
    const pageWithoutSize = 10;

    useEffect(() => {
        fetchData();
    }, [date, page]);

    const fetchData = async () => {
        setLoading(true);
        const type = clockingType === "all" ? undefined : parseInt(clockingType);
        const min = minClockings ? parseInt(minClockings) : undefined;
        const result = await getClockingStatistics(date, type, min, page, 20);
        setData(result);
        setLoading(false);

        // Reset pagination local
        setPageWithout(1);
    };

    const handleFilter = () => {
        setPage(1);
        fetchData();
    };

    // Data for client-side pagination for vehiclesWithoutClockings
    const withoutClockings = data?.data?.vehiclesWithoutClockings || [];
    const totalWithoutPages = Math.ceil(withoutClockings.length / pageWithoutSize);
    const currentWithout = withoutClockings.slice(
        (pageWithout - 1) * pageWithoutSize,
        pageWithout * pageWithoutSize
    );

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("clocking.filters")}</CardTitle>
                    <CardDescription>{t("clocking.filtersDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                            <Label>{t("clocking.selectDate")}</Label>
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
                                        {date ? format(date, "PPP") : <span>{t("clocking.pickDate")}</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(d) => d && setDate(d)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>{t("clocking.clockingType")}</Label>
                            <Select value={clockingType} onValueChange={setClockingType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("clocking.allTypes")}</SelectItem>
                                    <SelectItem value="0">{t("clockingTypes.type0")}</SelectItem>
                                    <SelectItem value="1">{t("clockingTypes.type1")}</SelectItem>
                                    <SelectItem value="3">{t("clockingTypes.type3")}</SelectItem>
                                    <SelectItem value="4">{t("clockingTypes.type4")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t("clocking.minClockings")}</Label>
                            <Input
                                type="number"
                                min="0"
                                value={minClockings}
                                onChange={(e) => setMinClockings(e.target.value)}
                                placeholder={t("clocking.minClockingsPlaceholder")}
                            />
                        </div>

                        <div className="flex items-end">
                            <Button onClick={handleFilter} className="w-full">
                                <Search className="mr-2 h-4 w-4" />
                                {t("clocking.search")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : !data?.success || !data.data ? (
                <Card>
                    <CardContent className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">{t("clocking.error")}</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {data.data.clockingsByType.map((clocking) => (
                            <Card key={clocking.type}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {t(`clockingTypes.type${clocking.type}`)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{clocking.count}</div>
                                    <p className="text-xs text-muted-foreground mt-1">{t("clocking.total")}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Vehicles Without Clockings (pagination local) */}
                    {withoutClockings.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("clocking.withoutClocking")}</CardTitle>
                                <CardDescription>
                                    {t("clocking.withoutClockingDescription")} ({withoutClockings.length})
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
                                        {currentWithout.map((vehicle) => (
                                            <TableRow key={vehicle.id}>
                                                <TableCell className="font-medium">
                                                    {vehicle.matricule}
                                                </TableCell>
                                                <TableCell>{vehicle.model}</TableCell>
                                                <TableCell>{vehicle.brand}</TableCell>
                                                <TableCell>{vehicle.park}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {totalWithoutPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPageWithout(pageWithout - 1)}
                                            disabled={pageWithout === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            {t("clocking.previous")}
                                        </Button>

                                        <span className="text-sm text-muted-foreground">
                                            {t("clocking.page")} {pageWithout} {t("clocking.of")} {totalWithoutPages}
                                        </span>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPageWithout(pageWithout + 1)}
                                            disabled={pageWithout === totalWithoutPages}
                                        >
                                            {t("clocking.next")}
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Vehicles WITH Clockings (server pagination) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("clocking.withClocking")}</CardTitle>
                            <CardDescription>
                                {t("clocking.withClockingDescription")}
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
                                        <TableHead>{t("table.region")}</TableHead>
                                        <TableHead className="text-right">
                                            {t("table.clockings")}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {data.data.vehiclesWithClockings.length > 0 ? (
                                        data.data.vehiclesWithClockings.map((vehicle) => (
                                            <TableRow key={vehicle.vehicle_id}>
                                                <TableCell className="font-medium">
                                                    {vehicle.matricule}
                                                </TableCell>
                                                <TableCell>{vehicle.model}</TableCell>
                                                <TableCell>{vehicle.brand}</TableCell>
                                                <TableCell>{vehicle.park}</TableCell>
                                                <TableCell>{vehicle.region}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="default">
                                                        {vehicle.clockingCount}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="text-center text-muted-foreground"
                                            >
                                                {t("clocking.noData")}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {/* Server Pagination */}
                            {data.data.pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        {t("clocking.page")}{" "}
                                        {data.data.pagination.currentPage} {t("clocking.of")}{" "}
                                        {data.data.pagination.totalPages} (
                                        {data.data.pagination.totalItems} {t("clocking.items")})
                                    </p>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page - 1)}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            {t("clocking.previous")}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page + 1)}
                                            disabled={page === data.data.pagination.totalPages}
                                        >
                                            {t("clocking.next")}
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
