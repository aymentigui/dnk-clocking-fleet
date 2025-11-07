// app/companies/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import CompaniesTable from './CompaniesTable'
import CompanyForm from './CompanyForm'
import { getEntreprises } from '@/actions/entreprise/get'
import { deleteEntreprise } from '@/actions/entreprise/delete'
import toast from 'react-hot-toast'
import { createEntreprise } from '@/actions/entreprise/set'
import { UpdateEntreprise } from '@/actions/entreprise/update'

interface Company {
    id: string
    name: string
    description?: string
    address?: string
    phone?: string
    createdAt: string
}

export default function CompaniesPage() {
    const t = useTranslations('Company')
    const s = useTranslations('System')
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingCompany, setEditingCompany] = useState<Company | null>(null)
    const [formLoading, setFormLoading] = useState(false)

    // Charger les entreprises
    useEffect(() => {
        loadCompanies()
    }, [])


    const loadCompanies = async () => {
        try {
            setLoading(true)
            const response = await getEntreprises()
            if (response.status === 200) {
                const data = response.data
                setCompanies(data)
            }
        } catch (error) {
            console.error('Error loading companies:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = () => {
        setEditingCompany(null)
        setShowForm(true)
    }

    const handleEdit = (company: Company) => {
        setEditingCompany(company)
        setShowForm(true)
    }

    const handleDelete = async (ids: string[]) => {
        try {
            const response = await deleteEntreprise(ids)

            if (response.status === 200) {
                // Recharger la liste
                await loadCompanies()
                // Afficher un message de succès
                toast(ids.length > 1 ? t('delete_success_plural') : t('delete_success'))
            }
        } catch (error) {
            console.error('Error deleting companies:', error)
            toast.error('Error deleting companies')
        }
    }

    const handleSubmit = async (data: any) => {
        try {
            setFormLoading(true)

            let response = null
            if (!editingCompany)
                response = await createEntreprise(data)
            else
                response = await UpdateEntreprise(editingCompany.id, data)

            if (response.status === 200 || response.status === 201) {
                await loadCompanies()
                setShowForm(false)
                setEditingCompany(null)
                toast(editingCompany ? t('update_success') : t('create_success'))
            } else {
                const error = response.data
                toast.error(error.message || 'Error saving company')
            }
        } catch (error) {
            // console.error('Error saving company:', error)
            toast.error('Error saving company')
        } finally {
            setFormLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <CompaniesTable
                    companies={companies}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCreate={handleCreate}
                    loading={loading}
                />

                {showForm && (
                    <CompanyForm
                        company={editingCompany}
                        onSubmit={handleSubmit}
                        onClose={() => {
                            setShowForm(false)
                            setEditingCompany(null)
                        }}
                        loading={formLoading}
                    />
                )}
            </div>
        </div>
    )
}