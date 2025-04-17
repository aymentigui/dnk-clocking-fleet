"use client"
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Trash, ArrowUpDown, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useSession } from "@/hooks/use-session";
import { Checkbox } from "@/components/ui/checkbox";
import { useAddUpdateDeviceDialog } from "@/context/add-update-dialog-context-device";
import { deleteDevices } from "@/actions/device/delete";

export type Columns = {
  id: string;
  code: string;
  username: string;
  password: string;
  park?: string;
};

const codeHeader = (column: any) => {

  const t = useTranslations("Device");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("code")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

const usernameHeader = (column: any) => {

  const t = useTranslations("Device");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("username")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

const passwordHeader = (column: any) => {

  const t = useTranslations("Device");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("password")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

const parkHeader = (column: any) => {

  const t = useTranslations("Device");

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

const typeHeader = (column: any) => {

  const t = useTranslations("Device");

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="w-3/6 flex justify-between"
    >
      {t("type")}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

const typeCell = (column: any) => {

  const t = useTranslations("Device");
  
  return (
    <div>
      {column.getValue("type") === 0 
      ? t("devicesortie") 
      : column.getValue("type") === 1 
      ? t("deviceentree") 
      : column.getValue("type") === 2 
      ? t("devicesortieentree") 
      : column.getValue("type") === 3
      ? t("devicecontroller")
      : "" }
    </div>
  );
}

const actionsCell = (row: any) => {
  const user = row.original;
  const { openDialog } = useAddUpdateDeviceDialog();
  const { session } = useSession()
  const hasPermissionDelete = (session?.user?.permissions.find((permission: string) => permission === "devices_delete") ?? false) || session?.user?.is_admin;
  const hasPermissionUpdate = (session?.user?.permissions.find((permission: string) => permission === "devices_update") ?? false) || session?.user?.is_admin;
  
  const handleOpenDialogWithTitle = () => {
    openDialog(false, row.original)
  };

  return (
    <div className="w-1/6 flex gap-2">
      {hasPermissionDelete && <Button
        onClick={() => deleteHandler(user.id)}
        variant="destructive"
      >
        <Trash />
      </Button>}
      {hasPermissionUpdate && <Button variant={"outline"} onClick={handleOpenDialogWithTitle}>
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
    accessorKey: "code",
    header: ({column}) => codeHeader(column),
    cell: ({ row }) => ( row.getValue("code") ),
    enableSorting: true,
  },
  {
    accessorKey: "username",
    header: ({column}) => usernameHeader(column),
    cell: ({ row }) => ( row.getValue("username") ),
    enableSorting: true,
  },
  {
    accessorKey: "password",
    header: ({column}) => passwordHeader(column),
    cell: ({ row }) => ( row.getValue("password") ),
    enableSorting: true,
  },
  {
    accessorKey: "park",
    header: ({column}) => parkHeader(column),
    cell: ({ row }) => ( row.getValue("park") ),
    enableSorting: true,
  },
  {
    accessorKey: "type",
    header: ({column}) => typeHeader(column),
    cell: ({ row }) => ( typeCell(row) ),
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
  const response = await deleteDevices([id]);
  if (response.status === 200) {
    toast.success(response.data.message);
    window.location.reload()
  } else {
    toast.error(response.data.message)
  }
};


