"use client"
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Moon, Sun, RefreshCcw, Globe, Timer, Activity, Bus, BarChart3, Filter, Search, Loader2 } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { format } from "date-fns";


import { getClockingsVehicleNow } from "@/actions/clocking/get";
import { getParksAdmin } from "@/actions/park/get";
import { useLocale, useTranslations } from "next-intl";

// For this demo file, we'll type the responses and provide placeholder fetchers that you should replace.

/** TYPES **/
type Clocking = {
    id: string;
    created_at: string | Date;
    type: 0 | 1 | 3 | 4; // 0: Exit Park, 1: Enter Park, 3: Enter Region, 4: Exit Region
    vehicle_id: string;
    park_id: string | null;
    region_id?: string | null;
    vehicle?: { matricule?: string };
    park?: { name?: string } | null;
    conducteur?: { name?: string } | null;
};

type NowStats = {
    countClockings: number;
    countExitParcClockings: number;
    countEnterParcClockings: number;
    countEnterRegionClockings: number;
    countExitRegionClockings: number;
    countVehicleWithoutEnteringRegion: number;
    countVehicles: number;
};

type Park = { id: string; name: string };

/** HELPERS **/
const fmtNum = (n: number) => new Intl.NumberFormat().format(n);

const TYPES_COLORS: Record<number, string> = {
    0: "#ef4444", // red-500
    1: "#22c55e", // green-500
    3: "#3b82f6", // blue-500
    4: "#f59e0b", // amber-500
};

/** FETCHERS (REPLACE with your server functions) **/
async function fetchParks(): Promise<Park[]> {
    return (await getParksAdmin()).data as Park[];
}

async function fetchNow(params: { vehicle_id?: string; park?: string; region?: string }): Promise<NowStats> {
    const resp = await getClockingsVehicleNow(params.vehicle_id, params.park, params.region);
    return resp.data as NowStats;
}

/** UI BUILDING BLOCKS **/
function StatCard({
    title,
    value,
    icon,
    accent,
}: {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    accent?: string;
}) {
    return (
        <Card className="overflow-hidden border-border/50 bg-gradient-to-b from-background to-muted/30">
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">{title}</div>
                    <div className={`rounded-xl p-2 ${accent ?? "bg-muted"}`}>{icon}</div>
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
            </CardContent>
        </Card>
    );
}


