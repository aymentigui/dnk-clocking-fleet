// app/components/companies/CompaniesTable.tsx
"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Loader } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getEnteprisesAdmin, getEnteprisesWithIds } from '@/actions/entreprise/get'
import { generateFileClient } from '@/actions/util/export-data/export-client'
import { getColumns } from '@/actions/util/sheet-columns/company'
import { useImportSheetsStore } from '@/hooks/use-import-csv'
import { createentreprises } from '@/actions/entreprise/set'
import toast from 'react-hot-toast'
import ExportButton from '@/components/my/export-button'

interface Company {
    id: string
    name: string
    description?: string
    address?: string
    phone?: string
    createdAt: string
}

interface CompaniesTableProps {
    companies: Company[]
    onEdit: (company: Company) => void
    onDelete: (ids: string[]) => void
    onCreate: () => void
    loading?: boolean
}

const selectors = [
    { title: "id", selector: "id" },
    { title: "name", selector: "name" },
    { title: "description", selector: "description" },
    { title: "address", selector: "address" },
    { title: "phone", selector: "phone" },
];


export default function CompaniesTable({
    companies: initialCompanies,
    onEdit,
    onDelete,
    onCreate,
    loading = false,
}: CompaniesTableProps) {
    const t = useTranslations('Company')
    const s = useTranslations('System')
    const e = useTranslations('Error')
    const [companies, setCompanies] = useState<Company[]>(initialCompanies)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [sheetNotCreated, setSheetNotCreated] = useState<any>([])
    const [sheetCreated, setSheetCreated] = useState(false)
    const { data: sheetData, setColumns, setData: setSheetData } = useImportSheetsStore();
    const columnsSheet = getColumns()


    // Charger les entreprises
    useEffect(() => {
        setColumns(columnsSheet);
    }, [])

    // pour la creation depuis les sheet
    useEffect(() => {
        if (sheetData && sheetData.length > 0) {
            createentreprises(sheetData).then((res) => {
                if (res.status === 200) {
                    if (res.data.entreprises) {
                        res.data.entreprises.forEach((entreprise) => {
                            if (entreprise.status !== 200) {
                                setSheetNotCreated((prev: any) => [...prev, entreprise.data])
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

    useEffect(() => {
        setCompanies(initialCompanies)
    }, [initialCompanies])

    // Filtrer les entreprises basé sur la recherche
    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.phone?.includes(searchTerm)
    )

    // Pagination
    const indexOfLastRow = currentPage * rowsPerPage
    const indexOfFirstRow = indexOfLastRow - rowsPerPage
    const currentCompanies = filteredCompanies.slice(indexOfFirstRow, indexOfLastRow)
    const totalPages = Math.ceil(filteredCompanies.length / rowsPerPage)


    const exportSelected = async (type: number = 1) => {
        const res = await getEnteprisesWithIds(selectedCompanies);
        if (res.status === 200) {
            // Utilisez votre fonction d'exportation existante
            generateFileClient(selectors, res.data, type);
        }
    };

    const exportAll = async (type: number = 1) => {
        const res = await getEnteprisesAdmin();
        if (res.status !== 200) {
            return;
        }
        const parks = res.data;
        generateFileClient(selectors, parks, type);
    };

    // Sélection/désélection
    const toggleSelectAll = () => {
        if (selectedCompanies.length === currentCompanies.length) {
            setSelectedCompanies([])
        } else {
            setSelectedCompanies(currentCompanies.map(company => company.id))
        }
    }

    const toggleSelectCompany = (id: string) => {

        setSelectedCompanies(prev =>
            prev.includes(id)
                ? prev.filter(companyId => companyId !== id)
                : [...prev, id]
        )
    }

    const handleDeleteSelected = () => {
        if (selectedCompanies.length > 0) {
            if (confirm(t('delete_confirm_plural', { count: selectedCompanies.length }))) {
                onDelete(selectedCompanies)
                setSelectedCompanies([])
            }
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Header avec recherche et actions */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t('title')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {t('list')}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {/* Barre de recherche */}
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder={t('search_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         w-full sm:w-64 transition-colors duration-200"
                            />
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex gap-2">
                            {selectedCompanies.length > 0 && (
                                <button
                                    onClick={handleDeleteSelected}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg
                           flex items-center gap-2 transition-colors duration-200
                           focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {t('delete')} ({selectedCompanies.length})
                                </button>
                            )}
                            <Link href="/admin/sheetimport">
                                <Button>{s('import')}</Button>
                            </Link>
                            {/* Boutons Export */}
                            <ExportButton
                                all={true}
                                handleExportCSV={() => exportAll(1)}
                                handleExportXLSX={() => exportAll(2)}
                            />
                            {selectedCompanies.length > 0 && (
                                <ExportButton
                                    all={false}
                                    handleExportCSV={() => exportSelected(1)}
                                    handleExportXLSX={() => exportSelected(2)}
                                />
                            )}
                            <button
                                onClick={onCreate}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                         flex items-center gap-2 transition-colors duration-200
                         focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <Plus className="h-4 w-4" />
                                {t('create')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div>
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
                                            (data.message ? data.message + " : " : "") + " " + (data.entreprise.name ?? "") + " " + (data.entreprise.address ?? "")
                                        }
                                    </li>
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="w-12 px-6 py-4">
                                <input
                                    type="checkbox"
                                    checked={selectedCompanies.length === currentCompanies.length && currentCompanies.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500
                           dark:border-gray-600 dark:bg-gray-800"
                                />
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {t('name')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {t('description')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {t('address')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {t('phone')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {t('actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="flex justify-center items-center">
                                        <Loader className="h-8 w-8 animate-spin text-blue-600" />
                                    </div>
                                </td>
                            </tr>
                        ) : currentCompanies.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="text-gray-500 dark:text-gray-400">
                                        {searchTerm ? t('no_companies') : t('no_companies')}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            currentCompanies.map((company) => (
                                <tr
                                    key={company.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                                >
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedCompanies.includes(company.id)}
                                            onChange={() => toggleSelectCompany(company.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500
                               dark:border-gray-600 dark:bg-gray-800"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {company.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                            {company.description || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                            {company.address || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            {company.phone || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onEdit(company)}
                                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 
                                 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30
                                 rounded-lg transition-colors duration-200"
                                                title={t('edit')}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(t('delete_confirm'))) {
                                                        onDelete([company.id])
                                                    }
                                                }}
                                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 
                                 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30
                                 rounded-lg transition-colors duration-200"
                                                title={t('delete')}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            {t('selected')} {selectedCompanies.length} {t('of')} {filteredCompanies.length}
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Sélection du nombre de lignes */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {t('rows_per_page')}:
                                </span>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value))
                                        setCurrentPage(1)
                                    }}
                                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="5">5</option>
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                </select>
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                <span className="text-sm text-gray-700 dark:text-gray-300 min-w-20 text-center">
                                    {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredCompanies.length)} {t('of')} {filteredCompanies.length}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}