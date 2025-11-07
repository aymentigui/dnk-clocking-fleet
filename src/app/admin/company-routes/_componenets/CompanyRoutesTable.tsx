// app/company-routes/_components/CompanyRoutesTable.tsx
"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, ChevronLeft, ChevronRight, Loader, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface CompanyRoute {
    id: string
    entreprise_id: string
    entreprise?: {
        name: string
    }
    region_depart: string
    region_arrive: string
    distance?: number
    createdAt: string
}

interface CompanyRoutesTableProps {
    routes: CompanyRoute[]
    totalCount: number
    currentPage: number
    totalPages: number
    onDelete: (ids: string[]) => void
    onCreate: () => void
    onPageChange: (page: number) => void
    onSizePageChange?: (size: number) => void
    loading?: boolean
    entreprises: any[]
    regions: any[]
    onFilterChange: (filters: {
        entreprise_id?: string
        region_depart?: string
        region_arrive?: string
        enableAll?: boolean
    }) => void
}

export default function CompanyRoutesTable({
    routes,
    totalCount,
    currentPage,
    totalPages,
    onDelete,
    onCreate,
    onPageChange,
    onSizePageChange,
    loading = false,
    entreprises,
    regions,
    onFilterChange
}: CompanyRoutesTableProps) {
    const t = useTranslations('Company')
    const [selectedRoutes, setSelectedRoutes] = useState<string[]>([])
    const [rowsPerPage, setRowsPerPage] = useState(20)

    // Filtres
    const [filters, setFilters] = useState({
        entreprise_id: '',
        region_depart: '',
        region_arrive: '',
        enableAll: false
    })

    useEffect(() => {
        onFilterChange(filters)
    }, [filters, onFilterChange])

    // Sélection/désélection
    const toggleSelectAll = () => {
        if (selectedRoutes.length === routes.length) {
            setSelectedRoutes([])
        } else {
            setSelectedRoutes(routes.map(route => route.id))
        }
    }

    const toggleSelectRoute = (id: string) => {
        setSelectedRoutes(prev =>
            prev.includes(id)
                ? prev.filter(routeId => routeId !== id)
                : [...prev, id]
        )
    }

    const handleDeleteSelected = () => {
        if (selectedRoutes.length > 0) {
            if (confirm(t('delete_confirm_plural', { count: selectedRoutes.length }))) {
                onDelete(selectedRoutes)
                setSelectedRoutes([])
            }
        }
    }

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const getRegionName = (regionId: string) => {
        const region = regions.find(r => r.id === regionId)
        return region?.name || regionId
    }

    const handleRowsPerPageChange = (value: number) => {
        setRowsPerPage(value)
        if (onSizePageChange) {
            onSizePageChange(value)
        }
        // Note: Vous devrez peut-être adapter votre backend pour gérer différents rowsPerPage
    }

    const generatePageNumbers = () => {
        const pages = []
        const maxVisiblePages = 5

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i)
        }

        return pages
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Header avec filtres et actions */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t('title')}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {t('list')} - {totalCount} {t('routes').toLowerCase()}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            {selectedRoutes.length > 0 && (
                                <button
                                    onClick={handleDeleteSelected}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg
                           flex items-center gap-2 transition-colors duration-200
                           focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {t('delete')} ({selectedRoutes.length})
                                </button>
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

                    {/* Filtres */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {/* Filtre Entreprise */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('entreprise')}
                            </label>
                            <select
                                value={filters.entreprise_id}
                                onChange={(e) => handleFilterChange('entreprise_id', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">{t('select_entreprise')}</option>
                                {entreprises.map(entreprise => (
                                    <option key={entreprise.id} value={entreprise.id}>
                                        {entreprise.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtre Région Départ */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('region_depart')}
                            </label>
                            <select
                                value={filters.region_depart}
                                onChange={(e) => handleFilterChange('region_depart', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">{t('select_region_depart')}</option>
                                {regions.map(region => (
                                    <option key={region.id} value={region.id}>
                                        {region.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtre Région Arrivée */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('region_arrive')}
                            </label>
                            <select
                                value={filters.region_arrive}
                                onChange={(e) => handleFilterChange('region_arrive', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">{t('select_region_arrive')}</option>
                                {regions.map(region => (
                                    <option key={region.id} value={region.id}>
                                        {region.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Checkbox Enable All */}
                        <div className="flex items-end">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.enableAll}
                                    onChange={(e) => handleFilterChange('enableAll', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500
                           dark:border-gray-600 dark:bg-gray-800"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {t('enable_all')}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="w-12 px-6 py-4">
                                <input
                                    type="checkbox"
                                    checked={selectedRoutes.length === routes.length && routes.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500
                           dark:border-gray-600 dark:bg-gray-800"
                                />
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {t('entreprise')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {t('region_depart')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {t('region_arrive')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {t('distance')}
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
                        ) : routes.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="text-gray-500 dark:text-gray-400">
                                        {t('no_routes')}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            routes.map((route) => (
                                <tr
                                    key={route.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                                >
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedRoutes.includes(route.id)}
                                            onChange={() => toggleSelectRoute(route.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500
                               dark:border-gray-600 dark:bg-gray-800"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {route.entreprise?.name || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            {getRegionName(route.region_depart)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            {getRegionName(route.region_arrive)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            {route.distance ? `${route.distance} km` : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    if (confirm(t('delete_confirm'))) {
                                                        onDelete([route.id])
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
                            {t('selected')} {selectedRoutes.length} {t('of')} {totalCount} {t('routes').toLowerCase()}
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Sélection du nombre de lignes */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {t('rows_per_page')}:
                                </span>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center gap-2">
                                {/* First Page */}
                                <button
                                    onClick={() => onPageChange(1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </button>

                                {/* Previous Page */}
                                <button
                                    onClick={() => onPageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {/* Page Numbers */}
                                <div className="flex gap-1">
                                    {generatePageNumbers().map(page => (
                                        <button
                                            key={page}
                                            onClick={() => onPageChange(page)}
                                            className={`px-3 py-1 rounded-lg border transition-colors duration-200 ${currentPage === page
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                {/* Next Page */}
                                <button
                                    onClick={() => onPageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>

                                {/* Last Page */}
                                <button
                                    onClick={() => onPageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Page Info */}
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {t('page')} {currentPage} {t('of')} {totalPages}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}