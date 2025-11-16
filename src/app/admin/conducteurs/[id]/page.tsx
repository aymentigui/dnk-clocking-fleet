"use client"

import { useTranslations } from "next-intl"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, User, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { getConducteurAbsentDays, getConducteurClockings, getConducteurCourses, getConducteurDetails, getConducteurStatistics } from "@/actions/conducteur/get-statistics"
import DateNavigation from "../_componenets/date-navigation"
import CoursesTable from "../_componenets/courses-table"
import StatisticsCards from "../_componenets/statistics-cards"
import ClockingsTable from "../_componenets/clockings-table"
import AbsentDaysTable from "../_componenets/absent-days-table"

export default function ConducteurDetailPage() {
    const t = useTranslations()
    const params = useParams()
    const id = params.id as string

    const [conducteur, setConducteur] = useState<any>(null)
    const [statistics, setStatistics] = useState<any>(null)
    const [courses, setCourses] = useState<any[] | any>([])
    const [clockings, setClockings] = useState<any[] | any>([])
    const [absentDays, setAbsentDays] = useState<string[] | any>([])
    const [period, setPeriod] = useState<string>("week")
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    )
    const [loading, setLoading] = useState({
        details: true,
        statistics: true,
        courses: true,
        clockings: true,
        absentDays: true
    })

    useEffect(() => {
        loadConducteurDetails()
    }, [id])

    useEffect(() => {
        if (conducteur) {
            loadStatistics()
            loadAbsentDays()
        }
    }, [conducteur, period])

    useEffect(() => {
        if (conducteur) {
            loadDailyData()
        }
    }, [conducteur, selectedDate])

    const loadConducteurDetails = async () => {
        try {
            const result = await getConducteurDetails(id)
            if (result.status === 200) {
                setConducteur(result.data)
            }
        } catch (error) {
            console.error("Error loading conducteur details:", error)
        } finally {
            setLoading(prev => ({ ...prev, details: false }))
        }
    }

    const loadStatistics = async () => {
        setLoading(prev => ({ ...prev, statistics: true }))
        try {
            const result = await getConducteurStatistics(id, period)
            if (result.status === 200) {
                setStatistics(result.data)
            }
        } catch (error) {
            console.error("Error loading statistics:", error)
        } finally {
            setLoading(prev => ({ ...prev, statistics: false }))
        }
    }

    const loadDailyData = async () => {
        setLoading(prev => ({ ...prev, courses: true, clockings: true }))

        try {
            const [coursesResult, clockingsResult] = await Promise.all([
                getConducteurCourses(id, selectedDate),
                getConducteurClockings(id, selectedDate)
            ])

            if (coursesResult.status === 200) {
                setCourses(coursesResult.data)
            }
            if (clockingsResult.status === 200) {
                setClockings(clockingsResult.data)
            }
        } catch (error) {
            console.error("Error loading daily data:", error)
        } finally {
            setLoading(prev => ({ ...prev, courses: false, clockings: false }))
        }
    }

    const loadAbsentDays = async () => {
        setLoading(prev => ({ ...prev, absentDays: true }))
        try {
            const result = await getConducteurAbsentDays(id)
            if (result.status === 200) {
                setAbsentDays(result.data)
            }
        } catch (error) {
            console.error("Error loading absent days:", error)
        } finally {
            setLoading(prev => ({ ...prev, absentDays: false }))
        }
    }

    if (loading.details) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <Loader className="h-6 w-6 animate-spin" />
                    <span>{t("System.loading")}</span>
                </div>
            </div>
        )
    }

    if (!conducteur) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="p-8 text-center">
                    <p className="text-destructive">{t("Conducteur.not_found")}</p>
                    <Link href="/admin/conducteurs">
                        <Button className="mt-4 gap-2">
                            <ArrowLeft size={16} />
                            {t("System.back_to_list")}
                        </Button>
                    </Link>
                </Card>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/admin/conducteurs">
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowLeft size={16} />
                                {t("System.back")}
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                                <User size={32} className="text-primary" />
                                {conducteur.firstname} {conducteur.lastname}
                            </h1>
                            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                                <span>Matricule: <strong>{conducteur.matricule}</strong></span>
                                {conducteur.phone && (
                                    <span>Téléphone: <strong>{conducteur.phone}</strong></span>
                                )}
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${conducteur.work_status
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}>
                                    {conducteur.work_status ? t("Conducteur.active") : t("Conducteur.inactive")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Period Selector */}
                <Card className="bg-card border-border p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-foreground">
                            {t("Conducteur.statistics")}
                        </h2>
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder={t("Conducteur.select_period")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">{t("Conducteur.today")}</SelectItem>
                                <SelectItem value="week">{t("Conducteur.this_week")}</SelectItem>
                                <SelectItem value="month">{t("Conducteur.this_month")}</SelectItem>
                                <SelectItem value="3months">{t("Conducteur.last_3months")}</SelectItem>
                                <SelectItem value="year">{t("Conducteur.this_year")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {/* Statistics */}
                {loading.statistics ? (
                    <Card className="bg-card border-border p-12 text-center mb-8">
                        <div className="flex items-center justify-center gap-2">
                            <Loader className="h-5 w-5 animate-spin" />
                            <span>{t("System.loading")}</span>
                        </div>
                    </Card>
                ) : statistics && (
                    <StatisticsCards statistics={statistics} period={period} />
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column - Daily Data */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Date Navigation */}
                        <DateNavigation
                            currentDate={selectedDate}
                            onDateChange={setSelectedDate}
                        />

                        {/* Courses Table */}
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-4">
                                {t("Conducteur.rotations")} - {new Date(selectedDate).toLocaleDateString('fr-FR')}
                            </h3>
                            {loading.courses ? (
                                <Card className="bg-card border-border p-12 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader className="h-5 w-5 animate-spin" />
                                        <span>{t("System.loading")}</span>
                                    </div>
                                </Card>
                            ) : (
                                <CoursesTable courses={courses} />
                            )}
                        </div>

                        {/* Clockings Table */}
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-4">
                                {t("Clocking.title")} - {new Date(selectedDate).toLocaleDateString('fr-FR')}
                            </h3>
                            {loading.clockings ? (
                                <Card className="bg-card border-border p-12 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader className="h-5 w-5 animate-spin" />
                                        <span>{t("System.loading")}</span>
                                    </div>
                                </Card>
                            ) : (
                                <ClockingsTable clockings={clockings} />
                            )}
                        </div>
                    </div>

                    {/* Right Column - Absent Days */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                            {t("Conducteur.absence_tracking")}
                        </h3>
                        {loading.absentDays ? (
                            <Card className="bg-card border-border p-12 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <Loader className="h-5 w-5 animate-spin" />
                                    <span>{t("System.loading")}</span>
                                </div>
                            </Card>
                        ) : (
                            <AbsentDaysTable absentDays={absentDays} />
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}