import { accessPage } from '@/actions/permissions'
import { Card } from '@/components/ui/card'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import React from 'react'
import ListNotifications from './_components/list-notifications'

const Page = async () => {

    const translate = await getTranslations("Notification")

    await accessPage(['notification_view']);

    return (
        <Card className='p-4 flex flex-col gap-4'>
            <h1 className='text-xl font-bold'>{translate("title")}</h1>
            <div className='h-full flex flex-col gap-1 overflow-auto border rounded-xl p-4'>
                <ListNotifications />
            </div>
        </Card >
    )
}

export default Page
