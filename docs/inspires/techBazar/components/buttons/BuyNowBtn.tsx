'use client'
import React from 'react'
import { Button } from '../ui/button'
import { ArrowRight } from 'lucide-react'
import { CartItem } from '@/types'
import useCartStore from '@/store/cartStore'
import { useRouter } from 'next/navigation'

const BuyNowBtn = ({product}:{product:CartItem}) => {
  const {addToCart} = useCartStore()
  const router = useRouter()

  const handleBuyNow = () => {
    addToCart(product)
    router.push('/checkout')
  }

  
  return (
    <Button onClick={handleBuyNow} className='bg-gradient-to-r from-blue-500 to-blue-800 hover:bg-blue-500 hover:ring-2  duration-300 text-white text-xl p-8 rounded-full w-full flex items-center gap-4'>
      <ArrowRight size={30} className='animate-pulse'/>  Buy Now
    </Button>
  )
}

export default BuyNowBtn