"use client"
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowLeftToLine, ArrowRightFromLine, ArrowUpDown, CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

export type Columns = {
  id: string;
  added_at?: string;
  park: string;
  remarque: string;
  vehicle: {
    id: string;
    matricule: string;
    vehicle_park: {
      id: string;
      park: {
        id: string;
        name: string;
      };
    }[];
  };
  device: {
    id: string;
    name: string;
    type: number;
  };
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

const matriculeHeader = (column: any) => {

  const t = useTranslations("Vehicle");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("matricule")}
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

const remarqueHeader = (column: any) => {

  const t = useTranslations("Vehicle");

  return (
    <CircleAlert className="text-red-500" />
  );
}
const remarqueCell = (column: any) => {

  const t = useTranslations("Vehicle");
  const type = column.original.deviceType;
  const status = column.original.status;

  return (
    type === 0 ?
      (status === 1 ?
        <ArrowRightFromLine className="text-green-500" />
        :
        <ArrowRightFromLine className="text-red-500" />)
      :
      type === 1 ?
        (status === 1 ?
          <ArrowLeftToLine className="text-green-500" />
          :
          <ArrowLeftToLine className="text-red-500" />)
        :
        <CircleAlert className="text-red-500" />


  );
}


export const columns: ColumnDef<Columns>[] = [
  {
    accessorKey: "remarque",
    header: ({ column }) => remarqueHeader(column),
    cell: ({ row }) => remarqueCell(row),
    enableSorting: true,
  },
  {
    accessorKey: "vehicle",
    header: ({ column }) => matriculeHeader(column),
    cell: ({ row }) => (row.getValue("vehicle")),
    enableSorting: true,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => addedAtHeader(column),
    cell: ({ row }) => (row.getValue("created_at")),
    enableSorting: true,
  },
  {
    accessorKey: "park",
    header: ({ column }) => parkHeader(column),
    cell: ({ row }) => (row.getValue("park")),
    enableSorting: true,
  },
];


