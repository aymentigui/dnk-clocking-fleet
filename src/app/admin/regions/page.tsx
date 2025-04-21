
import { accessPage, withAuthorizationPermission, verifySession } from '@/actions/permissions'
import AddModalButton from '@/components/my/button/add-modal-button'
import { Card } from '@/components/ui/card'
import React from 'react'
import ListRegions from './_component/list-regions';
import { useAddUpdateRegionDialog } from '@/context/add-update-dialog-context-region';

const Page = async () => {

  const session = await verifySession()

  if (!session || session.status !== 200 || !session.data.user || !session.data.user.id) {
    return null;
  }
  await accessPage(['region_view'],session.data.user.id);
  const hasPermissionView = await withAuthorizationPermission(['region_view'],session.data.user.id);
  const hasPermissionAdd = await withAuthorizationPermission(['region_create'],session.data.user.id);

  return (
    <Card className='p-4 w-full'>
      <div className='flex flex-col gap-2'>
        {hasPermissionAdd.data.hasPermission && <AddModalButton translationName="Region" translationButton="addregion" useModal={useAddUpdateRegionDialog} />}
        {/* <ListUsers /> */}
        {hasPermissionView.data.hasPermission && <ListRegions />}
      </div>
    </Card>
  )
}

export default Page
