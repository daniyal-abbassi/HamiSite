'use client'
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Define the schema for form validation
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  buttonText: z.string().min(1, "Button text is required"),
  buttonLink: z.string().url({ message: "Invalid URL format" }),
  image:z.instanceof(File)
});

// Define TypeScript types for form data
type FormData = z.infer<typeof formSchema>;

const BannerForm: React.FC = () => {
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
    console.log("Banner submitted:", data);
  };

  return (
    <div className="max-w-screen-xl w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-4">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Add Banner
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-white">
            Title
          </Label>
          <Input
            type="text"
            id="title"
            {...register("title")}
            className={`mt-1 p-2 w-full rounded-md border ${
              errors.title ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-white">
            Description
          </Label>
          <Input
            type="text"
            id="description"
            {...register("description")}
            className={`mt-1 p-2 w-full rounded-md border ${
              errors.description ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.description && <span className="text-red-500 text-sm">{errors.description.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="buttonText" className="block text-sm font-medium text-gray-700 dark:text-white">
            Button Text
          </Label>
          <Input
            type="text"
            id="buttonText"
            {...register("buttonText")}
            className={`mt-1 p-2 w-full rounded-md border ${
              errors.buttonText ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.buttonText && <span className="text-red-500 text-sm">{errors.buttonText.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="buttonLink" className="block text-sm font-medium text-gray-700 dark:text-white">
            Button Link
          </Label>
          <Input
            type="text"
            id="buttonLink"
            {...register("buttonLink")}
            className={`mt-1 p-2 w-full rounded-md border ${
              errors.buttonLink ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.buttonLink && <span className="text-red-500 text-sm">{errors.buttonLink.message}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-white">
            Upload Image
          </Label>
          <Input
            type="file"
            id="image"
            {...register("image")}
            className={`mt-1 p-2 w-full rounded-md border ${
              errors.image ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.image && <span className="text-red-500 text-sm">{errors.image.message}</span>}
        </div>
       <div>
       <Button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg  w-fit"
        >
          Add Banner
        </Button>
       </div>
      </form>
    </div>
  );
};

export default BannerForm;
