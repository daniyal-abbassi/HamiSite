
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { colors } from "@/data/products/productColor";
import { cn } from "@/lib/utils";

interface ProductColorSelectionProps {
  color: string;
  setColor: (value: string) => void;
  allColors: string[]
}

const ProductColorSelection = ({
  color: selectedColor,
  setColor,
  allColors
}: ProductColorSelectionProps) => {
  return (
    <div>
      <p className="text-lg  mb-1">Colors</p>
      <div className="space-x-2">
        <TooltipProvider delayDuration={0}>
          {allColors?.map((color) => (
            <Tooltip key={color}>
              <TooltipTrigger>
                <span
                  onClick={() => setColor(color as string)}
                  className={cn(
                    "block w-8 h-8 rounded-full border border-spacing-4 opacity-80",
                    selectedColor === color ? "ring-2" : "ring-0"
                  )}
                  style={{ backgroundColor: color }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{color}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ProductColorSelection;
