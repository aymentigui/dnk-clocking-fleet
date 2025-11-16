"use client"

import { Card } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { Car, Clock, MapPin } from "lucide-react"

interface Course {
    id: string
    start_date: string
    end_date?: string
    vehicle: {
        matricule: string
        model?: string
    }
    start_station?: string
    end_station?: string
    waiting: boolean
}

interface CoursesTableProps {
    courses: Course[]
}

export default function CoursesTable({ courses }: CoursesTableProps) {
    const t = useTranslations()

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDuration = (start: string, end?: string) => {
        if (!end) return "-"
        const startTime = new Date(start).getTime()
        const endTime = new Date(end).getTime()
        const duration = (endTime - startTime) / (1000 * 60 * 60) // heures
        return `${duration.toFixed(1)}h`
    }

    if (courses.length === 0) {
        return (
            <Card className="bg-card border-border p-8 text-center">
                <p className="text-muted-foreground">{t("Conducteur.no_courses_today")}</p>
            </Card>
        )
    }

    return (
        <Card className="bg-card border-border overflow-hidden">
            <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Car size={20} />
                    {t("Conducteur.daily_rotations")}
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                {t("Conducteur.vehicle")}
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                {t("Conducteur.start_time")}
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                {t("Conducteur.end_time")}
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                {t("Conducteur.duration")}
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                {t("Conducteur.route")}
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                {t("Conducteur.status")}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {courses.map((course) => (
                            <tr key={course.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Car size={16} className="text-muted-foreground" />
                                        <div>
                                            <div className="text-sm font-medium text-foreground">
                                                {course.vehicle.matricule}
                                            </div>
                                            {course.vehicle.model && (
                                                <div className="text-xs text-muted-foreground">
                                                    {course.vehicle.model}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {formatTime(course.start_date)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-foreground">
                                    {course.end_date ? (
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {formatTime(course.end_date)}
                                        </div>
                                    ) : (
                                        "-"
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-foreground">
                                    {formatDuration(course.start_date, course.end_date)}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <MapPin size={14} />
                                        {course.start_station || "-"} → {course.end_station || "-"}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${course.waiting
                                            ? "bg-yellow-100 text-yellow-800"
                                            : course.end_date
                                                ? "bg-green-100 text-green-800"
                                                : "bg-blue-100 text-blue-800"
                                        }`}>
                                        {course.waiting
                                            ? t("Conducteur.waiting")
                                            : course.end_date && course.end_station
                                                ? t("Conducteur.completed")
                                                : t("Conducteur.in_progress")
                                        }
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}