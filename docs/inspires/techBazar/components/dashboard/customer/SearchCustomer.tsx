import { Input } from '@/components/ui/input'
import React from 'react'

const SearchCustomer = () => {
  return (
    <div>
        <Input placeholder='Search customer by name or email' className='rounded-md p-5 w-full lg:w-96'/>
    </div>
  )
}

export default SearchCustomer