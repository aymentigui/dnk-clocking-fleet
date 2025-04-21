"use client"
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Trash, ArrowUpDown, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useSession } from "@/hooks/use-session";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteRegion } from "@/actions/region/delete";
import { useAddUpdateRegionDialog } from "@/context/add-update-dialog-context-region";

export type Columns = {
  id: string;
  name: string;
  address?: string;
  description?: string;
};

const nameHeader = (column: any) => {

  const t = useTranslations("Region");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("name")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

const descHeader = (column: any) => {

  const t = useTranslations("Region");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("description")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

const addressHeader = (column: any) => {

  const t = useTranslations("Region");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("address")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}


const actionsCell = (row: any) => {
  const user = row.original;
  const { openDialog } = useAddUpdateRegionDialog();
  const { session } = useSession()
  const hasPermissionDeleteUsers = (session?.user?.permissions.find((permission: string) => permission === "region_delete") ?? false) || session?.user?.is_admin;
  const hasPermissionUpdateUsers = (session?.user?.permissions.find((permission: string) => permission === "region_update") ?? false) || session?.user?.is_admin;
  
  const handleOpenDialogWithTitle = () => {
    openDialog(false, row.original)
  };

  return (
    <div className="w-1/6 flex gap-2">
      {hasPermissionDeleteUsers && <Button
        onClick={() => deleteHandler(user.id)}
        variant="destructive"
      >
        <Trash />
      </Button>}
      {hasPermissionUpdateUsers && <Button variant={"outline"} onClick={handleOpenDialogWithTitle}>
        <Settings2 />
      </Button>}
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
    accessorKey: "name",
    header: ({column}) => nameHeader(column),
    cell: ({ row }) => ( row.getValue("name") ),
    enableSorting: true,
  },
  {
    accessorKey: "address",
    header: ({column}) => addressHeader(column),
    cell: ({ row }) => ( row.getValue("address") ),
    enableSorting: true,
  },
  {
    accessorKey: "description",
    header: ({column}) => descHeader(column),
    cell: ({ row }) => ( row.getValue("description") ),
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
  if(!origin) return
  const response = await deleteRegion([id]);
  if (response.status === 200) {
    toast.success(response.data.message);
    window.location.reload()
  } else {
    toast.error(response.data.message)
  }
};


