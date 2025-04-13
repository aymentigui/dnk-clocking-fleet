
import { accessPage, withAuthorizationPermission, verifySession } from '@/actions/permissions'
import AddModalButton from '@/components/my/button/add-modal-button'
import { Card } from '@/components/ui/card'
import React from 'react'
import ListParks from './_component/list-parks';
import { useAddUpdateParkDialog } from '@/context/add-update-dialog-context-park';

const Page = async () => {

  const session = await verifySession()

  if (!session || session.status !== 200 || !session.data.user || !session.data.user.id) {
    return null;
  }
  await accessPage(['park_view'],session.data.user.id);
  const hasPermissionView = await withAuthorizationPermission(['park_view'],session.data.user.id);
  const hasPermissionAdd = await withAuthorizationPermission(['park_create'],session.data.user.id);

  return (
    <Card className='p-4 w-full'>
      <div className='flex flex-col gap-2'>
        {hasPermissionAdd.data.hasPermission && <AddModalButton translationName="Park" translationButton="addpark" useModal={useAddUpdateParkDialog} />}
        {/* <ListUsers /> */}
        {hasPermissionView.data.hasPermission && <ListParks />}
      </div>
    </Card>
  )
}

export default Page
