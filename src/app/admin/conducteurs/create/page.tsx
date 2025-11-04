"use client"

import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import ConducteurForm from "../_componenets/conducteur-form"

export default function CreateConducteurPage() {
    const t = useTranslations()
    const router = useRouter()

    const handleSuccess = () => {
        router.push("/admin/conducteurs")
    }

    return (
        <main className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/admin/conducteurs">
                        <Button
                            variant="outline"
                            className="gap-2 mb-4 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 bg-transparent"
                        >
                            <ArrowLeft size={20} />
                            {t("System.back")}
                        </Button>
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t("Conducteur.create")}</h1>
                    <p className="text-gray-600 dark:text-slate-400 mt-2">{t("Conducteur.create_description")}</p>
                </div>

                {/* Form */}
                <ConducteurForm onSuccess={handleSuccess} />
            </div>
        </main>
    )
}
