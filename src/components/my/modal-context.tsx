import { AddUpdateUserDialogProvider } from '@/context/add-update-dialog-context'
import { AddUpdateDeviceDialogProvider } from '@/context/add-update-dialog-context-device'
import { AddUpdateParkDialogProvider } from '@/context/add-update-dialog-context-park'
import { AddUpdateRegionDialogProvider } from '@/context/add-update-dialog-context-region'
import { AddUpdateVehicleDialogProvider } from '@/context/add-update-dialog-context-vehicle'
import { AddUpdateUserDialog } from '@/modals/add-update-dialog'
import { AddUpdateDeviceDialog } from '@/modals/add-update-dialog-device'
import { AddUpdateDialogPark } from '@/modals/add-update-dialog-park'
import { AddUpdateDialogRegion } from '@/modals/add-update-dialog-region'
import { AddUpdateDialogVehicle } from '@/modals/add-update-dialog-vehicle'
import React from 'react'

const ModalContext = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <AddUpdateUserDialogProvider>
                <AddUpdateParkDialogProvider>
                <AddUpdateRegionDialogProvider>
                    <AddUpdateVehicleDialogProvider>
                        <AddUpdateDeviceDialogProvider>
                            {children}
                            <AddUpdateUserDialog />
                            <AddUpdateDialogPark />
                            <AddUpdateDialogRegion />
                            <AddUpdateDialogVehicle />
                            <AddUpdateDeviceDialog />
                        </AddUpdateDeviceDialogProvider>
                    </AddUpdateVehicleDialogProvider>
                    </AddUpdateRegionDialogProvider>
                </AddUpdateParkDialogProvider>
            </AddUpdateUserDialogProvider>
        </>
    )
}

export default ModalContext
