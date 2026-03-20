"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    ColumnDef,
} from "@tanstack/react-table";
import Link from "next/link";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import {
    Loader2, Trash2, Pencil, ArrowUpDown, Download, Plus,
    MapPin, Bus, FileText, Search, FileSpreadsheet,
    AlertTriangle, CheckCircle2, ChevronDown,
} from "lucide-react";

import { useOrigin } from "@/hooks/use-origin";
import { useSession } from "@/hooks/use-session";
import { useImportSheetsStore } from "@/hooks/use-import-csv";
import Loading from "@/components/myui/loading";

import { createRegion, createRegions } from "@/actions/region/set";
import { UpdateRegion } from "@/actions/region/update";
import { getRegions, getRegionsWithIds } from "@/actions/region/get";
import { deleteRegion } from "@/actions/region/delete";
import { getColumns } from "@/actions/util/sheet-columns/region";
import { generateFileClient } from "@/actions/util/export-data/export-client";

// ─────────────────────────────────────────────────────────────────────────────

type Region = {
    id: string;
    name: string;
    description?: string;
    address?: string;
    nbr_buses?: number;
};

const EXPORT_SELECTORS = [
    { title: "id", selector: "id" },
    { title: "name", selector: "name" },
    { title: "description", selector: "description" },
    { title: "address", selector: "address" },
    { title: "nbr_buses", selector: "nbr_buses" },
];

const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    address: z.string().optional(),
    nbr_buses: z.number().optional(),
});
type FormValues = z.infer<typeof schema>;

// ─────────────────────────────────────────────────────────────────────────────

