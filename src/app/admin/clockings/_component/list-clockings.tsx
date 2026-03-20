"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Calendar, Clock, Car, User, AlertTriangle, MapPin,
    RotateCcw, ChevronLeft, ChevronRight, Search,
    TrendingUp, Filter, X,
} from "lucide-react";

import { LocationMapDialog } from "@/components/dialogs/LocationMapDialog";
import { getClockings } from "@/actions/clocking/get";
import { getParksAdmin } from "@/actions/park/get";
import { getPositionVehicle } from "@/actions/vehicle/get";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Clocking {
    id: string;
    created_at: string;
    vehicle: string;
    device: any;
    deviceType: number;
    type: number;
    conducteur_matricule?: string;
    conducteur_name?: string;
    conducteur_id?: string;
    status: any;
    park: string;
    vehicle_id: string;
}

interface VehicleWithoutRegion {
    id: string;
    vehicle_id: string;
    vehicle_matricule: string;
    exit_time: string;
    exit_park: string;
    conducteur_name?: string;
    conducteur_matricule?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<number, string> = {
    0: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
    1: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    2: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    3: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
    4: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
};

// ─────────────────────────────────────────────────────────────────────────────
//  STAT CARD
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
    label, value, sub, icon: Icon, gradient,
}: {
    label: string; value: number | string; sub?: string;
    icon: React.ElementType; gradient: string;
}) {
    return (
        <Card className={`${gradient} text-white shadow-lg border-0 overflow-hidden relative`}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0">
                        <p className="text-white/70 text-xs font-medium uppercase tracking-wider truncate">{label}</p>
                        <p className="text-3xl font-bold tabular-nums">{value}</p>
                        {sub && <p className="text-white/60 text-xs">{sub}</p>}
                    </div>
                    <div className="bg-white/15 p-2.5 rounded-xl shrink-0 ml-2">
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
                {/* decorative circle */}
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FILTERS BAR
// ─────────────────────────────────────────────────────────────────────────────

function FiltersBar({
    searchDate, onDateChange,
    parks, parkFilter, onParkChange,
    typeFilter, onTypeChange,
    statusFilter, onStatusChange,
    onReset,
    t, s,
}: {
    searchDate: string; onDateChange: (v: string) => void;
    parks: any[]; parkFilter: string; onParkChange: (v: string) => void;
    typeFilter: string; onTypeChange: (v: string) => void;
    statusFilter: string; onStatusChange: (v: string) => void;
    onReset: () => void;
    t: any; s: any;
}) {
    const hasFilter = searchDate || parkFilter || typeFilter || statusFilter;

    const selectCls = "h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400/40 w-full";

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm p-4 mb-5">
            <div className="flex flex-wrap gap-3 items-end">

                {/* Date */}
                <div className="flex flex-col gap-1 min-w-[140px] flex-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("filter_by_date")}</label>
                    <input
                        type="date" value={searchDate}
                        onChange={(e) => onDateChange(e.target.value)}
                        className={selectCls}
                    />
                </div>

                {/* Park */}
                {parks.length > 0 && (
                    <div className="flex flex-col gap-1 min-w-[140px] flex-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("filter_by_park")}</label>
                        <select value={parkFilter} onChange={(e) => onParkChange(e.target.value)} className={selectCls}>
                            <option value="">{t("all_parks")}</option>
                            {parks.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                )}

                {/* Type */}
                <div className="flex flex-col gap-1 min-w-[130px] flex-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("filter_by_type")}</label>
                    <select value={typeFilter} onChange={(e) => onTypeChange(e.target.value)} className={selectCls}>
                        <option value="">{t("all")}</option>
                        <option value="0">{t("exit")}</option>
                        <option value="1">{t("entry")}</option>
                        <option value="3">{t("controller")} {t("exit")}</option>
                        <option value="4">{t("controller")} {t("entry")}</option>
                    </select>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1 min-w-[130px] flex-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("filter_by_status")}</label>
                    <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className={selectCls}>
                        <option value="">{t("all")}</option>
                        <option value="1">✓ OK</option>
                        <option value="0">✗ NOK</option>
                    </select>
                </div>

                {/* Reset */}
                {hasFilter && (
                    <Button
                        variant="ghost" size="sm" onClick={onReset}
                        className="h-9 gap-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg self-end shrink-0"
                    >
                        <X className="w-3.5 h-3.5" /> {s("reset") ?? "Reset"}
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  CLOCKINGS TABLE
// ─────────────────────────────────────────────────────────────────────────────

function ClockingsTable({ clockings, loading, t, s }: {
    clockings: Clocking[]; loading: boolean; t: any; s: any;
}) {
    const getTypeLabel = (type: number) => {
        switch (type) {
            case 0: return t("exit");
            case 1: return t("entry");
            case 2: return t("entry_exit");
            case 3: return `${t("controller")} ${t("exit")}`;
            case 4: return `${t("controller")} ${t("entry")}`;
            default: return "—";
        }
    };
    const getDeviceLabel = (type: number) => {
        switch (type) {
            case 0: return t("exit");
            case 1: return t("entry");
            case 2: return t("entry_exit");
            case 3: case 4: return t("controller");
            default: return "—";
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                <p className="text-sm text-slate-400">{s("loading") ?? "Loading…"}</p>
            </div>
        </div>
    );

    if (!clockings.length) return (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Clock className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">{t("no_clockings")}</p>
            <p className="text-sm mt-1">{s("noresults")}</p>
        </div>
    );

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-800">
                        {[t("date"), t("vehicle"), t("device"), t("type"), t("device_type"), t("conducteur"), t("status"), t("location")]
                            .map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/60">
                    {clockings.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-xs">
                                {c.created_at}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <a href={`/admin/vehicles/${c.vehicle_id}`}
                                    className="font-semibold text-slate-800 dark:text-slate-100 hover:text-slate-600 transition-colors">
                                    {c.vehicle}
                                </a>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                                {c.device?.code || "—"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[c.type] ?? "bg-slate-100 text-slate-600"}`}>
                                    {getTypeLabel(c.type)}
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[c.deviceType] ?? "bg-slate-100 text-slate-600"}`}>
                                    {getDeviceLabel(c.deviceType)}
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                {c.conducteur_name || c.conducteur_matricule ? (
                                    <a href={`/admin/conducteurs/${c.conducteur_id}`}
                                        className="text-slate-600 dark:text-slate-300 hover:text-slate-800 transition-colors">
                                        {[c.conducteur_name, c.conducteur_matricule].filter(Boolean).join(" ")}
                                    </a>
                                ) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 1 || c.status === "1"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                    : c.status === 0 || c.status === "0"
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                        : "bg-slate-100 text-slate-500"
                                    }`}>
                                    {c.status ?? "—"}
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                                {c.park || "—"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  VEHICLES WITHOUT REGION TABLE  (with frontend pagination + search)
// ─────────────────────────────────────────────────────────────────────────────

const VEH_PAGE_SIZE = 5;

function VehiclesWithoutRegionTable({ vehicles, loading, t }: {
    vehicles: VehicleWithoutRegion[]; loading: boolean; t: any;
}) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [mapOpen, setMapOpen] = useState(false);
    const [mapPos, setMapPos] = useState({ lat: 0, lng: 0 });

    // reset page when vehicles change
    useEffect(() => { setPage(1); }, [vehicles]);

    const filtered = useMemo(() =>
        vehicles.filter((v) =>
            !search ||
            v.vehicle_matricule.toLowerCase().includes(search.toLowerCase()) ||
            (v.conducteur_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (v.exit_park ?? "").toLowerCase().includes(search.toLowerCase())
        ), [vehicles, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / VEH_PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const slice = filtered.slice((safePage - 1) * VEH_PAGE_SIZE, safePage * VEH_PAGE_SIZE);

    const handleOpenMap = async (id: string) => {
        const res = await getPositionVehicle(id);
        if (res.status !== 200) { toast.error("Error getting position"); return; }
        setMapPos({ lat: res.data.lat, lng: res.data.lng });
        setMapOpen(true);
    };

    if (loading) return (
        <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!vehicles.length) return null;

    return (
        <div className="space-y-3">
            <LocationMapDialog open={mapOpen} onOpenChange={setMapOpen} position={mapPos} title="Localisation" zoom={17} />

            {/* Search */}
            <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 pointer-events-none" />
                <Input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Rechercher…"
                    className="pl-8 h-8 text-sm rounded-lg border-amber-200 focus:ring-amber-400/40 focus:border-amber-400 bg-amber-50/50"
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-amber-100/70 dark:bg-amber-900/20">
                            {["Véhicule", "Conducteur", "Heure sortie", "Parking", "Statut", "Action"].map((h) => (
                                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 dark:divide-amber-900/20">
                        {slice.length ? slice.map((v) => (
                            <tr key={v.id} className="hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                                <td className="px-4 py-2.5 font-semibold text-amber-900 dark:text-amber-100 whitespace-nowrap">
                                    {v.vehicle_matricule}
                                </td>
                                <td className="px-4 py-2.5 text-amber-800 dark:text-amber-200 whitespace-nowrap">
                                    {[v.conducteur_name, v.conducteur_matricule].filter(Boolean).join(" ") || "—"}
                                </td>
                                <td className="px-4 py-2.5 text-amber-700 dark:text-amber-300 font-mono text-xs whitespace-nowrap">
                                    {v.exit_time}
                                </td>
                                <td className="px-4 py-2.5 text-amber-700 dark:text-amber-300 whitespace-nowrap">
                                    {v.exit_park}
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                        <AlertTriangle className="w-3 h-3" /> Non entré en région
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap">
                                    <button
                                        onClick={() => handleOpenMap(v.vehicle_id)}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-200 transition-colors"
                                    >
                                        <MapPin className="w-3.5 h-3.5" /> Voir position
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="px-4 py-6 text-center text-amber-600/60 text-sm">
                                    Aucun résultat pour « {search} »
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-amber-700/60 dark:text-amber-400/60">
                        {(safePage - 1) * VEH_PAGE_SIZE + 1}–{Math.min(safePage * VEH_PAGE_SIZE, filtered.length)} / {filtered.length}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={safePage === 1}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                            <button
                                key={n}
                                onClick={() => setPage(n)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors
                  ${n === safePage
                                        ? "bg-amber-600 text-white border border-amber-600"
                                        : "border border-amber-200 text-amber-700 hover:bg-amber-100"
                                    }`}
                            >
                                {n}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                            disabled={safePage === totalPages}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGINATION BAR
// ─────────────────────────────────────────────────────────────────────────────

function PaginationBar({ currentPage, totalPages, pageSize, totalCount, displayed, onPage, onPageSize, s }: {
    currentPage: number; totalPages: number; pageSize: number;
    totalCount: number; displayed: number;
    onPage: (p: number) => void; onPageSize: (n: number) => void; s: any;
}) {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{s("pagesize")}:</span>
                <select
                    value={pageSize}
                    onChange={(e) => onPageSize(Number(e.target.value))}
                    className="h-8 px-2 rounded-lg border border-slate-200 text-sm bg-white dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                    {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                    {s("page")} {currentPage} / {totalPages} · {displayed} {s("of_total") ?? "/"} {totalCount}
                </span>
                <div className="flex gap-1">
                    <button
                        onClick={() => onPage(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onPage(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function ClockingsPage() {
    const t = useTranslations("Clocking");
    const s = useTranslations("System");

    const [clockings, setClockings] = useState<Clocking[]>([]);
    const [vehicles, setVehicles] = useState<VehicleWithoutRegion[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingVeh, setLoadingVeh] = useState(false);
    const [parks, setParks] = useState<any[]>([]);

    // stats
    const [totalCount, setTotalCount] = useState(0);
    const [totalExit, setTotalExit] = useState(0);
    const [uniqueVeh, setUniqueVeh] = useState(0);
    const [uniqueCond, setUniqueCond] = useState(0);
    const [totalNoRegion, setTotalNoRegion] = useState(0);

    // filters
    const [searchDate, setSearchDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [parkFilter, setParkFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const totalPages = Math.ceil(totalCount / pageSize);

    // load parks once
    useEffect(() => {
        getParksAdmin().then((r) => { if (r.status === 200) setParks(r.data); });
    }, []);

    // reload on filter/page change
    useEffect(() => { loadClockings(); }, [currentPage, pageSize, searchDate, parkFilter, typeFilter, statusFilter]);

    const loadClockings = async () => {
        setLoading(true);
        try {
            const r = await getClockings(
                currentPage, pageSize,
                searchDate || undefined,
                parkFilter || undefined,
                typeFilter ? Number(typeFilter) : undefined,
                statusFilter ? Number(statusFilter) : undefined,
            );
            if (r.status === 200) {
                setClockings(r.data);
                setTotalCount(r.total_clockings);
                setTotalExit(r.countExit);
                setUniqueVeh(r.uniqueVehicles);
                setUniqueCond(r.uniqueConducteurs);
                setTotalNoRegion(r.totalScannBusHaveExistedParkAndNotEntredRegion);
                setVehicles(r.scannBusHaveExistedParkAndNotEntredRegion ?? []);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSearchDate(""); setParkFilter(""); setTypeFilter(""); setStatusFilter("");
        setCurrentPage(1);
    };

    const filterChange = (setter: (v: string) => void) => (v: string) => {
        setter(v); setCurrentPage(1);
    };

    // ── render ──────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">{t("title")}</h1>
                        <p className="text-sm text-slate-400 mt-0.5">{t("list")}</p>
                    </div>
                    {(parkFilter || typeFilter || statusFilter || searchDate) && (
                        <button onClick={handleReset}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-white transition-all">
                            <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                    )}
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <StatCard label={t("total_clockings")} value={totalCount.toLocaleString()} sub={s("total")} icon={Calendar} gradient="bg-gradient-to-br from-sky-500 to-sky-600" />
                    <StatCard label={t("today_clockings")} value={totalExit} icon={Clock} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
                    <StatCard label={t("vehicle")} value={uniqueVeh} sub="Unique" icon={Car} gradient="bg-gradient-to-br from-orange-500 to-orange-600" />
                    <StatCard label={t("conducteur")} value={uniqueCond} sub="Unique" icon={User} gradient="bg-gradient-to-br from-violet-500 to-violet-600" />
                    <StatCard label={t("totalScannBusHaveExistedParkAndNotEntredRegion")} value={totalNoRegion} icon={AlertTriangle} gradient="bg-gradient-to-br from-rose-500 to-rose-600" />
                </div>

                {/* ── Filters ── */}
                <FiltersBar
                    searchDate={searchDate} onDateChange={filterChange(setSearchDate)}
                    parks={parks} parkFilter={parkFilter} onParkChange={filterChange(setParkFilter)}
                    typeFilter={typeFilter} onTypeChange={filterChange(setTypeFilter)}
                    statusFilter={statusFilter} onStatusChange={filterChange(setStatusFilter)}
                    onReset={handleReset}
                    t={t} s={s}
                />

                {/* ── Clockings Table Card ── */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <ClockingsTable clockings={clockings} loading={loading} t={t} s={s} />
                </div>

                {/* ── Pagination ── */}
                <PaginationBar
                    currentPage={currentPage} totalPages={totalPages}
                    pageSize={pageSize} totalCount={totalCount}
                    displayed={clockings.length}
                    onPage={setCurrentPage} onPageSize={(n) => { setPageSize(n); setCurrentPage(1); }}
                    s={s}
                />

                {/* ── Vehicles Without Region ── */}
                {vehicles.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-amber-500/15 p-2 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200">
                                    Véhicules sortis du parking mais non entrés en région
                                </h2>
                                <p className="text-xs text-amber-600/70 dark:text-amber-400/60">{vehicles.length} véhicule(s) concerné(s)</p>
                            </div>
                            <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                {vehicles.length}
                            </span>
                        </div>
                        <VehiclesWithoutRegionTable vehicles={vehicles} loading={loadingVeh} t={t} />
                    </div>
                )}

            </div>
        </div>
    );
}