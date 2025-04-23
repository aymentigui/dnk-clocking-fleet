"use client"
import React, { useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { UpdateVehiclesRegion } from '@/actions/vehicle/update';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';


interface ConfirmDialogProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedIds: string[];
    parcs: { id: string; name: string }[];
}

const UpdateRegion = ({ open, setOpen, selectedIds, parcs }: ConfirmDialogProps) => {
    const translateSystem = useTranslations("System")
    const translate = useTranslations("Vehicle")
    const [parc, setParc] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState<string>('')

    // Filtrer les options en fonction du texte de recherche
    const locale = useLocale()

    const filteredOptions = parcs.filter(option =>
        option.name.toLowerCase().includes(searchQuery.toLowerCase())
    )



    const hadnleConfirmUpdate = async () => {
        if (selectedIds.length === 0) {
            toast.error(translate("selectvehicles"))
            return
        }
        setOpen(!open)
    }

    const handleUpdate = async () => {
        if (selectedIds.length === 0) return
        const res = await UpdateVehiclesRegion(selectedIds, parc)
        if (res.status === 200 && res.data.message) {
            toast.success(translateSystem("updatesuccess"))
            setOpen(false)
            window.location.reload()
        } else {
            toast.error(translateSystem("updatefail"))
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={hadnleConfirmUpdate}>
            <AlertDialogTrigger asChild>
                <Button variant="primary">{translate("updateregion")}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent >
                <AlertDialogHeader>
                    <AlertDialogTitle className={cn(locale == "ar" ? "text-right" : "text-left")}>{translate("updateregion")}</AlertDialogTitle>
                    <div className='flex flex-col'>
                        <Select value={parc} onValueChange={(value) => setParc(value)}>
                            <SelectGroup>
                                <SelectLabel>{translate("selectregion")}</SelectLabel>
                            </SelectGroup>
                            <SelectTrigger>
                                <SelectValue placeholder={translate("selectregion")} />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Ajout d'un champ de recherche */}
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-md mb-2"
                                    placeholder={translateSystem("search")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {/* Affichage des options filtrées */}
                                {filteredOptions.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                                <SelectItem value="null">----</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className='mx-2' onClick={() => setOpen(false)}>{translateSystem("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUpdate}>{translateSystem("confirm")}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default UpdateRegion
