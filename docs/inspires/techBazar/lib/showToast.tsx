import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { toast } from "sonner";

export function showToast(title:string,image:string,text:string){
    toast(
        <div className="text-center w-full">
          <h2 className="text font-bold my-2">{title}</h2>
          <Separator />
          <div className="flex items-center justify-center gap-4">
            <Image src={image} alt="product" width={50} height={50} />
            <p>{text}</p>
          </div>
        </div>
      );
}