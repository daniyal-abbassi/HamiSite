import { blogPosts } from "@/data/blog/blogData";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import RecentBlogs from "../../blog/RecentBlogs";

const BlogPageOne = () => {
  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-8 grid gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-5 ">
      <div className="col-span-3 space-y-4">
        {blogPosts.map((blog) => (
          <div
            key={blog.title}
            className="block space-y-2 rounded-md shadow p-4 dark:bg-gray-900 text-left"
          >
            <div className="relative w-full h-[20rem]">
              <Image
                className="rounded-md object-contain"
                src={blog.image || ""}
                alt="blog image"
                fill
              />
            </div>
            <div>
              <p className="bg-lime-500 w-fit px-4 text-sm rounded-full">
                {blog.category}
              </p>
              <h2 className="text-2xl md:text-4xl font-bold capitalize">
                {blog.title}
              </h2>
              <div className="text-sm md:text-lg font-medium flex items-center gap-2 text-blue-500">
                <span className="hidden md:block">Written By</span>
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>Pic</AvatarFallback>
                </Avatar>{" "}
                {blog.author}
              </div>
            </div>
            <p>{blog.excerpt}</p>
            <Link href={`/blog/${blog.title}`} className="text-gray-900 dark:text-gray-100 underline text-muted-foreground my-2">Read More</Link>
          </div>
        ))}
      </div>
      <RecentBlogs />
    </div>
  );
};

export default BlogPageOne;
