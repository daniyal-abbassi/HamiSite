'use client'
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define the schema for form validation
const formSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  image: z.string().url({ message: "Invalid URL format" }),
  description: z.string().min(1, "Description is required"),
});

// Define TypeScript types for form data
type FormData = z.infer<typeof formSchema>;

const CategoryForm: React.FC = () => {
  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // Form submission handler
  const onSubmit = (data: FormData) => {
    console.log("Category submitted:", data);
  };

  return (
    <div className="max-w-screen-xl w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-4">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Add Category
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-white"
          >
            Category Name
          </Label>
          <Input
            type="text"
            id="name"
            {...register("name")}
            className={`mt-1 p-2 w-full rounded-md border ${
              errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.name && (
            <span className="text-red-500 text-sm">{errors.name.message}</span>
          )}
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="image"
            className="block text-sm font-medium text-gray-700 dark:text-white"
          >
            Image Upload
          </Label>
          <Input
            type="file"
            id="image"
            {...register("image")}
            className={`mt-1 p-2 w-full rounded-md border ${
              errors.image ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.image && (
            <span className="text-red-500 text-sm">{errors.image.message}</span>
          )}
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-white"
          >
            Description
          </Label>
          <textarea
            id="description"
            {...register("description")}
            className={`mt-1 p-2 w-full bg-white dark:bg-slate-950 rounded-md  border ${
              errors.description ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } focus:ring-blue-500 focus:border-blue-500`}
          ></textarea>
          {errors.description && (
            <span className="text-red-500 text-sm">{errors.description.message}</span>
          )}
        </div>
        <Button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
        >
          Add Category
        </Button>
      </form>
    </div>
  );
};

export default CategoryForm;
