'use client';
import { Loader2 } from 'lucide-react'
import React from 'react'

const AuthLoading = () => {
  return (
    <div className='flex flex-col gap-2 w-full h-screen'>
        <Loader2 size={50} className='animate-spin'/>
        <p>Loading Form...</p>
    </div>
  )
}

export default AuthLoading