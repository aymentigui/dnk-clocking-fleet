"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/hooks/use-session";
import Cookies from 'js-cookie';
import Link from "next/link";
import {
    Search,
    Plus,
    Trash2,
    Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/myui/loading";
import ExportButton from "@/components/my/export-button";
import ConfirmDialogDelete from "@/components/myui/shadcn-dialog-confirm";
import { getParksWithIds } from "@/actions/park/get";
import { deletePark } from "@/actions/park/delete";
import { generateFileClient } from "@/actions/util/export-data/export-client";
import { getColumns } from "@/actions/util/sheet-columns/park";
import { useImportSheetsStore } from "@/hooks/use-import-csv";
import { createParks } from "@/actions/park/set";
import toast from "react-hot-toast";

interface Park {
    id: string;
    name: string;
    address?: string;
    description?: string;
}

interface ParksTableProps {
    parks: Park[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    isLoading: boolean;
    onDelete: (id: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

const selectors = [
    { title: "id", selector: "id" },
    { title: "name", selector: "name" },
    { title: "description", selector: "description" },
    { title: "address", selector: "address" },
];

export function ParksTable({
    parks,
    selectedIds,
    onSelectionChange,
    isLoading,
    onDelete,
    searchQuery,
    onSearchChange
}: ParksTableProps) {

    const t = useTranslations("Park");
    const s = useTranslations("System");
    const e = useTranslations("Error");
    const { session } = useSession();
    const [language, setLanguage] = useState("en");
    const [selectAll, setSelectAll] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const { data: sheetData, setColumns, setData: setSheetData } = useImportSheetsStore();

    const [sheetNotCreated, setSheetNotCreated] = useState<any>([])
    const [sheetCreated, setSheetCreated] = useState(false)

    // pour la creation depuis les sheet
    useEffect(() => {
        if (sheetData && sheetData.length > 0) {
            createParks(sheetData).then((res) => {
                if (res.status === 200) {
                    if (res.data.parks) {
                        res.data.parks.forEach((park) => {
                            if (park.status !== 200) {
                                setSheetNotCreated((prev: any) => [...prev, park.data])
                            } else {
                                setSheetCreated(true)
                            }
                        })
                    }
                } else {
                    toast.error(res.data.message);
                }
            }).catch((error) => {
                toast.error(s("errorcreate"));
            }).finally(() => {
                setSheetData([]); // Mettre à jour le tableau avec les données créées
            });
        }
    }, [sheetData]);


    const columnsSheet = getColumns()

    useEffect(() => {
        setColumns(columnsSheet);
    }, []);


    useEffect(() => {
        setLanguage(Cookies.get('lang') || 'en');
    }, []);

    const hasPermissionAction =
        session?.user?.permissions.find((permission: any) =>
            (permission === "park_update" || permission === "park_delete"
            ) ?? false) || session?.user?.is_admin;

    const handleSelectAll = (checked: boolean) => {
        setSelectAll(checked);
        if (checked) {
            onSelectionChange(parks.map(park => park.id));
        } else {
            onSelectionChange([]);
        }
    };

    const handleSelectPark = (parkId: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedIds, parkId]);
        } else {
            onSelectionChange(selectedIds.filter(id => id !== parkId));
            setSelectAll(false);
        }
    };

    const exportSelected = async (type: number = 1) => {
        const res = await getParksWithIds(selectedIds);
        if (res.status === 200) {
            // Utilisez votre fonction d'exportation existante
            generateFileClient(selectors, res.data, type);
        }
    };

    const exportAll = async (type: number = 1) => {
        generateFileClient(selectors, parks, type);
    };

    const isRTL = language === "ar";

    return (
        <div className="space-y-6">
            {/* Header avec actions */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>

                        <div className="flex flex-wrap gap-2">
                            {/* Bouton Ajouter */}
                            {(session?.user?.permissions.includes("park_create") || session?.user?.is_admin) && (
                                <>
                                    <Link href="/admin/parks/add">
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                            <Plus className="w-4 h-4 mr-2" />
                                            {t("addpark")}
                                        </Button>
                                    </Link>
                                    {/* Boutons Export */}
                                    <ExportButton
                                        all={true}
                                        handleExportCSV={() => exportAll(1)}
                                        handleExportXLSX={() => exportAll(2)}
                                    />
                                </>
                            )}

                            {selectedIds.length > 0 && (
                                <ExportButton
                                    all={false}
                                    handleExportCSV={() => exportSelected(1)}
                                    handleExportXLSX={() => exportSelected(2)}
                                />
                            )}

                            {/* Bouton Supprimer multiple */}
                            {selectedIds.length > 0 && (
                                <ConfirmDialogDelete
                                    open={openDeleteDialog}
                                    setOpen={setOpenDeleteDialog}
                                    selectedIds={selectedIds}
                                    textToastSelect={t("selectparks")}
                                    triggerText={t("deleteparks")}
                                    titleText={t("confermationdelete")}
                                    descriptionText={t("confermationdeletemessage")}
                                    deleteAction={deletePark}
                                />
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="p-4">
                        {sheetCreated && (
                            <div className="bg-blue-500 text-white p-4 mb-4 rounded">
                                {s("mustrefreshtoseedata")}
                            </div>
                        )}
                        {sheetNotCreated && sheetNotCreated.length > 0 && (
                            <div className="max-h-48 my-2 overflow-auto">
                                {sheetNotCreated.map((data: any, index: any) => (
                                    <div key={index} className="mt-4 p-4 bg-red-200 text-red-700 rounded">
                                        <h2 className="font-bold">{e("errors")}</h2>
                                        <ul className="list-disc pl-5">
                                            <li>
                                                {
                                                    (data.message ? data.message + " : " : "") + " " + (data.park.name ?? "") + " " + (data.park.address ?? "")
                                                }
                                            </li>
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Barre de recherche */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder={s("search")}
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full max-w-md"
                        />
                    </div>

                    {/* Tableau */}
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                        // <div className="h-64 flex items-center justify-center">
                        //     <Loading />
                        // </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                                    <tr>
                                        {/* Checkbox pour sélection multiple */}
                                        <th className="px-4 py-3 text-left w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                className="rounded border-gray-300"
                                            />
                                        </th>

                                        <th className={`px-4 py-3 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                                            {t("name")}
                                        </th>

                                        <th className={`px-4 py-3 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                                            {t("address")}
                                        </th>

                                        <th className={`px-4 py-3 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                                            {t("description")}
                                        </th>

                                        {hasPermissionAction && (
                                            <th className="px-4 py-3 font-medium text-center w-32">
                                                {s("actions")}
                                            </th>
                                        )}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {parks.length === 0 ? (
                                        <tr>
                                            <td colSpan={hasPermissionAction ? 5 : 4} className="px-4 py-8 text-center text-gray-500">
                                                {s("noresults")}
                                            </td>
                                        </tr>
                                    ) : (
                                        parks.map((park) => (
                                            <tr
                                                key={park.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                {/* Checkbox */}
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(park.id)}
                                                        onChange={(e) => handleSelectPark(park.id, e.target.checked)}
                                                        className="rounded border-gray-300"
                                                    />
                                                </td>

                                                {/* Nom */}
                                                <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {park.name}
                                                    </div>
                                                </td>

                                                {/* Adresse */}
                                                <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                                                    <div className="text-gray-600 dark:text-gray-300">
                                                        {park.address || "-"}
                                                    </div>
                                                </td>

                                                {/* Description */}
                                                <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                                                    <div className="text-gray-600 dark:text-gray-300 line-clamp-2">
                                                        {park.description || "-"}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                {hasPermissionAction && (
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-center space-x-2">
                                                            {/* Bouton Modifier */}
                                                            {(session?.user?.permissions.includes("park_update") || session?.user?.is_admin) && (
                                                                <Link href={`/admin/parks/edit/${park.id}`}>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </Button>
                                                                </Link>
                                                            )}

                                                            {/* Bouton Supprimer */}
                                                            {(session?.user?.permissions.includes("park_delete") || session?.user?.is_admin) && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => onDelete(park.id)}
                                                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Statistiques */}
                    <div className="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                        <div>
                            {selectedIds.length > 0 && (
                                <Badge variant="secondary" className="mr-2">
                                    {selectedIds.length} {s("selected")}
                                </Badge>
                            )}
                            {parks.length} {s("items")}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}