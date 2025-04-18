"use client";

import Loading from "@/components/myui/loading";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {

  const router= useRouter()
  const origin = "http://localhost:3000";

  useEffect(() => {
    // setTimeout(() => {
    //   router.push("/admin/vehicles");
    // }, 1000);

    axios.post(`http://localhost:3000/api/admin/clocking`, {
      matricule: "000184-415-16",
    }, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    }).then((res) => {
      if (res && res.status === 200) {
        console.log("res", res.data);
      }
    })


  }, []);

  return (
    <div className="h-screen w-full  flex items-center justify-center">
      <Loading />
    </div>
  );
}
