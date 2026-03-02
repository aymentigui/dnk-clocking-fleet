import { getTranslations } from 'next-intl/server'
import {
  HydrationBoundary,
  QueryClient,
  dehydrate
} from '@tanstack/react-query'
import { getParksAdmin } from '@/actions/park/get'
import { VehiculesTabs } from './_components/VehiculesTabs'
import { QueryProvider } from '@/providers/query-provider'
import { Card } from '@/components/ui/card'

export default async function VehiculesPage() {
  const t = await getTranslations('GlobalEtat')
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['parks-admin'],
    queryFn: async () => {
      const result = await getParksAdmin()
      return result.status === 200 ? result.data : []
    }
  })

  return (
    <Card className='p-4'>
      <div className='container mx-auto py-10'>
        <QueryProvider>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <VehiculesTabs />
          </HydrationBoundary>
        </QueryProvider>
      </div>
    </Card>
  )
}
