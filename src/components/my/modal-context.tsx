import { AddUpdateUserDialogProvider } from '@/context/add-update-dialog-context'
import { AddUpdateVehicleDialogProvider } from '@/context/add-update-dialog-context-vehicle'
import { AddUpdateUserDialog } from '@/modals/add-update-dialog'
import { AddUpdateDialogVehicle } from '@/modals/add-update-dialog-vehicle'
import React from 'react'

const ModalContext = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <AddUpdateUserDialogProvider>
                <AddUpdateVehicleDialogProvider>
                    {children}
                    <AddUpdateUserDialog />
                    <AddUpdateDialogVehicle />
                </AddUpdateVehicleDialogProvider>
            </AddUpdateUserDialogProvider>
        </>
    )
}

export default ModalContext
