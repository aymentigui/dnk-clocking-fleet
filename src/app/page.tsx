"use client";

import Loading from "@/components/myui/loading";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {

  const router= useRouter()

  useEffect(() => {
    setTimeout(() => {
      router.push("/admin/vehicles");
    }, 1000);
  }, []);

  return (
    <div className="h-screen w-full  flex items-center justify-center">
      <Loading />
    </div>
  );
}
