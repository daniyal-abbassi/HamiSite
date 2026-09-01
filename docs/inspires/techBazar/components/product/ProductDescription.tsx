"use client";
import React, { useState } from "react";

const ProductDescription = ({ description }: { description: string }) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div>
      <p>
        {showMore ? description : description?.slice(0, 200)}{" "}
        {description?.length > 200 && !showMore && "..."}{" "}
        {description?.length > 200 && (
          <span
            className="text-sky-500 m-2 cursor-pointer hover:underline"
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? "show less" : "show more"}
          </span>
        )}
      </p>
    </div>
  );
};

export default ProductDescription;
