// page.tsx
import { verifySession, accessPage, withAuthorizationPermission } from '@/actions/permissions'
import { Card } from '@/components/ui/card'
import RegionsPage from './_component/region-management'

const Page = async () => {
  const session = await verifySession()
  if (!session || session.status !== 200 || !session.data.user?.id) return null;

  await accessPage(['region_view'], session.data.user.id);

  return (
    <Card className='p-4 w-full'>
      <RegionsPage />
    </Card>
  )
}

export default Page