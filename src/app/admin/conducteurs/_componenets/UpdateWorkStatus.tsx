"use client"

import { useTranslations } from "next-intl"
import { AlertTriangle, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface UpdateWorkStatusDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => Promise<void>
    isUpdating: boolean
    count: number
    workStatus: boolean // true for activate, false for deactivate
}

export default function UpdateWorkStatusDialog({
    open,
    onOpenChange,
    onConfirm,
    isUpdating,
    count,
    workStatus,
}: UpdateWorkStatusDialogProps) {
    const t = useTranslations()

    const isActivate = workStatus

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className={isActivate ? "text-green-600" : "text-yellow-600"} size={24} />
                        <DialogTitle>{t("Conducteur.update_work_status_title")}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {count === 1 
                            ? (isActivate ? t("Conducteur.activate_one_desc") : t("Conducteur.deactivate_one_desc"))
                            : (isActivate ? t("Conducteur.activate_many_desc", { count }) : t("Conducteur.deactivate_many_desc", { count }))
                        }
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
                        {t("System.cancel")}
                    </Button>
                    <Button 
                        variant={isActivate ? "default" : "secondary"} 
                        onClick={onConfirm} 
                        disabled={isUpdating} 
                        className="gap-2"
                    >
                        {isUpdating && <Loader size={16} className="animate-spin" />}
                        {isActivate ? t("Conducteur.activate") : t("Conducteur.deactivate")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}