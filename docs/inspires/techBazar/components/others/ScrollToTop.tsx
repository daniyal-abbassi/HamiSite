"use client";
import { ArrowUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";

const ScrollToTop = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    window.addEventListener("scroll", (e) => {
      e.preventDefault();
      if (window.scrollY >= 500) {
        setShow(true);
      } else {
        setShow(false);
      }
    });
  }, []);

  const handleClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <div className="fixed bottom-3 right-3">
      {show && (
        <Button onClick={handleClick} className="p-4 rounded-full w-16 h-16">
          <ArrowUp size={40} className="animate-bounce mt-4" />
        </Button>
      )}
    </div>
  );
};

export default ScrollToTop;
