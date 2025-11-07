
import { accessPage, verifySession } from '@/actions/permissions'
import { Card } from '@/components/ui/card'
import React from 'react'
import CompaniesPage from './_componenets/my-page';

const Page = async () => {

    const session = await verifySession()

    if (!session || session.status !== 200 || !session.data.user || !session.data.user.id) {
        return null;
    }
    await accessPage(['entreprise_view'], session.data.user.id);

    return (
        <Card className='p-4 w-full'>
            <div className='flex flex-col gap-2'>
                <CompaniesPage />
            </div>
        </Card>
    )
}

export default Page
