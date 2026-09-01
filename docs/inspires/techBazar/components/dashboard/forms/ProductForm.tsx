"use client";
import React, { useState } from "react";
import { optional, z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define the schema for form validation
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.string().min(1, "Price is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  type: z.enum(["featured", "top-rated", "most-popular", "new-arrivals"]),
  description: z.string().min(1, "Description is required"),
  aboutItem: z.string().optional(),
  images: z.array(z.instanceof(File)).min(1, "At least one image is required"),
  color: z.array(z.string()).optional(),
  discount: z.number().min(0).max(100).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const ProductForm = () => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    price: "",
    category: "",
    brand: "",
    type: "featured",
    description: "",
    aboutItem: '',
    images: [],
    color: [],
    discount: undefined,
  });

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = (data: ProductFormData) => {
    console.log(data);
    // Add logic to handle form submission (e.g., API call to add product)
    setFormData({
      name: "",
      price: "",
      category: "",
      brand: "",
      type: "featured",
      description: "",
      aboutItem: '',
      images: [],
      color: [],
      discount: undefined,
    });
  };

  return (
    <div className="max-w-screen-xl mx-auto w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Add New Product
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-white"
          >
            Product Name
          </Label>
          <Input
            id="name"
            type="text"
            className="mt-1 p-2 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            {...register("name")}
          />
          {errors.name && (
            <span className="text-red-500">{errors.name.message}</span>
          )}
        </div>

        <div>
          <Label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 dark:text-white"
          >
            Price
          </Label>
          <Input
            id="price"
            type="text"
            className="mt-1 p-2 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            {...register("price")}
          />
          {errors.price && (
            <span className="text-red-500">{errors.price.message}</span>
          )}
        </div>

        <div>
          <Label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 dark:text-white"
          >
            discount
          </Label>
          <Input
            id="price"
            type="text"
            className="mt-1 p-2 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            {...register("discount")}
          />
          {errors.discount && (
            <span className="text-red-500">{errors.discount.message}</span>
          )}
        </div>

        <div>
          <Label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 dark:text-white"
          >
            Category
          </Label>
          <Input
            id="category"
            type="text"
            className="mt-1 p-2 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            {...register("category")}
          />
          {errors.category && (
            <span className="text-red-500">{errors.category.message}</span>
          )}
        </div>

        <div>
          <Label
            htmlFor="brand"
            className="block text-sm font-medium text-gray-700 dark:text-white"
          >
            Brand
          </Label>
          <Input
            id="brand"
            type="text"
            className="mt-1 p-2 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            {...register("brand")}
          />
          {errors.brand && (
            <span className="text-red-500">{errors.brand.message}</span>
          )}
        </div>

        <div>
          <Label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700 dark:text-white"
          >
            Product Type
          </Label>
          <select
            id="type"
            className="mt-1 p-2 block w-full dark:bg-slate-950 rounded-md border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            {...register("type")}
          >
            <option value="featured">Featured</option>
            <option value="top-rated">Top Rated</option>
            <option value="most-popular">Most Popular</option>
            <option value="new-arrivals">New Arrivals</option>
          </select>
          {errors.type && (
            <span className="text-red-500">{errors.type.message}</span>
          )}
        </div>

        <div>
          <Label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-white"
          >
            Description
          </Label>
          <textarea
            id="description"
            className="mt-1 p-2 block border bg-white dark:bg-slate-950 rounded-md w-full  border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            {...register("description")}
          />
          {errors.description && (
            <span className="text-red-500">{errors.description.message}</span>
          )}
        </div>


        <div>
          <Label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-white"
          >
            Available Colors
          </Label>
          <Input
            id="description"
            className="mt-1 p-2 block border dark:bg-slate-950 w-full rounded-md border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            {...register("color")}
          />
          {errors.color && (
            <span className="text-red-500">{errors.color.message}</span>
          )}
        </div>

        <div>
          <Label
            htmlFor="aboutItem"
            className="block text-sm font-medium text-gray-700 dark:text-white"
          >
            About Item
          </Label>
          <textarea
            id="aboutItem"
            className="mt-1 border p-2 block w-full rounded-md dark:bg-slate-950 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            {...register("aboutItem")}
          />
          {errors.aboutItem && (
            <span className="text-red-500">{errors.aboutItem.message}</span>
          )}
        </div>

        <div>
          <Label
            htmlFor="images"
            className="block text-sm font-medium text-gray-700 dark:text-white"
          >
            Product Images
          </Label>
          <p className="text-gray-500">
            You can upload multiple images for this product.
          </p>
          <Input
            id="images"
            type="file"
            multiple
            className="mt-1 p-2 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            {...register("images")}
          />
          {errors.images && (
            <span className="text-red-500">{errors.images.message}</span>
          )}
        </div>
        <div>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </div>
  );
};


export default ProductForm;