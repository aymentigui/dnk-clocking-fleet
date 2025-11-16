"use client"

import { Card } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { MapPin, Car, ClipboardCheck } from "lucide-react"

interface Clocking {
    id: string
    created_at: string
    type?: number
    vehicle: {
        matricule: string
    }
    park?: {
        name: string
    }
    region?: {
        name: string
    }
    device?: {
        code: string
    }
}

interface ClockingsTableProps {
    clockings: Clocking[]
}

export default function ClockingsTable({ clockings }: ClockingsTableProps) {
    const t = useTranslations()

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString)
        return {
            time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            date: date.toLocaleDateString('fr-FR')
        }
    }

    const getTypeLabel = (type?: number) => {
        switch (type) {
            case 1: return t("Conducteur.entry")
            case 2: return t("Conducteur.exit")
            default: return t("Conducteur.unknown")
        }
    }

    const getTypeColor = (type?: number) => {
        switch (type) {
            case 1: return "bg-green-100 text-green-800"
            case 2: return "bg-red-100 text-red-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    if (clockings.length === 0) {
        return (
            <Card className="bg-card border-border p-8 text-center">
                <p className="text-muted-foreground">{t("Conducteur.no_clockings_today")}</p>
            </Card>
        )
    }

    return (
        <Card className="bg-card border-border overflow-hidden">
            <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <ClipboardCheck size={20} />
                    {t("Conducteur.daily_clockings")}
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                {t("Conducteur.time")}
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                {t("Conducteur.vehicle")}
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                {t("Conducteur.location")}
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                {t("Conducteur.device")}
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                {t("Conducteur.type")}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {clockings.map((clocking) => {
                            const { time, date } = formatDateTime(clocking.created_at)
                            return (
                                <tr key={clocking.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-foreground">{time}</div>
                                        <div className="text-xs text-muted-foreground">{date}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Car size={16} className="text-muted-foreground" />
                                            <span className="text-sm text-foreground">
                                                {clocking.vehicle.matricule}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-muted-foreground" />
                                            <span className="text-sm text-foreground">
                                                {clocking.park?.name || clocking.region?.name || "-"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {clocking.device?.code || "-"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(clocking.type)}`}>
                                            {getTypeLabel(clocking.type)}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}