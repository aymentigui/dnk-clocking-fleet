"use client"

import { useTranslations } from "next-intl"
import { useState, useCallback } from "react"
import useSWR from "swr"
import { Plus, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { deleteConducteur } from "@/actions/conducteur/delete"
import ConducteurTable from "./conducteur-table"
import DeleteConfirmDialog from "./delete-conducteur"
import { getConducteurs } from "@/actions/conducteur/get"
import { getColumns } from "@/actions/util/sheet-columns/conducteur";
import { useEffect } from "react"
import { useImportSheetsStore } from "@/hooks/use-import-csv"
import toast from "react-hot-toast"
import { createConducteurs } from "@/actions/conducteur/set"
import { getConducteursWithIds } from "@/actions/conducteur/get"
import { generateFileClient } from "@/actions/util/export-data/export-client"
import ExportButton from "@/components/my/export-button"
import Link from "next/link"

const selectors = [
    { title: "id", selector: "id" },
    { title: "matricule", selector: "matricule" },
    { title: "firstname", selector: "Nom" },
    { title: "lastname", selector: "prenom" },
    { title: "phone", selector: "telephone" },
];

export default function ConducteursPage() {
    const t = useTranslations()
    const [page, setPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const { data: sheetData, setColumns, setData: setSheetData } = useImportSheetsStore();

    const [sheetNotCreated, setSheetNotCreated] = useState<any>([])
    const [sheetCreated, setSheetCreated] = useState(false)

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
            toast.error(t("Errors.badrequest"))
            return
        }

        const users = res.data
        generateFileClient(selectors, users, type);

    };

    const exportAll = async (type: number = 1) => {
        generateFileClient(selectors, data, type);

    };

    const fetcher = async () => {
        const result = await getConducteurs(page, 10, searchQuery)
        if (result.status !== 200) {
            throw new Error(result.data.message)
        }
        return result.data
    }

    const {
        data: conducteurs,
        isLoading,
        error,
        mutate,
    } = useSWR([`conducteurs`, page, searchQuery], fetcher, { revalidateOnFocus: false })

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
                                <h2 className="font-bold">{t("Errors.errors")}</h2>
                                <ul className="list-disc pl-5">
                                    <li>
                                        {
                                            (data.message ? data.message + " : " : "") + " " + (data.park.name ?? "") + " " + (data.park.address ?? "") + " " + (data.park.description ?? "")
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
                        {selectedIds.length > 0 && (
                            <Button onClick={handleDeleteSelected} variant="destructive" className="gap-2">
                                <Trash2 size={20} />
                                {t("Conducteur.delete")} ({selectedIds.length})
                            </Button>
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
                ) : (
                    <ConducteurTable
                        conducteurs={conducteurs || []}
                        selectedIds={selectedIds}
                        onSelectAll={handleSelectAll}
                        onSelectOne={handleSelectOne}
                    />
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
                count={selectedIds.length}
            />
        </main>
    )
}
