'use client'
import Link from "next/link";
import React from "react";
import {
  Home,
  ClipboardList,
  Box,
  Layers,
  Book,
  Users,
  Images,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const DashboardSidebar = () => {

  const pathname = usePathname();

  const dashboardLinks = [
    {
      link: "/dashboard",
      label: "Home",
      icon: <Home size={20} />,
      isActive: pathname === "/dashboard",
    },
    {
      link: "/dashboard/orders",
      label: "Orders",
      icon: <ClipboardList size={20} />,
      isActive: pathname.includes("dashboard/orders"),
    },
    {
      link: "/dashboard/products",
      label: "Products",
      icon: <Box size={20} />,
      isActive: pathname.includes("dashboard/products"),
    },
    {
      link: "/dashboard/categories",
      label: "Categories",
      icon: <Layers size={20} />,
      isActive: pathname.includes("dashboard/categories"),
    },
    {
      link: "/dashboard/banners",
      label: "Banners",
      icon: <Images size={20} />,
      isActive: pathname.includes("dashboard/banners"),
    },
    {
      link: "/dashboard/blogs",
      label: "Blogs",
      icon: <Book size={20} />,
      isActive: pathname.includes("dashboard/blogs"),
    },
    {
      link: "/dashboard/customers",
      label: "Customers",
      icon: <Users size={20} />,
      isActive: pathname.includes("dashboard/customers"),
    },
  ];

  return (
    <nav className="w-64 min-h-[88vh] px-2 py-4 border-r-2 hidden lg:block">
      {/* Sidebar Links */}
      <div>
        <ul className="flex flex-col gap-2 items-start justify-center">
          {dashboardLinks.map((link) => (
            <li key={link.label} className="w-full">
              <Link
                href={link.link}
                className={cn("flex items-center text-lg w-full gap-2  p-2 rounded-md transition-colors duration-300 hover:bg-gray-200 dark:hover:bg-gray-800", link.isActive && 'bg-slate-300  dark:bg-slate-700')}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default DashboardSidebar;
