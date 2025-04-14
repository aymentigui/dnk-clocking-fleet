
import { accessPage, withAuthorizationPermission, verifySession } from '@/actions/permissions'
import AddModalButton from '@/components/my/button/add-modal-button'
import { Card } from '@/components/ui/card'
import React from 'react'
import { useAddUpdateDeviceDialog } from '@/context/add-update-dialog-context-device';
import ListDevices from './_component/list-devices';

const Page = async () => {

  const session = await verifySession()

  if (!session || session.status !== 200 || !session.data.user || !session.data.user.id) {
    return null;
  }
  await accessPage(['devices_view'],session.data.user.id);
  const hasPermissionView = await withAuthorizationPermission(['devices_view'],session.data.user.id);
  const hasPermissionAdd = await withAuthorizationPermission(['devices_create'],session.data.user.id);

  return (
    <Card className='p-4 w-full'>
      <div className='flex flex-col gap-2'>
        {hasPermissionAdd.data.hasPermission && <AddModalButton translationName="Device" translationButton="adddevice" useModal={useAddUpdateDeviceDialog} />}
        {/* <ListUsers /> */}
        {hasPermissionView.data.hasPermission && <ListDevices />}
      </div>
    </Card>
  )
}

export default Page