/** MAIN DASHBOARD **/
export default function PCCDashboard() {
    const t = useTranslations("StatisticsClockings")
    const lang = useLocale()
    const isRTL = lang === "ar";

    const REFRESH_MS = 10 * 60 * 1000; // 10 minutes
    const [nextInMs, setNextInMs] = useState<number>(REFRESH_MS);
    const timerRef = useRef<number | null>(null);

    const [parks, setParks] = useState<Park[]>([]);
    const [parkFilter, setParkFilter] = useState<string>("all");
    const [regionFilter, setRegionFilter] = useState<string>("all");

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

    const [global, setGlobal] = useState<NowStats | null>(null);
    const [perPark, setPerPark] = useState<Record<string, NowStats | null>>({});

    // Fetch parks once
    useEffect(() => {
        (async () => {
            try {
                const list = await fetchParks();
                setParks(list);
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    // Countdown timer
    useEffect(() => {
        const start = Date.now();
        timerRef.current = window.setInterval(() => {
            const elapsed = Date.now() - start;
            const remaining = Math.max(REFRESH_MS - (elapsed % REFRESH_MS), 0);
            setNextInMs(remaining);
        }, 1000);
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, []);

    // Auto refresh
    useEffect(() => {
        const id = window.setInterval(() => {
            doRefresh();
        }, REFRESH_MS);
        return () => window.clearInterval(id);
    }, []);

    const doRefresh = async () => {
        setLoading(true);
        setError(null);
        try {
            // Global (with current filters)
            const g = await fetchNow({ park: parkFilter, region: regionFilter });
            setGlobal(g);

            // Per park (ignore current parkFilter to render all parks side-by-side)
            const per: Record<string, NowStats> = {} as any;
            for (const p of parks) {
                const pStats = await fetchNow({ park: p.id, region: regionFilter });
                per[p.id] = pStats;
            }
            setPerPark(per);
            setUpdatedAt(new Date());
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to refresh");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load + reload when filters change
        doRefresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parkFilter, regionFilter, parks.length, lang]);

    const nextInMin = Math.floor(nextInMs / 60000);
    const nextInSec = Math.floor((nextInMs % 60000) / 1000)
        .toString()
        .padStart(2, "0");

    // Direction + font tweaks for RTL
    useEffect(() => {
        document.documentElement.dir = isRTL ? "rtl" : "ltr";
    }, [isRTL]);

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground px-4 sm:px-6 py-6 space-y-6 transition-colors">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t("title")}</h1>
                        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
                    </div>
                </div>

                {/* Controls Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">{t("updatedAt")}</div>
                                <div className="font-medium">{updatedAt ? format(updatedAt, "yyyy-MM-dd HH:mm") : "—"}</div>
                            </div>
                            <Badge variant="secondary" className="gap-1">
                                <Timer className="h-3 w-3" />
                                {t("nextIn")} {nextInMin}:{nextInSec}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t("park")}</Label>
                                <Select value={parkFilter} onValueChange={setParkFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder={t("park")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("all")}</SelectItem>
                                        {parks.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Filter className="h-4 w-4 text-muted-foreground" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t("region")}</Label>
                                <Select value={regionFilter} onValueChange={setRegionFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder={t("region")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("all")}</SelectItem>
                                        {/* Populate your regions here if you have them */}
                                        {/* <SelectItem value="regionId">Region Name</SelectItem> */}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Filter className="h-4 w-4 text-muted-foreground" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">{t("manualRefresh")}</div>
                                <Button onClick={doRefresh} disabled={loading} className="gap-2 h-8">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                                    {t("manualRefresh")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                        {error}
                    </div>
                )}

                {/* GLOBAL METRICS */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">{t("global")}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard
                            title={t("metrics.clockings")}
                            value={global ? fmtNum(global.countClockings) : "—"}
                            icon={<Activity className="h-4 w-4" />}
                            accent="bg-primary/10"
                        />
                        <StatCard
                            title={t("metrics.exitPark")}
                            value={global ? fmtNum(global.countExitParcClockings) : "—"}
                            icon={<span className="inline-block h-3 w-3 rounded-full" style={{ background: TYPES_COLORS[0] }} />}
                        />
                        <StatCard
                            title={t("metrics.enterPark")}
                            value={global ? fmtNum(global.countEnterParcClockings) : "—"}
                            icon={<span className="inline-block h-3 w-3 rounded-full" style={{ background: TYPES_COLORS[1] }} />}
                        />
                        <StatCard
                            title={t("metrics.totalVehicles")}
                            value={global ? fmtNum(global.countVehicles) : "—"}
                            icon={<Bus className="h-4 w-4" />}
                        />
                        <StatCard
                            title={t("metrics.enterRegion")}
                            value={global ? fmtNum(global.countEnterRegionClockings) : "—"}
                            icon={<span className="inline-block h-3 w-3 rounded-full" style={{ background: TYPES_COLORS[3] }} />}
                        />
                        <StatCard
                            title={t("metrics.exitRegion")}
                            value={global ? fmtNum(global.countExitRegionClockings) : "—"}
                            icon={<span className="inline-block h-3 w-3 rounded-full" style={{ background: TYPES_COLORS[4] }} />}
                        />
                        <StatCard
                            title={t("metrics.exitedNotEnteredRegion")}
                            value={global ? fmtNum(global.countVehicleWithoutEnteringRegion) : "—"}
                            icon={<span className="inline-block h-3 w-3 rounded-full" style={{ background: "#8b5cf6" }} />}
                        />
                    </div>

                </section>

                {/* PER PARK */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">{t("byPark")}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {parks.map((p) => {
                            const stats = perPark[p.id];
                            if (!stats) return null;
                            return (
                                <Card key={p.id} className="border-border/50 bg-gradient-to-b from-background to-muted/30">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold">{p.name}</h3>
                                            <Badge variant="secondary">{fmtNum(stats.countClockings)} {t("metrics.clockings")}</Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span>{t("metrics.exitPark")}</span>
                                                <span>{fmtNum(stats.countExitParcClockings)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>{t("metrics.enterPark")}</span>
                                                <span>{fmtNum(stats.countEnterParcClockings)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>{t("metrics.enterRegion")}</span>
                                                <span>{fmtNum(stats.countEnterRegionClockings)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>{t("metrics.exitRegion")}</span>
                                                <span>{fmtNum(stats.countExitRegionClockings)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>{t("metrics.exitedNotEnteredRegion")}</span>
                                                <span>{fmtNum(stats.countVehicleWithoutEnteringRegion)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>{t("metrics.totalVehicles")}</span>
                                                <span>{fmtNum(stats.countVehicles)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </section>

            </div>
        </TooltipProvider>
    );
}
