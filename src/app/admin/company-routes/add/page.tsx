// app/company-routes/add/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, RotateCcw, Building2 } from 'lucide-react'
import { getEnteprisesAdmin } from '@/actions/entreprise/get'
import { getRegionsAdmin } from '@/actions/region/get'
import { createEntrepriseRoute } from '@/actions/entreprise/set'
import toast from 'react-hot-toast'

interface RouteFormData {
    region_depart: string
    region_arrive: string
    distance?: number
    with_rotation: boolean
}

interface EntrepriseGroup {
    entreprise_id: string
    routes: RouteFormData[]
}

export default function AddCompanyRoutesPage() {
    const t = useTranslations('Company')
    const router = useRouter()
    const [entreprises, setEntreprises] = useState<any[]>([])
    const [regions, setRegions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [formLoading, setFormLoading] = useState(false)

    const [entrepriseGroups, setEntrepriseGroups] = useState<EntrepriseGroup[]>([
        {
            entreprise_id: '',
            routes: [
                {
                    region_depart: '',
                    region_arrive: '',
                    distance: undefined,
                    with_rotation: false
                }
            ]
        }
    ])

    const [errors, setErrors] = useState<Record<string, any>[]>([])

    // Charger les données
    useEffect(() => {
        loadData()
    }, [])

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

    // Ajouter une nouvelle entreprise
    const addEntreprise = () => {
        setEntrepriseGroups(prev => [
            ...prev,
            {
                entreprise_id: '',
                routes: [
                    {
                        region_depart: '',
                        region_arrive: '',
                        distance: undefined,
                        with_rotation: false
                    }
                ]
            }
        ])
    }

    // Supprimer une entreprise
    const removeEntreprise = (groupIndex: number) => {
        if (entrepriseGroups.length > 1) {
            setEntrepriseGroups(prev => prev.filter((_, i) => i !== groupIndex))
            setErrors(prev => prev.filter((_, i) => i !== groupIndex))
        }
    }

    // Mettre à jour l'entreprise
    const updateEntreprise = (groupIndex: number, entrepriseId: string) => {
        setEntrepriseGroups(prev =>
            prev.map((group, i) =>
                i === groupIndex ? { ...group, entreprise_id: entrepriseId } : group
            )
        )

        if (errors[groupIndex]?.entreprise_id) {
            setErrors(prev =>
                prev.map((error, i) =>
                    i === groupIndex ? { ...error, entreprise_id: '' } : error
                )
            )
        }
    }

    // Ajouter une route à une entreprise
    const addRoute = (groupIndex: number) => {
        setEntrepriseGroups(prev =>
            prev.map((group, i) =>
                i === groupIndex
                    ? {
                        ...group,
                        routes: [
                            ...group.routes,
                            {
                                region_depart: '',
                                region_arrive: '',
                                distance: undefined,
                                with_rotation: false
                            }
                        ]
                    }
                    : group
            )
        )
    }

    // Supprimer une route
    const removeRoute = (groupIndex: number, routeIndex: number) => {
        setEntrepriseGroups(prev =>
            prev.map((group, i) =>
                i === groupIndex && group.routes.length > 1
                    ? {
                        ...group,
                        routes: group.routes.filter((_, j) => j !== routeIndex)
                    }
                    : group
            )
        )
    }

    // Mettre à jour une route
    const updateRoute = (
        groupIndex: number,
        routeIndex: number,
        field: keyof RouteFormData,
        value: any
    ) => {
        setEntrepriseGroups(prev =>
            prev.map((group, i) =>
                i === groupIndex
                    ? {
                        ...group,
                        routes: group.routes.map((route, j) =>
                            j === routeIndex ? { ...route, [field]: value } : route
                        )
                    }
                    : group
            )
        )

        if (errors[groupIndex]?.routes?.[routeIndex]?.[field]) {
            setErrors(prev =>
                prev.map((error, i) => {
                    if (i === groupIndex && error.routes?.[routeIndex]) {
                        const newRoutes = [...error.routes]
                        newRoutes[routeIndex] = { ...newRoutes[routeIndex], [field]: '' }
                        return { ...error, routes: newRoutes }
                    }
                    return error
                })
            )
        }
    }

    // Validation
    const validateForm = (): boolean => {
        const newErrors: Record<string, any>[] = []

        entrepriseGroups.forEach((group, groupIndex) => {
            const groupErrors: Record<string, any> = { routes: [] }

            if (!group.entreprise_id) {
                groupErrors.entreprise_id = t('select_entreprise')
            }

            group.routes.forEach((route, routeIndex) => {
                const routeErrors: Record<string, string> = {}

                if (!route.region_depart) {
                    routeErrors.region_depart = t('select_region_depart')
                }
                if (!route.region_arrive) {
                    routeErrors.region_arrive = t('select_region_arrive')
                }
                if (
                    route.region_depart &&
                    route.region_arrive &&
                    route.region_depart === route.region_arrive
                ) {
                    routeErrors.region_arrive = 'Departure and arrival regions must be different'
                }

                groupErrors.routes.push(routeErrors)
            })

            newErrors.push(groupErrors)
        })

        setErrors(newErrors)

        return newErrors.every(
            error =>
                !error.entreprise_id &&
                error.routes.every((r: any) => Object.keys(r).length === 0)
        )
    }

    // Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setFormLoading(true)

            // Préparer toutes les routes
            const routesToSubmit: any[] = []

            entrepriseGroups.forEach(group => {
                group.routes.forEach(route => {
                    // Route principale
                    routesToSubmit.push({
                        entreprise_id: group.entreprise_id,
                        region_depart: route.region_depart,
                        region_arrive: route.region_arrive,
                        distance: route.distance
                    })

                    // Route retour si rotation
                    if (route.with_rotation) {
                        routesToSubmit.push({
                            entreprise_id: group.entreprise_id,
                            region_depart: route.region_arrive,
                            region_arrive: route.region_depart,
                            distance: route.distance
                        })
                    }
                })
            })

            // Créer toutes les routes
            const promises = routesToSubmit.map(routeData =>
                createEntrepriseRoute(routeData)
            )

            const results = await Promise.all(promises)
            const allSuccess = results.every(response => response.status === 200 || response.status === 201)

            if (allSuccess) {
                toast(routesToSubmit.length > 1 ? t('create_success_plural') : t('create_success'))
                router.push('/admin/company-routes')
            } else {
                toast.error('Error creating some routes')
            }
        } catch (error) {
            console.error('Error creating routes:', error)
            toast.error('Error creating routes')
        } finally {
            setFormLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors duration-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('back')}
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {t('create_multiple')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {t('create_multiple_description')}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {entrepriseGroups.map((group, groupIndex) => (
                        <div
                            key={groupIndex}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6"
                        >
                            {/* En-tête entreprise */}
                            <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Building2 className="h-5 w-5 text-blue-600" />
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                            {t('entreprise')} {groupIndex + 1}
                                        </h2>
                                    </div>
                                    <select
                                        value={group.entreprise_id}
                                        onChange={e => updateEntreprise(groupIndex, e.target.value)}
                                        className={`w-full max-w-md px-4 py-2.5 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                            ${errors[groupIndex]?.entreprise_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                    >
                                        <option value="">{t('select_entreprise')}</option>
                                        {entreprises.map(entreprise => (
                                            <option key={entreprise.id} value={entreprise.id}>
                                                {entreprise.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors[groupIndex]?.entreprise_id && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                            {errors[groupIndex]?.entreprise_id}
                                        </p>
                                    )}
                                </div>
                                {entrepriseGroups.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeEntreprise(groupIndex)}
                                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 
                                            dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30
                                            rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                )}
                            </div>

                            {/* Routes de cette entreprise */}
                            <div className="space-y-4">
                                {group.routes.map((route, routeIndex) => (
                                    <div
                                        key={routeIndex}
                                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-5 bg-gray-50 dark:bg-gray-700/50"
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-base font-medium text-gray-900 dark:text-white">
                                                {t('route')} {routeIndex + 1}
                                            </h3>
                                            {group.routes.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRoute(groupIndex, routeIndex)}
                                                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 
                                                        dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30
                                                        rounded transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Région Départ */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                    {t('region_depart')} *
                                                </label>
                                                <select
                                                    value={route.region_depart}
                                                    onChange={e =>
                                                        updateRoute(groupIndex, routeIndex, 'region_depart', e.target.value)
                                                    }
                                                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                                                        ${errors[groupIndex]?.routes?.[routeIndex]?.region_depart ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                                >
                                                    <option value="">{t('select_region_depart')}</option>
                                                    {regions.map(region => (
                                                        <option key={region.id} value={region.id}>
                                                            {region.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors[groupIndex]?.routes?.[routeIndex]?.region_depart && (
                                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                        {errors[groupIndex]?.routes?.[routeIndex]?.region_depart}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Région Arrivée */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                    {t('region_arrive')} *
                                                </label>
                                                <select
                                                    value={route.region_arrive}
                                                    onChange={e =>
                                                        updateRoute(groupIndex, routeIndex, 'region_arrive', e.target.value)
                                                    }
                                                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                                                        ${errors[groupIndex]?.routes?.[routeIndex]?.region_arrive ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                                >
                                                    <option value="">{t('select_region_arrive')}</option>
                                                    {regions.map(region => (
                                                        <option key={region.id} value={region.id}>
                                                            {region.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors[groupIndex]?.routes?.[routeIndex]?.region_arrive && (
                                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                        {errors[groupIndex]?.routes?.[routeIndex]?.region_arrive}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Distance */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                    {t('distance')} (km)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={route.distance || ''}
                                                    onChange={e =>
                                                        updateRoute(
                                                            groupIndex,
                                                            routeIndex,
                                                            'distance',
                                                            e.target.value ? Number(e.target.value) : undefined
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                                        shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                    placeholder="0"
                                                    min="0"
                                                    step="0.1"
                                                />
                                            </div>
                                        </div>

                                        {/* Checkbox Rotation */}
                                        <div className="mt-3">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={route.with_rotation}
                                                    onChange={e =>
                                                        updateRoute(groupIndex, routeIndex, 'with_rotation', e.target.checked)
                                                    }
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500
                                                        dark:border-gray-600 dark:bg-gray-800"
                                                />
                                                <RotateCcw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {t('with_rotation')}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                ))}

                                {/* Bouton ajouter une route */}
                                <button
                                    type="button"
                                    onClick={() => addRoute(groupIndex)}
                                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 
                                        rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
                                        transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="text-sm font-medium">{t('add_another_route')}</span>
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Bouton ajouter une entreprise */}
                    <button
                        type="button"
                        onClick={addEntreprise}
                        className="w-full py-4 border-2 border-dashed border-blue-300 dark:border-blue-600 
                            rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20
                            transition-colors flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400"
                    >
                        <Building2 className="h-5 w-5" />
                        <span className="font-medium">{t('add_another_entreprise')}</span>
                    </button>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => router.push('/admin/company-routes')}
                            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 
                                rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white 
                                rounded-lg transition-colors flex items-center gap-2 font-medium"
                        >
                            {formLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    {t('creating')}...
                                </>
                            ) : (
                                t('create_routes')
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}