"use client"
import { DataTable } from "./data-table/data-table-device";
import { useTranslations } from "next-intl";
import Loading from "@/components/myui/loading";
import { useEffect, useState } from "react";
import { useOrigin } from "@/hooks/use-origin";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import SelectFetch from "@/components/myui/select-fetch";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useImportSheetsStore } from "@/hooks/use-import-csv";
import { getColumns } from "@/actions/util/sheet-columns/user";
import toast from "react-hot-toast";
import { useSession } from "@/hooks/use-session";
import { deleteUsers } from "@/actions/users/delete";
import ConfirmDialogDelete from "@/components/myui/shadcn-dialog-confirm";
import { generateFileClient } from "@/actions/util/export-data/export-client";
import ExportButton from "@/components/my/export-button";
import { getAllUsers, getUsersWithIds } from "@/actions/users/get";
import { createDevices } from "@/actions/device/set";
import { getCountDevices, getDevices, getDevicesWithIds } from "@/actions/device/get";
import SelectSearchFetch from "@/components/myui/select-search-fetch";
import { getParksAdmin } from "@/actions/park/get";

const selectors = [
  { title: "id", selector: "id" },
  { title: "code", selector: "code" },
  { title: "username", selector: "username" },
  { title: "password", selector: "password" },
  { title: "park", selector: "park" },
];

export default function ListDevices() {
  const translate = useTranslations("Device")

  const translateSystem = useTranslations("System");
  const translateErrors = useTranslations("Error")

  const origin = useOrigin()
  const { session } = useSession()
  const searchParams = useSearchParams();
  const { data: sheetData, setColumns, setData: setSheetData } = useImportSheetsStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(searchParams.get("page") ? Number(searchParams.get("page")) : 1);
  const [pageSize, setPageSize] = useState(10);
  const [count, setCount] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(""); // Etat pour la recherche avec debounce
  const [searchPark, setSearchPark] = useState("");
  const [parks, setParks] = useState([])

  const [open, setOpen] = useState(false); // for confirm delete

  const [userSheetNotCreated, setUserSheetNotCreated] = useState<any>([])
  const [userSheetCreated, setUserSheetCreated] = useState(false)

  const [data, setData] = useState<any[]>([]);
  const columnsSheet = getColumns()

  useEffect(() => {
    setMounted(true);
    getParksAdmin().then((res) => {
      if (res && res.status === 200) {
        setParks(res.data)
      }
    });
    setColumns(columnsSheet);
  }, []);

  // pour la creation depuis les sheet
  useEffect(() => {
    if (sheetData && sheetData.length > 0) {
      createDevices(sheetData).then((res) => {
        if (res.status === 200) {
          if (res.data.devices) {
            res.data.devices.forEach((device) => {
              if (device.status !== 200) {
                setUserSheetNotCreated((prev: any) => [...prev, device.data])
              } else {
                setUserSheetCreated(true)
              }
            })
          }
        } else {
          toast.error(res.data.message);
        }
      }).catch((error) => {
        toast.error(translateSystem("errorcreate"));
      }).finally(() => {
        setSheetData([]); // Mettre à jour le tableau avec les données créées
      });
    }
  }, [sheetData]);

  useEffect(() => {
    fetchDevices();
  }, [page, debouncedSearchQuery, mounted, pageSize, searchPark]); // Ajouter debouncedSearchQuery comme dépendance


  const fetchDevices = async () => {
    setData([]);
    setIsLoading(false)
    try {
      if (!origin) return
      setIsLoading(true);
      const response = await getDevices(page, pageSize, debouncedSearchQuery, searchPark);
      if (response.status === 200) {
        setData(response.data);
      }

      const countResponse = await getCountDevices(debouncedSearchQuery, searchPark);
      if (countResponse.status === 200) {
        setCount(countResponse.data);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportSelected = async (type: number = 1) => {

    const res = await getDevicesWithIds(selectedIds)

    if (res.status !== 200) {
      toast.error(translateErrors("badrequest"))
      return
    }

    const users = res.data
    generateFileClient(selectors, users, type);

  };

  const exportAll = async (type: number = 1) => {

    const res = await getDevices()

    if (res.status !== 200) {
      toast.error(translateErrors("badrequest"))
      return
    }

    const users = res.data
    generateFileClient(selectors, users, type);

  };

  if (!mounted) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="py-10">
      <h1 className="text-2xl font-bold mb-4">{translate("title")}</h1>
      {userSheetCreated && (
        <div className="bg-blue-500 text-white p-4 mb-4 rounded">
          {translateSystem("mustrefreshtoseedata")}
        </div>
      )}
      {userSheetNotCreated && userSheetNotCreated.length > 0 && (
        <div className="max-h-48 overflow-auto">
          {userSheetNotCreated.map((data: any, index: any) => (
            <div key={index} className="mt-4 p-4 bg-red-200 text-red-700 rounded">
              <h2 className="font-bold">{translateErrors("errors")}</h2>
              <ul className="list-disc pl-5">
                <li>
                  {
                    (data.message ? data.message + " : " : "") + " " + (data.user.firstname ?? "") + " " + (data.user.lastname ?? "") + " " + (data.user.username ?? "") + " " + (data.user.email ?? "") + " " + (data.user.password ?? "")
                  }
                </li>
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 justify-between items-center">
        <div className="flex gap-2">
          <Link href="/admin/sheetimport">
            <Button>{translateSystem('import')}</Button>
          </Link>
          <ExportButton all={true} handleExportCSV={() => exportAll(1)} handleExportXLSX={() => exportAll(2)} />
          {selectedIds.length > 0 && <ExportButton all={false} handleExportCSV={() => exportSelected(1)} handleExportXLSX={() => exportSelected(2)} />}
          {(session?.user?.permissions.find((permission: string) => permission === "users_delete") ?? false) || session?.user?.is_admin
            &&
            selectedIds.length > 0
            &&
            <ConfirmDialogDelete
              open={open}
              setOpen={setOpen}
              selectedIds={selectedIds}
              textToastSelect={translate("selectusers")}
              triggerText={translate("deleteusers")}
              titleText={translate("confermationdelete")}
              descriptionText={translate("confermationdeletemessage")}
              deleteAction={deleteUsers}
            />
          }
        </div>
        <div className="flex gap-2">
          <div className='w-48 mb-2'>
            <SelectFetch
              value={pageSize.toString()}
              onChange={(val) => setPageSize(Number(val))}
              label={translateSystem("pagesize")}
              placeholder={translateSystem("pagesizeplaceholder")}
              options={[
                { value: "10", label: "10" },
                { value: "20", label: "20" },
                { value: "50", label: "50" },
                { value: "100", label: "100" },
              ]}
            />
          </div>
          <div className='w-48 mb-2'>
            <SelectSearchFetch
              value={searchPark}
              onChange={(val) => setSearchPark(val)}
              label={translate("selectpark")}
              placeholder={translate("selectpark")}
              options={
                parks.map((park: any) => ({
                  value: park.id,
                  label: park.name
                }))
              }
            />
          </div>

        </div>
      </div>
      <DataTable
        data={data}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        debouncedSearchQuery={debouncedSearchQuery}
        setDebouncedSearchQuery={setDebouncedSearchQuery}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        count={count}
        showPagination
        showSearch
      />
    </div>
  );
}