// app/company-routes/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { getEnteprisesAdmin, getEntreprisesRoutes } from '@/actions/entreprise/get'
import { getRegionsAdmin } from '@/actions/region/get'
import { deleteEntrepriseRoutes } from '@/actions/entreprise/delete'
import CompanyRoutesTable from './_componenets/CompanyRoutesTable'

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

interface RoutesResponse {
    routes: CompanyRoute[]
    totalCount: number
    currentPage: number
    totalPages: number
}

export default function CompanyRoutesPage() {
    const t = useTranslations('Company')
    const router = useRouter()
    const [routesData, setRoutesData] = useState<RoutesResponse>({
        routes: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 1
    })
    const [sizePage, setSizePage] = useState(20)
    const [entreprises, setEntreprises] = useState<any[]>([])
    const [regions, setRegions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filtres et pagination
    const [filters, setFilters] = useState({
        entreprise_id: '',
        region_depart: '',
        region_arrive: '',
        enableAll: false
    })
    const [currentPage, setCurrentPage] = useState(1)

    // Charger les données
    useEffect(() => {
        loadData()
    }, [])

    // Recharger les routes quand les filtres ou la page changent
    useEffect(() => {
        loadRoutes()
    }, [filters, currentPage, sizePage])

    const loadData = async () => {
        try {
            setLoading(true)
            await Promise.all([
                loadEntreprises(),
                loadRegions()
            ])
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadRoutes = async () => {
        try {
            const response = await getEntreprisesRoutes(
                currentPage,
                filters.entreprise_id,
                filters.region_depart,
                filters.region_arrive,
                filters.enableAll,
                sizePage
            )
            if (response.status === 200) {
                setRoutesData(response.data)
            }
        } catch (error) {
            console.error('Error loading routes:', error)
        }
    }

    const loadEntreprises = async () => {
        try {
            const response = await getEnteprisesAdmin()
            if (response.status === 200) {
                setEntreprises(response.data)
            }
        } catch (error) {
            console.error('Error loading entreprises:', error)
        }
    }

    const loadRegions = async () => {
        try {
            const response = await getRegionsAdmin()
            if (response.status === 200) {
                setRegions(response.data)
            }
        } catch (error) {
            console.error('Error loading regions:', error)
        }
    }

    const handleDelete = async (ids: string[]) => {
        try {
            const response = await deleteEntrepriseRoutes(ids)

            if (response.status === 200) {
                await loadRoutes()
                alert(ids.length > 1 ? t('delete_success_plural') : t('delete_success'))
            }
        } catch (error) {
            console.error('Error deleting routes:', error)
            alert('Error deleting routes')
        }
    }

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters)
        setCurrentPage(1) // Reset to first page when filters change
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <CompanyRoutesTable
                    routes={routesData.routes}
                    totalCount={routesData.totalCount}
                    currentPage={routesData.currentPage}
                    totalPages={routesData.totalPages}
                    onDelete={handleDelete}
                    onCreate={() => router.push('/admin/company-routes/add')}
                    onPageChange={handlePageChange}
                    loading={loading}
                    entreprises={entreprises}
                    regions={regions}
                    onFilterChange={handleFilterChange}
                    onSizePageChange={(value)=>setSizePage(value)}
                />
            </div>
        </div>
    )
}