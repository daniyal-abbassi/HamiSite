import CheckoutForm from '@/components/forms/CheckoutForm'
import { Separator } from '@/components/ui/separator'
import React from 'react'

const EditAddress = () => {
  return (
    <div className='p-8 w-full md:w-2/4 bg-slate-100 dark:bg-slate-800 mx-auto m-2 rounded-md'>
        <h2 className='text-xl font-semibold mb-2'>Update Your Address</h2>
        <Separator className='bg-gray-500 mb-2'/>
        <CheckoutForm />
    </div>
  )
}

export default EditAddress