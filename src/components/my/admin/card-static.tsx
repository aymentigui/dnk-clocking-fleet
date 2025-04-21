import Loading from '@/components/myui/loading'
import React from 'react'

const CardStatic = ({ Icon, title, data, isLoading }: any) => {
    return (
        <div className='p-4 flex border rounded-lg flex-row justify-start items-center w-64 gap-5'>
            {
                isLoading ?
                    <div className='w-full flex justify-center items-center'>
                        <Loading></Loading >
                    </div >
                    :
                    <>
                        <Icon className='w-10 h-10' />
                        <div>
                            <h1 className="text-xl font-bold">{title}</h1>
                            <h3 className="mb-4">{data}</h3>
                        </div>
                    </>
            }
        </div>
    )
}

export default CardStatic
