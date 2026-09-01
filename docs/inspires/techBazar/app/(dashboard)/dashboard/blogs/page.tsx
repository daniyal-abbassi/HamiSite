import BlogActions from "@/components/dashboard/blog/BlogActions";
import SearchBlogs from "@/components/dashboard/blog/SearchBlogs";
import Loader from "@/components/others/Loader";
import Pagination from "@/components/others/Pagination";
import { blogPosts } from "@/data/blog/blogData";
import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";

const BlogsPage = () => {
  return (
    <div className="max-w-screen-xl w-full my-4 mx-auto p-4">
      <div className="flex justify-between mb-6 gap-2">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Blogs
        </h2>
        <div className="flex items-center gap-4">
          <SearchBlogs />
          <Link
            href={"/dashboard/blogs/add-blog"}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg whitespace-nowrap"
          >
            Create Blog
          </Link>
        </div>
      </div>
      <div className="">
        {/* Render list of blogs */}
        {blogPosts.map((blog) => (
          <div
            key={blog.title}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 flex flex-col md:flex-row gap-2"
          >
            <Image
              src={blog.image}
              alt={blog.title}
              width={96}
              height={96}
              className="w-24 h-24 object-cover rounded-md mr-4"
            />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {blog.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-semibold">Author:</span> {blog.author} |{" "}
                <span className="font-semibold">Date:</span>{" "}
                {blog.date.toDateString()}
              </p>
              <p>{blog.excerpt.slice(0, 100)}</p>
            </div>
            <div className="ml-auto">
              <BlogActions />
            </div>
          </div>
        ))}
      </div>
      <Suspense fallback={<Loader />}>
        <Pagination currentPage={1} totalPages={5} pageName="blogpage" />
      </Suspense>
    </div>
  );
};

export default BlogsPage;
