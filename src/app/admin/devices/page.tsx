
import { accessPage, verifySession } from '@/actions/permissions'
import React from 'react'
import DevicesPage from './_component/my-page';

const Page = async () => {

  const session = await verifySession()

  if (!session || session.status !== 200 || !session.data.user || !session.data.user.id) {
    return null;
  }
  await accessPage(['devices_view'],session.data.user.id);

  return (
    <DevicesPage />
  )
}

export default Page
