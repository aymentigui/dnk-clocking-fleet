"use client"

import { Card } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { CalendarX } from "lucide-react"

interface AbsentDaysTableProps {
    absentDays: string[]
}

export default function AbsentDaysTable({ absentDays }: AbsentDaysTableProps) {
    const t = useTranslations()

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    if (absentDays.length === 0) {
        return (
            <Card className="bg-card border-border p-8 text-center">
                <div className="flex flex-col items-center gap-2">
                    <CalendarX size={48} className="text-green-600 mb-2" />
                    <p className="text-muted-foreground font-medium">
                        {t("Conducteur.no_absent_days")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {t("Conducteur.perfect_attendance")}
                    </p>
                </div>
            </Card>
        )
    }

    return (
        <Card className="bg-card border-border overflow-hidden">
            <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <CalendarX size={20} />
                    {t("Conducteur.absent_days_last_3months")} ({absentDays.length})
                </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-border">
                    {absentDays.map((day, index) => (
                        <div key={index} className="p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-foreground">
                                        {formatDate(day)}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                    {t("Conducteur.absent")}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    )
}