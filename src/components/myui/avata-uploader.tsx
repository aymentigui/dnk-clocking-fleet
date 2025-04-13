import { useEffect, useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import GetImage from "@/hooks/use-getImage";
import { LzyImage } from "./pdf/lazy-image";
import { getImageFromLocalHost } from "@/actions/localstorage/util-client";

interface AvatarUploaderProps {
  name: string;
  image?: string | null;
}

export default function AvatarUploader({ name, image }: AvatarUploaderProps) {
  const { control, setValue } = useFormContext();
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    if(image)
      getImageFromLocalHost(image).then((val)=>setPreview(val&&val!=="null"?val:null))
  },[])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setValue(name, file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem>
          <FormControl>
            <div className="relative w-24 h-24">
              <Input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageChange}
              />
              <div
                className={cn(
                  "w-24 h-24 rounded-full border flex items-center justify-center cursor-pointer relative overflow-hidden",
                  "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-all"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? 
                  <LzyImage
                    src={preview}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-full"
                  /> 
                  : (
                    <Upload className="w-10 h-10 text-gray-500" />
                  )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
