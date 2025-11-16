"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

interface DateNavigationProps {
    currentDate: string
    onDateChange: (date: string) => void
}

export default function DateNavigation({ currentDate, onDateChange }: DateNavigationProps) {
    const t = useTranslations()

    const navigateDate = (direction: 'prev' | 'next') => {
        const date = new Date(currentDate)
        if (direction === 'prev') {
            date.setDate(date.getDate() - 1)
        } else {
            date.setDate(date.getDate() + 1)
        }
        onDateChange(date.toISOString().split('T')[0])
    }

    const isToday = currentDate === new Date().toISOString().split('T')[0]

    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateDate('prev')}
                    className="gap-2"
                >
                    <ChevronLeft size={16} />
                    {t("StatisticsConducteurs.previous")}
                </Button>

                <input
                    type="date"
                    value={currentDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="px-3 py-2 border border-border rounded-md bg-input text-foreground"
                />

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateDate('next')}
                    disabled={isToday}
                    className="gap-2"
                >
                    {t("System.next")}
                    <ChevronRight size={16} />
                </Button>
            </div>

            {isToday && (
                <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {t("Conducteur.today")}
                </span>
            )}
        </div>
    )
}