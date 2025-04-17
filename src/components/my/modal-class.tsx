import React from 'react'

const ModalClass = () => {
  return (
    <div className='hidden'>
        <div className='w-[70%] max-w-[70%] h-[80%] lg:grid-cols-2 overflow-auto px-1'></div>
        <div className='h-[50%] lg:h-[70%] flex flex-col'></div>
        <div className='h-0 lg:h-10'></div>
        <div className='space-y-4 overflow-auto h-fit px-1'></div>
    </div>
  )
}

export default ModalClass
