import { accessPage, withAuthorizationPermission, verifySession } from '@/actions/permissions';
import ListRoles from '@/app/admin/roles/_component/list-roles'
import { Card } from '@/components/ui/card';
import React from 'react'
import AddRouteButton from '@/components/my/button/add-route-button';

const AddBlog = async () => {

  const session = await verifySession()

  if (session.status !== 200 || !session || !session.data.user || !session.data.user.id) {
    return null;
  }
  await accessPage(['blogs_view'], session.data.user.id);
  const hasPermissionView = await withAuthorizationPermission(['blogs_view'], session.data.user.id);
  const hasPermissionAdd = await withAuthorizationPermission(['blogs_create'], session.data.user.id);

  return (
    <Card className='p-4'>
      <div className='flex flex-col gap-2'>
        {hasPermissionAdd.data.hasPermission && <AddRouteButton translationName="Blogs" translationButton="addblog" route="/admin/blogs/blog" />}
      </div>
    </Card>
  )
}

export default AddBlog
