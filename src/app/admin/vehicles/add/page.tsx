import { Card } from '@/components/ui/card'
import React from 'react'
import AddUpdateVehicle from '../_component/AddUpdateVehicle'

const page = () => {
    return (
        <Card className='p-4 w-full'>
            <AddUpdateVehicle vehicle={null} />
        </Card>
    )
}

export default page