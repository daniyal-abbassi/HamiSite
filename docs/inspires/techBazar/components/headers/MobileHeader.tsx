"use client";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Heart,
  HelpCircle,
  Home,
  ListOrdered,
  LogOut,
  Menu,
  Store,
  Text,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { ThemeToggle } from "../theme/ThemeToggle";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const MobileHeader = () => {
  const pathname = usePathname();

  const userLinks = [
    {
      link: "/my-account",
      label: "My Account",
      icon: <User />,
      isActive: pathname.includes("/my-account"),
    },
    {
      link: "/wishlist",
      label: "Wishlist",
      icon: <Heart />,
      isActive: pathname.includes("/wishlist"),
    },
    {
      link: "/my-orders",
      label: "My Orders",
      icon: <ListOrdered />,
      isActive: pathname.includes("/my-orders"),
    },
    {
      link: "/help",
      label: "Help",
      icon: <HelpCircle />,
      isActive: pathname.includes("/help"),
    },
  ];

  const navlinks = [
    {
      link: "/",
      label: "Home",
      icon: <Home />,
      isActive: pathname === "/",
    },
    {
      link: "/shop",
      label: "Shop",
      icon: <Store />,
      isActive: pathname.includes("/shop"),
    },
    {
      link: "/blog",
      label: "Blogs",
      icon: <Text />,
      isActive: pathname.includes("/blog"),
    },
  ];

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger>
          <Menu className="mt-2" size={25} />
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetDescription>
              <ul className="space-y-1 text-start text-lg p-2">
                {/* navigation links here */}
                {navlinks.map((link) => (
                  <Link
                    key={link.link}
                    href={link.link}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800",
                      link.isActive && "bg-gray-200  dark:bg-gray-800"
                    )}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
                <Separator className="!my-2" />
                {/* theme toggle option here */}
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <p>Change Theme</p>
                </div>
                <Separator className="!my-2" />

                {/* user retated options here */}
                {userLinks.map((link) => (
                  <Link
                    key={link.link}
                    href={link.link}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800",
                      link.isActive && "bg-gray-200  dark:bg-gray-800"
                    )}
                  >
                    {link.icon} {link.label}
                  </Link>
                ))}
                <Separator className="!my-2" />
                <button className="flex items-start justify-start gap-2 p-2 bg-transparent hover:opacity-50">
                  <LogOut />
                  Logout
                </button>
              </ul>
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileHeader;
