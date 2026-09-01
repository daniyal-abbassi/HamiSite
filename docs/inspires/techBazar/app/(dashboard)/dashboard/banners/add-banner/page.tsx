import BannerForm from '@/components/dashboard/forms/BannerForm'
import BreadcrumbComponent from '@/components/others/Breadcrumb'
import React from 'react'

const AddBannerPage = () => {
  return (
    <div className='p-2 w-full'>
      <BreadcrumbComponent links={['/dashboard','/banners']} pageText='add banner'/>
      <BannerForm />
    </div>
  )
}

export default AddBannerPage