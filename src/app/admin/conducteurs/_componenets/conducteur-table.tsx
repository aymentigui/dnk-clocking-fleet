"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { Edit2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { CheckboxIndeterminate } from "@/components/ui/checkbox-indeterminate"

interface Conducteur {
    id: string
    matricule: string
    firstname?: string
    lastname?: string
    phone?: string
}

interface ConducteurTableProps {
    conducteurs: Conducteur[]
    selectedIds: string[]
    onSelectAll: (checked: boolean) => void
    onSelectOne: (id: string, checked: boolean) => void
}

export default function ConducteurTable({ conducteurs, selectedIds, onSelectAll, onSelectOne }: ConducteurTableProps) {
    const t = useTranslations()

    if (conducteurs.length === 0) {
        return (
            <Card className="bg-card border-border p-12 text-center">
                <p className="text-muted-foreground">{t("Conducteur.no_data")}</p>
            </Card>
        )
    }

    const isAllSelected = conducteurs.length > 0 && selectedIds.length === conducteurs.length
    const isIndeterminate = selectedIds.length > 0 && selectedIds.length < conducteurs.length

    return (
        <Card className="bg-card border-border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                        <tr>
                            <th className="px-6 py-4 text-left">
                                <CheckboxIndeterminate
                                    checked={isAllSelected}
                                    indeterminate={isIndeterminate}
                                    onChange={onSelectAll}
                                    className="border-border"
                                />
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">{t("Conducteur.matricule")}</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">{t("Conducteur.firstname")}</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">{t("Conducteur.lastname")}</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">{t("Conducteur.phone")}</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">{t("System.actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {conducteurs.map((conducteur) => (
                            <tr key={conducteur.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4">
                                    <Checkbox
                                        checked={selectedIds.includes(conducteur.id)}
                                        onCheckedChange={(checkedState) => onSelectOne(conducteur.id, checkedState === true)}
                                        className="border-border"
                                    />
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-foreground">{conducteur.matricule}</td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">{conducteur.firstname || "-"}</td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">{conducteur.lastname || "-"}</td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">{conducteur.phone || "-"}</td>
                                <td className="px-6 py-4 text-sm flex gap-2">
                                    <a href={`/admin/conducteurs/${conducteur.id}/edit`}>
                                        <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                                            <Edit2 size={16} />
                                            {t("System.edit")}
                                        </Button>
                                    </a>
                                    <a href={`/admin/conducteurs/${conducteur.id}`}>
                                        <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                                            <Edit2 size={16} />
                                            {t("Conducteur.view")}
                                        </Button>
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
