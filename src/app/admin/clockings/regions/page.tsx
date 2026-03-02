"use client";

import { useState, useEffect } from "react";
import { Calendar, RefreshCw, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getRegionStatistics, getRegionClockings } from "@/actions/clocking/get";
import { useTranslations } from "next-intl";
import { getAllRegions } from "@/actions/clocking/get-statistics-courses";
import StatisticsContent from "../_component/statistic-content";
import { getAllRegions as getAllRegions2, getRegionStatistics as getRegionStatistics2 } from '@/actions/clocking/get-statistics-courses';

// Format date helper
const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
};

const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });
};

export default function RegionStatisticsPage() {
    const t = useTranslations();
    const [date, setDate] = useState<Date>(new Date());
    const [statistics, setStatistics] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [clockings, setClockings] = useState<any[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [initialStats, setInitialStats] = useState<any>(null);
    const [regions, setRegions] = useState<any[]>([]);

    useEffect(() => {
        loadStatistics();
    }, [date]);

    async function handleRefresh(date: Date): Promise<void> {
        // Server action placeholder
    }

    const loadStatistics = async () => {
        setLoading(true);
        try {
            const [initialStats, regions] = await Promise.all([
                getRegionStatistics2(new Date()),
                getAllRegions2(),
            ]);

            setInitialStats(initialStats);
            setRegions(regions);

            const result = await getRegionStatistics(date);
            if (result.success && result.data) {
                setStatistics(result.data);
            }
        } catch (error) {
            console.error("Error loading statistics:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegionClick = async (regionId: string) => {
        setSelectedRegion(regionId);
        setDialogOpen(true);

        const result = await getRegionClockings(regionId, date);
        if (result.success && result.data) {
            setClockings(result.data);
        }
    };

    return (
        <Card className="w-full p-4">
            <div className="container mx-auto py-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t("Clocking.regionStatistics")}</h1>
                        <p className="text-muted-foreground">{t("Clocking.regionStatisticsDescription")}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {formatDate(date)}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <CalendarComponent
                                    mode="single"
                                    selected={date}
                                    onSelect={(newDate) => newDate && setDate(newDate)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Button onClick={loadStatistics} disabled={loading} size="icon" variant="outline">
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="rounded-md border">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="h-12 px-4 text-left align-middle font-medium">{t("Clocking.region")}</th>
                                        {/* <th className="h-12 px-4 text-left align-middle font-medium">{t("Clocking.description")}</th> */}
                                        <th className="h-12 px-4 text-center align-middle font-medium">{t("Clocking.totalClockings")}</th>
                                        <th className="h-12 px-4 text-center align-middle font-medium">{t("Clocking.totalVehicles")}</th>
                                        <th className="h-12 px-4 text-center align-middle font-medium">{t("Clocking.entries")}</th>
                                        <th className="h-12 px-4 text-center align-middle font-medium">{t("Clocking.exits")}</th>
                                        <th className="h-12 px-4 text-center align-middle font-medium">{t("Clocking.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statistics.map((region) => (
                                        <tr key={region.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle">
                                                <p className="font-medium">{region.name}</p>
                                            </td>
                                            {/* <td className="p-4 align-middle">
                                                <p className="text-sm text-muted-foreground">{region.description || "-"}</p>
                                            </td> */}
                                            <td className="p-4 align-middle text-center">
                                                <p className="text-lg font-bold">{region.totalClockings}</p>
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <p className="text-lg font-bold">{region.uniqueTotalVehicles}</p>
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <Badge variant="default">{region.entryClockings}</Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {region.uniqueEntryVehicles} {t("Clocking.vehicles")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <Badge variant="destructive">{region.exitClockings}</Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {region.uniqueExitVehicles} {t("Clocking.vehicles")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRegionClick(region.id)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {statistics.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center py-16">
                                <p className="text-muted-foreground">{t("Clocking.noDataAvailable")}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{t("Clocking.regionClockings")}</DialogTitle>
                            <DialogDescription>
                                {t("Clocking.regionClockingsFor")} {formatDate(date)}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4">
                            <div className="rounded-md border">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="h-12 px-4 text-left align-middle font-medium">{t("Clocking.time")}</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium">{t("Clocking.vehicle")}</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium">{t("Clocking.conducteur")}</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium">{t("Clocking.type")}</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium">{t("Clocking.park")}</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium">{t("Clocking.device")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clockings.map((clocking) => (
                                            <tr key={clocking.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle font-mono text-sm">
                                                    {formatTime(new Date(clocking.created_at))}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div>
                                                        <p className="font-medium">{clocking.vehicle?.matricule || "-"}</p>
                                                        <p className="text-xs text-muted-foreground">{clocking.vehicle?.brand} {clocking.vehicle?.model}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div>
                                                        <p className="font-medium">{clocking.conducteur_name || "-"}</p>
                                                        <p className="text-xs text-muted-foreground">{clocking.conducteur_matricule || "-"}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant={clocking.type === 3 ? "destructive" : "default"}>
                                                        {clocking.type === 3 ? t("Clocking.exit") : clocking.type === 4 ? t("Clocking.entry") : "-"}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle">{clocking.park?.name || "-"}</td>
                                                <td className="p-4 align-middle">{clocking.device?.code || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {clockings.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <p className="text-muted-foreground">{t("Clocking.noClockings")}</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {
                    initialStats && regions.length > 0 && (
                        <StatisticsContent
                            initialStats={initialStats}
                            regions={regions}
                            onRefresh={handleRefresh}
                        />
                    )
                }
            </div>
        </Card>
    );
}