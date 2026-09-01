import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import Image from 'next/image'
import Link from 'next/link'
import { blogPosts } from '@/data/blog/blogData'

const RecentBlogs = () => {
  return (
      <aside className="col-span-2">
        <h2 className="text-3xl font-semibold capitalize mb-2">Recent Blogs</h2>
        <div className="space-y-4">
          {blogPosts.map((blog) => (
            <Link
              key={blog.title}
              href={`/blog/${blog.title}`}
              className="flex items-center gap-6 shadow-md bg-slate-50 dark:bg-slate-900 p-2 rounded-md"
            >
              <Image
                src={blog.image || ""}
                alt="blog iamge"
                width={70}
                height={70}
                className="rounded-md object-contain"
              />
              <div>
                <h3 className="text-lg font-semibold">{blog.title}</h3>
                <div className="text-sm font-normal flex items-center gap-2 mt-2 text-blue-500">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>Pic</AvatarFallback>
                  </Avatar>{" "}
                  {blog.author}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </aside>
  )
}

export default RecentBlogs