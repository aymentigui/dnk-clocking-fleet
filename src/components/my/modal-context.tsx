import { AddUpdateUserDialogProvider } from '@/context/add-update-dialog-context'
import { AddUpdateDeviceDialogProvider } from '@/context/add-update-dialog-context-device'
import { AddUpdateParkDialogProvider } from '@/context/add-update-dialog-context-park'
import { AddUpdateUserDialog } from '@/modals/add-update-dialog'
import { AddUpdateDeviceDialog } from '@/modals/add-update-dialog-device'
import { AddUpdateDialogPark } from '@/modals/add-update-dialog-park'
import React from 'react'

const ModalContext = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <AddUpdateUserDialogProvider>
                <AddUpdateParkDialogProvider>
                <AddUpdateDeviceDialogProvider>
                    {children}
                    <AddUpdateUserDialog />
                    <AddUpdateDialogPark />
                    <AddUpdateDeviceDialog />
                    </AddUpdateDeviceDialogProvider>
                </AddUpdateParkDialogProvider>
            </AddUpdateUserDialogProvider>
        </>
    )
}

export default ModalContext
