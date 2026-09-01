import DashboardHeader from "@/components/dashboard/header/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/sidebar/DashboardSidebar";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <DashboardHeader />
      <div className="max-w-screen-xl mx-auto  flex flex-col md:flex-row gap-2  md:px-8">
        <DashboardSidebar />
        {children}
      </div>
    </div>
  );
};

export default layout;
