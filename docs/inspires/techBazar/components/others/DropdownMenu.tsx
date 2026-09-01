import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

const DropdownMenuComponent = () => {
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 font-medium px-4 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">
          Pages <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-6 space-y-2">
          <DropdownMenuItem>
            <Link href={"/homepagetwo"}>Home Page Two</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href={"/shoppagetwo"}>Shop Page Two</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href={"/blogpageone"}>Blog Page One</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href={"/blogpagetwo"}>Blog Page Two</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href={"/dashboard"}>Dashboard Page</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href={"/sign-up"}>Sign Up Page</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href={"/sign-in"}>Sign In Page</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href={"/forgot-password"}>Forgot Password Page</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DropdownMenuComponent;
