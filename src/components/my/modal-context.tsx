import { AddUpdateUserDialogProvider } from '@/context/add-update-dialog-context'
import { AddUpdateRegionDialogProvider } from '@/context/add-update-dialog-context-region'
import { AddUpdateVehicleDialogProvider } from '@/context/add-update-dialog-context-vehicle'
import { AddUpdateUserDialog } from '@/modals/add-update-dialog'
import { AddUpdateDialogRegion } from '@/modals/add-update-dialog-region'
import { AddUpdateDialogVehicle } from '@/modals/add-update-dialog-vehicle'
import React from 'react'

const ModalContext = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <AddUpdateUserDialogProvider>
                <AddUpdateRegionDialogProvider>
                    <AddUpdateVehicleDialogProvider>
                        {children}
                        <AddUpdateUserDialog />
                        <AddUpdateDialogRegion />
                        <AddUpdateDialogVehicle />
                    </AddUpdateVehicleDialogProvider>
                </AddUpdateRegionDialogProvider>
            </AddUpdateUserDialogProvider>
        </>
    )
}

export default ModalContext
