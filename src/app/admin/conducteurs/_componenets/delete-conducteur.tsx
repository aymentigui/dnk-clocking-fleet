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

interface DeleteConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => Promise<void>
    isDeleting: boolean
    count: number
}

export default function DeleteConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    isDeleting,
    count,
}: DeleteConfirmDialogProps) {
    const t = useTranslations()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-destructive" size={24} />
                        <DialogTitle>{t("Conducteur.delete_title")}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {count === 1 ? t("Conducteur.delete_one_desc") : t("Conducteur.delete_many_desc", { count })}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
                        {t("System.cancel")}
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="gap-2">
                        {isDeleting && <Loader size={16} className="animate-spin" />}
                        {t("System.delete")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
