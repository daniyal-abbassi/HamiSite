import { Input } from '@/components/ui/input'
import React from 'react'

const SearchBlogs = () => {
  return (
    <div>
        <Input placeholder='Search blog by title' className='p-5 rounded-md w-full lg:w-96'/>
    </div>
  )
}

export default SearchBlogs