
"use client"
import { Card } from '@/components/ui/card'
import React, { useEffect } from 'react'
import ListVehicles from './_component/list-vehicles';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/use-session';

const Page = () => {

  const translate = useTranslations("Vehicle")
  const { session } = useSession()


  const hasPermissionAdd = session?.user?.permissions?.includes("vehicles_create") || session?.user?.is_admin

  return (
    <Card className='p-4 w-full'>
      <div className='flex flex-col gap-2'>
        {hasPermissionAdd && (
          <Link href="/admin/vehicles/add">
            <Button>
              {translate("addvehicle")}
            </Button>
          </Link>
        )}
        <ListVehicles />
      </div>
    </Card>
  )
}

export default Page