export default function RegionsPage() {

    // ── ALL hooks at the top ─────────────────────────────────────────────────
    const u = useTranslations("Region");
    const t = useTranslations("System");
    const tErr = useTranslations("Error");

    const origin = useOrigin();
    const { session } = useSession();
    const { data: sheetData, setColumns, setData: setSheetData } = useImportSheetsStore();
    const columnsSheet = getColumns()
    const [data, setData] = useState<Region[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [isAdd, setIsAdd] = useState(true);
    const [editingRegion, setEditingRegion] = useState<Region | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [sheetCreated, setSheetCreated] = useState(false);
    const [sheetErrors, setSheetErrors] = useState<any[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: "", description: "", address: "", nbr_buses: 0 },
    });

    // ── permissions helper ───────────────────────────────────────────────────
    const can = (perm: string) =>
        session?.user?.is_admin ||
        (session?.user?.permissions ?? []).includes(perm);

    // ── dialog helpers ───────────────────────────────────────────────────────
    const openAdd = () => {
        form.reset({ name: "", description: "", address: "", nbr_buses: 0 });
        setEditingRegion(null);
        setIsAdd(true);
        setDialogOpen(true);
    };

    const openEdit = (region: Region) => {
        form.reset({
            name: region.name ?? "",
            description: region.description ?? "",
            address: region.address ?? "",
            nbr_buses: region.nbr_buses ?? 0,
        });
        setEditingRegion(region);
        setIsAdd(false);
        setDialogOpen(true);
    };

    const closeDialog = () => { setDialogOpen(false); form.reset(); };

    // ── submit ───────────────────────────────────────────────────────────────
    const onSubmit = async (values: FormValues) => {
        setFormLoading(true);
        const res = isAdd
            ? await createRegion(values)
            : await UpdateRegion(editingRegion!.id, values);

        const { message, errors } = res.data;
        if (res.status === 200) {
            toast.success(message ?? t("createsuccess"));
            closeDialog();
            window.location.reload();
        } else {
            errors?.forEach((e: any) => toast.error(e.message));
            if (!errors) toast.error(message ?? (isAdd ? t("createfail") : t("updatefail")));
        }
        setFormLoading(false);
    };

    // ── effects ──────────────────────────────────────────────────────────────
    useEffect(() => {
        setMounted(true);
        setColumns(columnsSheet);
    }, []);

    useEffect(() => {
        if (!origin) return;
        setIsLoading(true);
        setData([]);
        getRegions()
            .then((res) => { if (res.status === 200) setData(res.data); })
            .finally(() => setIsLoading(false));
    }, [origin]);

    useEffect(() => {
        if (!sheetData?.length) return;
        createRegions(sheetData)
            .then((res) => {
                if (res.status === 200 && res.data.regions) {
                    res.data.regions.forEach((r: any) => {
                        if (r.status !== 200) setSheetErrors((p) => [...p, r.data]);
                        else setSheetCreated(true);
                    });
                } else {
                    toast.error(res.data.message);
                }
            })
            .catch(() => toast.error(t("errorcreate")))
            .finally(() => setSheetData([]));
    }, [sheetData]);

    // ── delete handlers ──────────────────────────────────────────────────────
    const handleDeleteOne = useCallback(async (id: string) => {
        const res = await deleteRegion([id]);
        if (res.status === 200) { toast.success(t("deletesuccess")); window.location.reload(); }
        else toast.error(t("deletefail"));
    }, []);

    const handleDeleteSelected = async () => {
        if (!selectedIds.length) return;
        const res = await deleteRegion(selectedIds);
        if (res.status === 200) { toast.success(t("deletesuccess")); setDeleteOpen(false); window.location.reload(); }
        else toast.error(t("deletefail"));
    };

    // ── export ───────────────────────────────────────────────────────────────
    const exportData = async (ids: string[] | null, type: number) => {
        let rows = data;
        if (ids) {
            const res = await getRegionsWithIds(ids);
            if (res.status !== 200) { toast.error(tErr("badrequest")); return; }
            rows = res.data;
        }
        generateFileClient(EXPORT_SELECTORS, rows, type);
    };

    // ── columns (plain object, NO hook calls inside) ─────────────────────────
    // All labels come from `u(...)` called above — passed as plain strings here
    const cols: ColumnDef<Region>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllRowsSelected()}
                    onCheckedChange={(v) => table.toggleAllRowsSelected(!!v)}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(v) => row.toggleSelected(!!v)}
                />
            ),
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <button
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-1 group text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
                >
                    {u("name")}
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            ),
            cell: ({ row }) => (
                <span className="font-medium text-slate-800">{row.getValue("name")}</span>
            ),
            enableSorting: true,
        },
        {
            accessorKey: "address",
            header: ({ column }) => (
                <button
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-1 group text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
                >
                    {u("address")}
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            ),
            cell: ({ row }) => (
                <span className="text-slate-500 text-sm flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {row.getValue("address") || "—"}
                </span>
            ),
            enableSorting: true,
        },
        {
            accessorKey: "nbr_buses",
            header: ({ column }) => (
                <button
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-1 group text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
                >
                    {u("nbr_buses")}
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            ),
            cell: ({ row }) => {
                const n = row.getValue("nbr_buses") as number;
                return n != null ? (
                    <Badge variant="secondary" className="gap-1 rounded-md font-mono text-xs bg-amber-50 text-amber-700 border border-amber-200">
                        <Bus className="w-3 h-3" /> {n}
                    </Badge>
                ) : "—";
            },
            enableSorting: true,
        },
        {
            accessorKey: "description",
            header: ({ column }) => (
                <button
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-1 group text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
                >
                    {u("description")}
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            ),
            cell: ({ row }) => (
                <span className="text-slate-400 text-sm line-clamp-1 max-w-[200px]">
                    {row.getValue("description") || "—"}
                </span>
            ),
            enableSorting: true,
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1.5">
                    {can("region_update") && (
                        <Button
                            size="icon" variant="ghost"
                            onClick={() => openEdit(row.original)}
                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </Button>
                    )}
                    {can("region_delete") && (
                        <Button
                            size="icon" variant="ghost"
                            onClick={() => handleDeleteOne(row.original.id)}
                            className="w-8 h-8 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    // ── table instance ───────────────────────────────────────────────────────
    const table = useReactTable({
        data,
        columns: cols,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            rowSelection: selectedIds.reduce((acc, id) => {
                const idx = data.findIndex((r) => r.id === id);
                if (idx !== -1) acc[idx] = true;
                return acc;
            }, {} as Record<string, boolean>),
        },
        onRowSelectionChange: (updater) => {
            const next = typeof updater === "function"
                ? updater(table.getState().rowSelection)
                : updater;
            const idxs = Object.keys(next).filter((k) => next[k]);
            setSelectedIds(
                idxs.map((i) => table.getRowModel().rows.find((r) => r.id === i)?.original.id ?? "")
            );
        },
    });

    // ── guard ────────────────────────────────────────────────────────────────
    if (!mounted) return (
        <div className="h-64 flex items-center justify-center"><Loading /></div>
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{u("title")}</h1>
                    <p className="text-sm text-slate-400 mt-0.5">{data.length} {u("title").toLowerCase()}</p>
                </div>
                {can("region_create") && (
                    <Button onClick={openAdd} className="h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white gap-1.5">
                        <Plus className="w-4 h-4" /> {u("addregion")}
                    </Button>
                )}
            </div>

            {/* Notifications */}
            {sheetCreated && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> {t("mustrefreshtoseedata")}
                </div>
            )}
            {sheetErrors.length > 0 && (
                <div className="max-h-40 overflow-auto space-y-2">
                    {sheetErrors.map((err, i) => (
                        <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                                {(err.message ? err.message + " : " : "") +
                                    [err.region?.name, err.region?.address, err.region?.description, err.region?.nbr_buses]
                                        .filter(Boolean).join(" ")}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
                <Link href="/admin/sheetimport">
                    <Button variant="outline" size="sm" className="h-9 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 gap-1.5">
                        <FileSpreadsheet className="w-4 h-4" /> {t("import")}
                    </Button>
                </Link>

                {/* Export all */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 rounded-lg gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50">
                            <Download className="w-4 h-4" /> {t("exportall")} <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-xl shadow-xl" align="start">
                        <DropdownMenuItem onClick={() => exportData(null, 1)} className="gap-2 cursor-pointer">
                            <FileText className="w-4 h-4 text-emerald-500" /> {t("exportCSV")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportData(null, 2)} className="gap-2 cursor-pointer">
                            <FileSpreadsheet className="w-4 h-4 text-blue-500" /> {t("exportXLSX")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {selectedIds.length > 0 && (
                    <>
                        {/* Export selected */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 rounded-lg gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50">
                                    <Download className="w-4 h-4" /> {t("exportselected")} <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="rounded-xl shadow-xl" align="start">
                                <DropdownMenuItem onClick={() => exportData(selectedIds, 1)} className="gap-2 cursor-pointer">
                                    <FileText className="w-4 h-4 text-emerald-500" /> {t("exportCSV")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportData(selectedIds, 2)} className="gap-2 cursor-pointer">
                                    <FileSpreadsheet className="w-4 h-4 text-blue-500" /> {t("exportXLSX")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Delete selected */}
                        {can("region_delete") && (
                            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="h-9 rounded-lg gap-1.5 bg-red-600 hover:bg-red-700">
                                        <Trash2 className="w-4 h-4" /> {u("deleteregions")}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                            <AlertTriangle className="w-5 h-5" /> {u("confermationdelete")}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>{u("confermationdeletemessage")}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-lg">{t("cancel")}</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteSelected} className="rounded-lg bg-red-600 hover:bg-red-700">
                                            {t("confirm")}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </>
                )}

                {/* Search */}
                <div className="ml-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <Input
                        placeholder={t("search")}
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
                        className="pl-8 h-9 w-56 rounded-lg border-slate-200 focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 text-sm transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="h-64 flex items-center justify-center"><Loading /></div>
            ) : (
                <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((hg) => (
                                <TableRow key={hg.id} className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                                    {hg.headers.map((h) => (
                                        <TableHead key={h.id} className="py-3 px-4 first:pl-5 last:pr-5">
                                            {flexRender(h.column.columnDef.header, h.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() ? "selected" : ""}
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors data-[state=selected]:bg-amber-50/60"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="py-3 px-4 first:pl-5 last:pr-5">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={cols.length} className="h-40 text-center text-slate-400 text-sm">
                                        {t("noresults")}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Add / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={closeDialog}>
                <DialogContent className="sm:max-w-lg rounded-2xl border-0 shadow-2xl bg-white p-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5">
                        <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-amber-400" />
                            {isAdd ? u("addregion") : u("updateregion")}
                        </DialogTitle>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                            {u("name")} <span className="text-red-400">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={u("name")}
                                                className="h-10 rounded-lg border-slate-200 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all" />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="address" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                            {u("address")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={u("address")}
                                                className="h-10 rounded-lg border-slate-200 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all" />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="nbr_buses" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                            {u("nbr_buses")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" placeholder="0"
                                                className="h-10 rounded-lg border-slate-200 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all" />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                        {u("description")}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder={u("description")} rows={3}
                                            className="rounded-lg resize-none border-slate-200 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all" />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )} />
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={closeDialog}
                                    className="flex-1 h-10 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50">
                                    {t("cancel")}
                                </Button>
                                <Button type="submit" disabled={formLoading}
                                    className="flex-1 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium">
                                    {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isAdd ? u("addregion") : u("updateregion")}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

        </div>
    );
}