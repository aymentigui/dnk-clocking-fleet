"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { Clock, Car, Calendar, CalendarX } from "lucide-react"

interface StatisticsCardsProps {
    statistics: {
        total_hours: number
        total_courses: number
        total_clockings: number
        days_worked: number
        days_absent: number
        average_hours_per_day: number
    }
    period: string
}

export default function StatisticsCards({ statistics, period }: StatisticsCardsProps) {
    const t = useTranslations()

    const cards = [
        {
            title: t("Conducteur.total_hours"),
            value: `${statistics.total_hours}h`,
            description: t("Conducteur.average_per_day", { hours: statistics.average_hours_per_day }),
            icon: Clock,
            color: "text-blue-600"
        },
        {
            title: t("Conducteur.total_courses"),
            value: statistics.total_courses.toString(),
            description: t("Conducteur.rotations"),
            icon: Car,
            color: "text-green-600"
        },
        {
            title: t("Conducteur.days_worked"),
            value: statistics.days_worked.toString(),
            description: t("Conducteur.days"),
            icon: Calendar,
            color: "text-purple-600"
        },
        {
            title: t("Conducteur.days_absent"),
            value: statistics.days_absent.toString(),
            description: t("Conducteur.last_period"),
            icon: CalendarX,
            color: "text-red-600"
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <Card key={index} className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-foreground">
                            {card.title}
                        </CardTitle>
                        <card.icon className={`h-4 w-4 ${card.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{card.value}</div>
                        <p className="text-xs text-muted-foreground">
                            {card.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}