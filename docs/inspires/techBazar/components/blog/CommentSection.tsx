"use client";
import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import Image from "next/image";

// Define Zod schema for comment form data
const commentSchema = z.object({
  name: z.string().min(3, "Name Is Required"),
  email: z.string().email("Email Not Valid"),
  message: z.string().min(3, "Messgage is Required"),
  image: z.string().optional(),
});

// Define types for comment data
type CommentData = z.infer<typeof commentSchema>;

const CommentSection: React.FC = () => {
  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CommentData>({
    resolver: zodResolver(commentSchema),
  });

  // State for storing comments
  const [comments, setComments] = useState<CommentData[]>([
    {
      name: "John Doe",
      email: "john@example.com",
      message: "Great post!",
      image: "/images/people/person.jpg",
    },
    {
      name: "Jane Smith",
      email: "jane@example.com",
      message: "Awesome content!",
      image: "/images/people/person.jpg",
    },
    {
      name: "Tom Williams",
      email: "tom@example.com",
      message: "Keep it up!",
      image: "/images/people/person.jpg",
    },
  ]);

  // Function to handle form submission
  const onSubmit: SubmitHandler<CommentData> = (data) => {
    // Handle form submission here (e.g., send data to backend)
    console.log(data);
    // Update comments state with new comment
    setComments([...comments, data]);
  };

  return (
    <div className="mt-8 max-w-screen-xl mx-auto p-4 lg:p-8 border-t-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className=" w-full p-4  bg-slate-100 dark:bg-slate-800 rounded-md "
        >
          <h3 className="text-2xl font-semibold mb-4">Add a Comment</h3>
          <div className="mb-4">
            <Label htmlFor="name" className="block ">
              Name
            </Label>
            <Input
              type="text"
              id="name"
              {...register("name")}
              className="mt-1 block w-full"
            />
            {errors.name && (
              <span className="text-red-500">{errors.name.message}</span>
            )}
          </div>
          <div className="mb-4">
            <Label htmlFor="email" className="block ">
              Email
            </Label>
            <Input
              type="email"
              id="email"
              {...register("email")}
              className="mt-1 block w-full"
            />
            {errors.email && (
              <span className="text-red-500">{errors.email.message}</span>
            )}
          </div>
          <div className="mb-4">
            <Label htmlFor="message" className="block ">
              Message
            </Label>
            <textarea
              id="message"
              {...register("message")}
              className=" mt-1 block w-full bg-white dark:bg-slate-950 rounded-md p-2"
            />
            {errors.message && (
              <span className="text-red-500">{errors.message.message}</span>
            )}
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Submit
          </button>
        </form>

        {/* Display comments */}
        <div className="p-4">
          <h3 className="text-2xl font-semibold mb-4">Comments</h3>
          <ul className="space-y-4">
            {comments.map((comment, index) => (
              <li key={index} className="p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Image
                    src={comment.image || ""}
                    alt="person image"
                    width={30}
                    height={30}
                    className="rounded-full object-cover w-[30px] h-[30px]"
                  />
                  <p className="font-semibold">{comment.name}</p>
                </div>
                <p className="text-lg">{comment.message}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
