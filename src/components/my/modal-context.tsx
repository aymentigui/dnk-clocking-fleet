import { AddUpdateUserDialogProvider } from '@/context/add-update-dialog-context'
import { AddUpdateParkDialogProvider } from '@/context/add-update-dialog-context-park'
import { AddUpdateUserDialog } from '@/modals/add-update-dialog'
import { AddUpdateDialogPark } from '@/modals/add-update-dialog-park'
import React from 'react'

const ModalContext = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <AddUpdateUserDialogProvider>
                <AddUpdateParkDialogProvider>
                    {children}
                    <AddUpdateUserDialog />
                    <AddUpdateDialogPark />
                </AddUpdateParkDialogProvider>
            </AddUpdateUserDialogProvider>
        </>
    )
}

export default ModalContext
