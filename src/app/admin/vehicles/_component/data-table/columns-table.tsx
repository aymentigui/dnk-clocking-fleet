"use client"
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Trash, ArrowUpDown, Settings2, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useSession } from "@/hooks/use-session";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteVehicles } from "@/actions/vehicle/delete";
import { useAddUpdateVehicleDialog } from "@/context/add-update-dialog-context-vehicle";
import { usePathname, useRouter } from "next/navigation";

export type Columns = {
  id: string;
  matricule: string;
  model: string;
  year: number;
  brand: string;
  vin: string;
  park: string;
};


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

const modelHeader = (column: any) => {

  const t = useTranslations("Vehicle");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("model")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

const yearHeader = (column: any) => {

  const t = useTranslations("Vehicle");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("year")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

const brandHeader = (column: any) => {

  const t = useTranslations("Vehicle");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("brand")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

const vinHeader = (column: any) => {

  const t = useTranslations("Vehicle");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("vin")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}


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

const actionsCell = (row: any) => {
  const vehicle = row.original;
  const { openDialog } = useAddUpdateVehicleDialog();
  const { session } = useSession()
  const router = useRouter()
  const pathname = usePathname();
  const hasPermissionDelete = (session?.user?.permissions.find((permission: string) => permission === "vehicles_delete") ?? false) || session?.user?.is_admin;
  const hasPermissionUpdate = (session?.user?.permissions.find((permission: string) => permission === "vehicles_update") ?? false) || session?.user?.is_admin;

  const handleOpenDialogWithTitle = () => {
    openDialog(false, row.original)
  };

  return (
    <div className="w-1/6 flex gap-2">
      {hasPermissionDelete && <Button
        onClick={() => deleteHandler(vehicle.id)}
        variant="destructive"
      >
        <Trash />
      </Button>}
      {hasPermissionUpdate && <Button variant={"outline"} onClick={handleOpenDialogWithTitle}>
        <Settings2 />
      </Button>}
      <Button variant={"outline"} onClick={()=> router.push(`${pathname}/${vehicle.id}`) }>
        <Eye />
      </Button>
    </div>
  );
};

export const columns: ColumnDef<Columns>[] = [
  {
    id: "actionsCheck",
    header: ({ table }) => {
      const allSelected = table.getIsAllRowsSelected(); // Vérifie si toutes les lignes sont sélectionnées

      return (
        <Checkbox
          checked={allSelected}
          onCheckedChange={(value) => {
            table.toggleAllRowsSelected(!!value); // Sélectionne ou désélectionne toutes les lignes
          }}
        />
      );
    },
    cell: ({ row }) => {
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      );
    },
  },
  {
    accessorKey: "matricule",
    header: ({ column }) => matriculeHeader(column),
    cell: ({ row }) => (row.getValue("matricule")),
    enableSorting: true,
  },
  {
    accessorKey: "model",
    header: ({ column }) => modelHeader(column),
    cell: ({ row }) => (row.getValue("model")),
    enableSorting: true,
  },
  {
    accessorKey: "year",
    header: ({ column }) => yearHeader(column),
    cell: ({ row }) => (row.getValue("year")),
    enableSorting: true,
  },
  {
    accessorKey: "brand",
    header: ({ column }) => brandHeader(column),
    cell: ({ row }) => (row.getValue("brand")),
    enableSorting: true,
  },
  {
    accessorKey: "vin",
    header: ({ column }) => vinHeader(column),
    cell: ({ row }) => (row.getValue("vin")),
    enableSorting: true,
  },
  {
    accessorKey: "park",
    header: ({ column }) => parkHeader(column),
    cell: ({ row }) => (row.getValue("park")),
    enableSorting: true,
  },

  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return actionsCell(row);
    },
  },
];

const deleteHandler = async (id: string) => {
  if (!origin) return
  const response = await deleteVehicles([id]);
  if (response.status === 200) {
    toast.success(response.data.message);
    window.location.reload()
  } else {
    toast.error(response.data.message)
  }
};


