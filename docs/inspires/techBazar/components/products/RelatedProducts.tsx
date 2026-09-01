import React from 'react'
import SingleProductCartView from '../product/SingleProductCartView';
import { Product } from '@/types';


interface RelatedProductsProps {
    products: Product[]
}

const RelatedProducts = ({products}:RelatedProductsProps) => {
  return (
    <section className='max-w-screen-xl mx-auto p-4 md:p-8'>
        <h2 className='text-2xl md:text-3xl font-bold capitalize my-6'>Related Products For You</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {products?.map(product => (
            <SingleProductCartView key={product.id} product={product}/>
        ))}
        </div>
    </section>
  )
}

export default RelatedProducts