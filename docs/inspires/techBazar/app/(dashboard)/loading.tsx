'use client';
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const DashboardLoading = () => {
  return (
    <div className="w-full min-h-screen space-y-4 m-2 gap-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="w-full h-[5rem]" />
        <Skeleton className="w-full h-[5rem]" />
        <Skeleton className="w-full h-[5rem]" />
        <Skeleton className="w-full h-[5rem]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="w-full h-[30rem]" />
        <Skeleton className="w-full h-[30rem]" />
      </div>
    </div>
  );
};

export default DashboardLoading;
