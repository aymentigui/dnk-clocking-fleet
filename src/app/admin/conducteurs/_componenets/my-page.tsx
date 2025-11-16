"use client"

import { useTranslations } from "next-intl"
import { useState, useCallback } from "react"
import useSWR from "swr"
import { Plus, Trash2, Search, ChevronRight, ChevronLeft, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { deleteConducteur } from "@/actions/conducteur/delete"
import ConducteurTable from "./conducteur-table"
import DeleteConfirmDialog from "./delete-conducteur"
import { getConducteurs, getConducteursAdmin } from "@/actions/conducteur/get"
import { getColumns } from "@/actions/util/sheet-columns/conducteur";
import { useEffect } from "react"
import { useImportSheetsStore } from "@/hooks/use-import-csv"
import toast from "react-hot-toast"
import { createConducteurs } from "@/actions/conducteur/set"
import { getConducteursWithIds } from "@/actions/conducteur/get"
import { generateFileClient } from "@/actions/util/export-data/export-client"
import ExportButton from "@/components/my/export-button"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateWorkStatusConducteur } from "@/actions/conducteur/update"
import UpdateWorkStatusDialog from "./UpdateWorkStatus"

const selectors = [
    { title: "id", selector: "id" },
    { title: "matricule", selector: "matricule" },
    { title: "firstname", selector: "firstname" },
    { title: "lastname", selector: "lastname" },
    { title: "phone", selector: "phone" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]


export default function ConducteursPage() {
    const t = useTranslations()
    const [page, setPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<undefined | string>(undefined); // État pour le filtre de statut
    const [workStatusFilter, setWorkStatusFilter] = useState<undefined | boolean>(true); // État pour le filtre de statut de travail
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showUpdateStatusDialog, setShowUpdateStatusDialog] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [workStatusToUpdate, setWorkStatusToUpdate] = useState<boolean>(true)
    const { data: sheetData, setColumns, setData: setSheetData } = useImportSheetsStore();

    const [sheetNotCreated, setSheetNotCreated] = useState<any>([])
    const [sheetCreated, setSheetCreated] = useState(false)
    const [pageSize, setPageSize] = useState(10)
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    const [data, setData] = useState<any[]>([]);

    const columnsSheet = getColumns()

    useEffect(() => {
        setColumns(columnsSheet);
    }, []);

    // pour la creation depuis les sheet
    useEffect(() => {
        if (sheetData && sheetData.length > 0) {
            createConducteurs(sheetData).then((res) => {
                if (res.status === 200) {
                    if (res.data.conducteurs) {
                        res.data.conducteurs.forEach((conducteur) => {
                            if (conducteur.status !== 200) {
                                setSheetNotCreated((prev: any) => [...prev, conducteur.data])
                            } else {
                                setSheetCreated(true)
                            }
                        })
                    }
                } else {
                    toast.error(res.data.message);
                }
            }).catch((error) => {
                toast.error(t("System.errorcreate"));
            }).finally(() => {
                setSheetData([]); // Mettre à jour le tableau avec les données créées
            });
        }
    }, [sheetData]);

    const exportSelected = async (type: number = 1) => {

        const res = await getConducteursWithIds(selectedIds)

        if (res.status !== 200) {
            toast.error(t("Error.badrequest"))
            return
        }

        const users = res.data
        generateFileClient(selectors, users, type);

    };

    const handleUpdateWorkStatus = (workStatus: boolean) => {
        if (selectedIds.length === 0) return
        setWorkStatusToUpdate(workStatus)
        setShowUpdateStatusDialog(true)
    }

    const confirmUpdateWorkStatus = async () => {
        setIsUpdating(true)
        try {
            const result = await updateWorkStatusConducteur(selectedIds, workStatusToUpdate)

            if (result.status === 200) {
                setSelectedIds([])
                mutate()
                toast.success(t("Conducteur.work_status_updated"))
            } else {
                console.error("Update work status failed:", result.data)
                toast.error(result.data.message || t("Error.error"))
            }
        } catch (err) {
            console.error("Error updating work status:", err)
            toast.error(t("Error.error"))
        } finally {
            setIsUpdating(false)
            setShowUpdateStatusDialog(false)
        }
    }

    const exportAll = async (type: number = 1) => {
        const res = await getConducteursAdmin()

        if (res.status !== 200) {
            toast.error(t("Error.badrequest"))
            return
        }

        const data = res.data
        generateFileClient(selectors, data, type);

    };

    const fetcher = async () => {
        const result = await getConducteurs(page, pageSize, searchQuery, statusFilter, workStatusFilter)
        if (result.status !== 200) {
            throw new Error(result.data.message)
        }
        setTotalCount(result.totalCount || 0)
        setTotalPages(result.totalPages || 1)
        return result.data
    }

    const {
        data: conducteurs,
        isLoading,
        error,
        mutate,
    } = useSWR([`conducteurs`, page, pageSize, searchQuery, statusFilter, workStatusFilter], fetcher, { revalidateOnFocus: false })

    const handleSearch = useCallback((value: string) => {
        setSearchQuery(value)
        setPage(1)
    }, [])

    const handleSelectAll = (checked: boolean) => {
        if (checked && conducteurs) {
            setSelectedIds(conducteurs.map((c: any) => c.id))
        } else {
            setSelectedIds([])
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id])
        } else {
            setSelectedIds(selectedIds.filter((sid) => sid !== id))
        }
    }

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return
        setShowDeleteDialog(true)
    }

    const confirmDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteConducteur(selectedIds)

            if (result.status === 200) {
                setSelectedIds([])
                mutate()
            } else {
                console.error("Delete failed:", result.data)
            }
        } catch (err) {
            console.error("Error deleting conducteurs:", err)
        } finally {
            setIsDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    const handlePageSizeChange = (value: string) => {
        const newSize = parseInt(value)
        setPageSize(newSize)
        setPage(1) // Reset à la première page quand on change la taille
    }

    const handlePreviousPage = () => {
        if (page > 1) {
            setPage(page - 1)
        }
    }

    const handleNextPage = () => {
        if (page < totalPages) {
            setPage(page + 1)
        }
    }

    const startItem = totalCount > 0 ? (page - 1) * pageSize + 1 : 0
    const endItem = Math.min(page * pageSize, totalCount)

    return (
        <main className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-4xl font-bold text-foreground">{t("Conducteur.title")}</h1>
                        <a href="/admin/conducteurs/create">
                            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                                <Plus size={20} />
                                {t("Conducteur.create")}
                            </Button>
                        </a>
                    </div>
                    <p className="text-muted-foreground">{t("Conducteur.description")}</p>
                </div>

                {sheetCreated && (
                    <div className="bg-blue-500 text-white p-4 mb-4 rounded">
                        {t("System.mustrefreshtoseedata")}
                    </div>
                )}
                {sheetNotCreated && sheetNotCreated.length > 0 && (
                    <div className="max-h-48 my-2 overflow-auto">
                        {sheetNotCreated.map((data: any, index: any) => (
                            <div key={index} className="mt-4 p-4 bg-red-200 text-red-700 rounded">
                                <h2 className="font-bold">{t("Error.errors")}</h2>
                                <ul className="list-disc pl-5">
                                    <li>
                                        {
                                            (data.message ? data.message + " : " : "") + " " + (data.conducteur.firstname ?? "") + " " + (data.conducteur.lastname ?? "") + " " + (data.conducteur.matricule ?? "")
                                        }
                                    </li>
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-2 justify-between items-center">
                    <div className="flex gap-2">
                        <Link href="/admin/sheetimport">
                            <Button>{t('System.import')}</Button>
                        </Link>
                        <ExportButton all={true} handleExportCSV={() => exportAll(1)} handleExportXLSX={() => exportAll(2)} />
                        {selectedIds.length > 0 && <ExportButton all={false} handleExportCSV={() => exportSelected(1)} handleExportXLSX={() => exportSelected(2)} />}
                    </div>
                </div>

                {/* Search and Actions */}
                <Card className="my-6 bg-card border-border p-6">
                    <div className="flex gap-4 flex-col md:flex-row">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <Input
                                placeholder={t("Conducteur.search")}
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                        {/* Status Select */}
                        <div className="flex-1">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full bg-input border-border text-foreground placeholder:text-muted-foreground p-2 rounded"
                            >
                                <option value="">{t("Conducteur.all")}</option>
                                <option value="exit_from_park">{t("Conducteur.exit_from_park")}</option>
                                <option value="entry_to_park">{t("Conducteur.entry_to_park")}</option>
                                <option value="exit_from_region">{t("Conducteur.exit_from_region")}</option>
                                <option value="entry_to_region">{t("Conducteur.entry_to_region")}</option>
                            </select>
                        </div>

                        {/* Work Status Select */}
                        <div className="flex-1">
                            <select
                                value={workStatusFilter === undefined ? "true" : workStatusFilter.toString()}
                                onChange={(e) => setWorkStatusFilter(e.target.value === "" ? undefined : e.target.value === "true")}
                                className="w-full bg-input border-border text-foreground placeholder:text-muted-foreground p-2 rounded"
                            >
                                <option value="true">{t("Conducteur.active")}</option>
                                <option value="false">{t("Conducteur.inactive")}</option>
                            </select>
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleUpdateWorkStatus(true)}
                                    className="gap-2 bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle size={20} />
                                    {t("Conducteur.activate")} ({selectedIds.length})
                                </Button>
                                <Button
                                    onClick={() => handleUpdateWorkStatus(false)}
                                    variant="secondary"
                                    className="gap-2"
                                >
                                    <XCircle size={20} />
                                    {t("Conducteur.deactivate")} ({selectedIds.length})
                                </Button>
                                <Button onClick={handleDeleteSelected} variant="destructive" className="gap-2">
                                    <Trash2 size={20} />
                                    {t("Conducteur.delete")} ({selectedIds.length})
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Table */}
                {isLoading ? (
                    <Card className="bg-card border-border p-12 text-center">
                        <div className="text-muted-foreground">{t("System.loading")}</div>
                    </Card>
                ) : error ? (
                    <Card className="bg-card border-border p-12 text-center">
                        <div className="text-destructive">{t("Error.error")}</div>
                    </Card>
                ) : <>
                    <ConducteurTable
                        conducteurs={conducteurs || []}
                        selectedIds={selectedIds}
                        onSelectAll={handleSelectAll}
                        onSelectOne={handleSelectOne}
                    />
                    {/* Pagination */}
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Informations sur les éléments affichés */}
                        <div className="text-sm text-muted-foreground">
                            {t("System.displayed")} {startItem}-{endItem} {t("System.of_total")} {totalCount} {t("System.items")}
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Sélecteur de taille de page */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    {t("System.pagesize")}:
                                </span>
                                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                                    <SelectTrigger className="w-20">
                                        <SelectValue placeholder={t("System.pagesizeplaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAGE_SIZE_OPTIONS.map((size) => (
                                            <SelectItem key={size} value={size.toString()}>
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Contrôles de pagination */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePreviousPage}
                                    disabled={page === 1}
                                    className="gap-1"
                                >
                                    <ChevronLeft size={16} />
                                    {t("System.back")}
                                </Button>

                                <div className="flex items-center gap-1 text-sm">
                                    <span className="text-muted-foreground">{t("System.page")}</span>
                                    <span className="font-medium">{page}</span>
                                    <span className="text-muted-foreground">{t("System.of")}</span>
                                    <span className="font-medium">{totalPages}</span>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={page === totalPages}
                                    className="gap-1"
                                >
                                    {t("System.next")}
                                    <ChevronRight size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
                }
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
                count={selectedIds.length}
            />
            <UpdateWorkStatusDialog
                open={showUpdateStatusDialog}
                onOpenChange={setShowUpdateStatusDialog}
                onConfirm={confirmUpdateWorkStatus}
                isUpdating={isUpdating}
                count={selectedIds.length}
                workStatus={workStatusToUpdate}
            />
        </main>
    )
}
