
import { accessPage, withAuthorizationPermission, verifySession } from '@/actions/permissions'
import AddModalButton from '@/components/my/button/add-modal-button'
import { Card } from '@/components/ui/card'
import React from 'react'
import { useAddUpdateVehicleDialog } from '@/context/add-update-dialog-context-vehicle';
import ListVehicles from './_component/list-vehicles';

const Page = async () => {

  const session = await verifySession()

  if (!session || session.status !== 200 || !session.data.user || !session.data.user.id) {
    return null;
  }
  await accessPage(['vehicles_view'],session.data.user.id);
  const hasPermissionView = await withAuthorizationPermission(['vehicles_view'],session.data.user.id);
  const hasPermissionAdd = await withAuthorizationPermission(['vehicles_create'],session.data.user.id);

  return (
    <Card className='p-4 w-full'>
      <div className='flex flex-col gap-2'>
        {hasPermissionAdd.data.hasPermission && <AddModalButton translationName="Vehicle" translationButton="addvehicle" useModal={useAddUpdateVehicleDialog} />}
        {/* <ListUsers /> */}
        {hasPermissionView.data.hasPermission && <ListVehicles />}
      </div>
    </Card>
  )
}

export default Page
