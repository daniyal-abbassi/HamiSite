import { Loader2 } from 'lucide-react'
import React from 'react'

const Loader = () => {
  return (
    <div className='h-full w-full flex items-center justify-center gap-4 flex-col'>
        <Loader2 size={30} className='animate-spin' />
        <p>Loading...</p>
    </div>
  )
}

export default Loader