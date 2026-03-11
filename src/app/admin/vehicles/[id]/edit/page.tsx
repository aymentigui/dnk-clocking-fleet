import { Card } from '@/components/ui/card'
import React from 'react'
import AddUpdateVehicle from '../../_component/AddUpdateVehicle'
import { getVehicle } from '@/actions/vehicle/get'

const page = async ({ params }: any) => {
    const paramsId = await params

    const result = await getVehicle(paramsId.id)
    const vehicle = result.status === 200 ? result.data : null

    if (!vehicle) {
        return (
            <Card className='p-4 w-full'>
                <p>Vehicle not found</p>
            </Card>
        )
    }

    return (
        <Card className='p-4 w-full'>
            <AddUpdateVehicle vehicle={vehicle} />
        </Card>
    )
}

export default page