"use client"
import { useTranslations } from "next-intl";
import { useSession } from "@/hooks/use-session";
import { DataTable } from "./data-table/data-table-parks";



export default function PakrsList({ id }: { id: string }) {
  const translate = useTranslations("Vehicle")
  const systemTranslate = useTranslations("System")


  return (
    <div className="container mx-auto pb-10">
      <DataTable
        id={id}
      />
    </div>
  );
}