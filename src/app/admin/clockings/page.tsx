import { accessPage, verifySession } from '@/actions/permissions'
import React from 'react'
import ClockingsPage from './_component/list-clockings';

const Page = async () => {

  const session = await verifySession()

  if (!session || session.status !== 200 || !session.data.user || !session.data.user.id) {
    return null;
  }
  await accessPage(['clocking_view'],session.data.user.id);

  return (
    <ClockingsPage />
  )
}

export default Page
