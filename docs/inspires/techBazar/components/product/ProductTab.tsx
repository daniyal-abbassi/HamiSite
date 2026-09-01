import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Review } from "@/types";
import Image from "next/image";
import { Star } from "lucide-react";

interface ProductTabsProps {
  aboutItem: string[];
  reviews?: Review[];
}

const ProductTab = ({ aboutItem = [], reviews = [] }: ProductTabsProps) => {
  return (
    <div>
      <Tabs defaultValue="aboutitem" className="w-full p-4 -mt-2 ">
        <TabsList className="bg-transparent">
          <TabsTrigger value="aboutitem">About This Item</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="aboutitem">
          <div>
            <ol className="list-disc space-y-2">
              {aboutItem.map((about) => (
                <li key={about}>{about}</li>
              ))}
            </ol>
          </div>
        </TabsContent>
        <TabsContent value="reviews">
          {reviews?.length === 0 ? (
            <div>No Review Found For This Product</div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {reviews.map((review, index) => (
                <div
                  key={index}
                  className="p-2 rounded-md shadow-md space-y-2"
                >
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {review.content}
                    </p>
                    <div className="flex items-center gap-1">
                      ({review.rating})
                      {Array(review.rating)
                        .fill(null)
                        .map((_, i) => (
                          <Star key={i} size={15} className="text-yellow-400" />
                        ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image
                      src={review.image || ""}
                      alt="person"
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-12 h-12"
                    />
                    <div>
                      <p className="whitespace-nowrap">{review.author}</p>
                      <small>{review.date.toDateString()}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductTab;
