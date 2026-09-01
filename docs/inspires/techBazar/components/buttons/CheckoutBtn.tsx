import React from "react";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const CheckoutBtn = () => {
  return (
    <Link
      href={"/checkout"}
      className="w-full flex items-center justify-center gap-3 my-2 text-xl bg-blue-500 dark:bg-blue-600 text-white py-3 px-8 rounded-full hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none"
    >
      {" "}
      <ArrowRight /> Checkout Now
    </Link>
  );
};

export default CheckoutBtn;
