import ShopPageTwo from '@/components/pages/shop-pages/ShopPageTwo'
import { SearchParams } from '@/types'
import React from 'react'

const ShoppageTwoWrapper = ({searchParams}:{searchParams:SearchParams}) => {
  return (
    <div>
        <ShopPageTwo searchParams={searchParams}/>
    </div>
  )
}

export default ShoppageTwoWrapper