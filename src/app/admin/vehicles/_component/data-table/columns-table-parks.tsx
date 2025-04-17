"use client"
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {  ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";

export type Columns = {
  id: string;
  name: string;
  added_at?: string;
  added_from?: string;
};

const parkHeader = (column: any) => {

  const t = useTranslations("Vehicle");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("park")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

const addedAtHeader = (column: any) => {

  const t = useTranslations("Vehicle");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("addedat")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

const addedFromHeader = (column: any) => {

  const t = useTranslations("Vehicle");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("addedfrom")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}


export const columns: ColumnDef<Columns>[] = [
  {
    accessorKey: "park",
    header: ({ column }) => parkHeader(column),
    cell: ({ row }) => (row.getValue("park")),
    enableSorting: true,
  },
  {
    accessorKey: "added_at",
    header: ({ column }) => addedFromHeader(column),
    cell: ({ row }) => (row.getValue("added_at")),
    enableSorting: true,
  },
  {
    accessorKey: "added_from",
    header: ({ column }) => addedFromHeader(column),
    cell: ({ row }) => (row.getValue("added_from")),
    enableSorting: true,
  },
];


