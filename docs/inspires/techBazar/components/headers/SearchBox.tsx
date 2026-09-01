"use client";
import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SearchBox = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);

    if (params.get("query")) {
      params.delete("query");
      params.set("query", searchTerm);
    } else {
      params.set("query", searchTerm);
    }

    router.push(`/search?${params}`);
    setSearchTerm('')
  };


  useEffect(() => {
    if(pathname !== '/search'){
      setSearchTerm('')
    }
  },[pathname])

  return (
    <form
      onSubmit={onFormSubmit}
      className="flex items-start border-2 w-full rounded-lg"
    >
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="p-2 rounded-md w-full lg:w-64 border-none outline-none focus:outline-none focus-visible:ring-offset-0 focus-visible:ring-0"
        placeholder="Search.."
      />
      <Button
        type="submit"
        className="hover:opacity-30 duration-200"
        variant={"link"}
      >
        <Search size={25} />
      </Button>
    </form>
  );
};

export default SearchBox;
