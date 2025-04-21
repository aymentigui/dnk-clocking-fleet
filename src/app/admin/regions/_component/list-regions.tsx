"use client"
import { useTranslations } from "next-intl";
import Loading from "@/components/myui/loading";
import { useEffect, useState } from "react";
import { useOrigin } from "@/hooks/use-origin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useImportSheetsStore } from "@/hooks/use-import-csv";
import toast from "react-hot-toast";
import { useSession } from "@/hooks/use-session";
import ConfirmDialogDelete from "@/components/myui/shadcn-dialog-confirm";
import { generateFileClient } from "@/actions/util/export-data/export-client";
import ExportButton from "@/components/my/export-button";
import { getColumns } from "@/actions/util/sheet-columns/region";
import { createRegions } from "@/actions/region/set";
import { getRegions, getRegionsWithIds } from "@/actions/region/get";
import { deleteRegion } from "@/actions/region/delete";
import { DataTable } from "./data-table/data-table-region";

const selectors = [
  { title: "id", selector: "id" },  
  { title: "name", selector: "name" },
  { title: "description", selector: "description" },
  { title: "address", selector: "address" },
];

export default function ListRegions() {
  const translate = useTranslations("Region")

  const translateSystem = useTranslations("System");
  const translateErrors = useTranslations("Error")

  const origin = useOrigin()
  const { session } = useSession()
  const { data: sheetData, setColumns, setData: setSheetData } = useImportSheetsStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [open, setOpen] = useState(false); // for confirm delete

  const [regionSheetNotCreated, setRegionSheetNotCreated] = useState<any>([])
  const [regionSheetCreated, setRegionSheetCreated] = useState(false)

  const [data, setData] = useState<any[]>([]);
  const columnsSheet = getColumns()

  useEffect(() => {
    setMounted(true);
    setColumns(columnsSheet);
  }, []);

  useEffect(() => {
    fetchRegions()
  }, [origin]);

  // pour la creation depuis les sheet
  useEffect(() => {
    if (sheetData && sheetData.length > 0) {
      createRegions(sheetData).then((res) => {
        if (res.status === 200) {
          if (res.data.regions) {
            res.data.regions.forEach((region) => {
              if (region.status !== 200) {
                setRegionSheetNotCreated((prev: any) => [...prev, region.data])
              } else {
                setRegionSheetCreated(true)
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

  const fetchRegions = async () => {
    setData([]);
    try {
      if (!origin) return
      setIsLoading(true);
      const response = await getRegions();
      if (response.status === 200) {
        setData(response.data);
      }

    } catch (error) {
      console.error("Error fetching regions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportSelected = async (type: number = 1) => {

    const res = await getRegionsWithIds(selectedIds)

    if (res.status !== 200) {
      toast.error(translateErrors("badrequest"))
      return
    }

    const users = res.data
    generateFileClient(selectors, users, type);

  };

  const exportAll = async (type: number = 1) => {
    generateFileClient(selectors, data, type);

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
      {regionSheetCreated && (
        <div className="bg-blue-500 text-white p-4 mb-4 rounded">
          {translateSystem("mustrefreshtoseedata")}
        </div>
      )}
      {regionSheetNotCreated && regionSheetNotCreated.length > 0 && (
        <div className="max-h-48 my-2 overflow-auto">
          {regionSheetNotCreated.map((data: any, index: any) => (
            <div key={index} className="mt-4 p-4 bg-red-200 text-red-700 rounded">
              <h2 className="font-bold">{translateErrors("errors")}</h2>
              <ul className="list-disc pl-5">
                <li>
                  {
                    (data.message ? data.message + " : " : "") + " " + (data.region.name ?? "") + " " + (data.region.address ?? "") + " " + (data.region.description ?? "") 
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
          {(session?.user?.permissions.find((permission: string) => permission === "region_delete") ?? false) || session?.user?.is_admin
            &&
            selectedIds.length > 0
            &&
            <ConfirmDialogDelete
              open={open}
              setOpen={setOpen}
              selectedIds={selectedIds}
              textToastSelect={translate("selectregions")}
              triggerText={translate("deleteregions")}
              titleText={translate("confermationdelete")}
              descriptionText={translate("confermationdeletemessage")}
              deleteAction={deleteRegion}
            />
          }
        </div>
      </div>
      <DataTable
        data={data}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        // debouncedSearchQuery={debouncedSearchQuery}
        // setDebouncedSearchQuery={setDebouncedSearchQuery}
        // page={page}
        // setPage={setPage}
        // pageSize={pageSize}
        // count={count}
        // showPagination
        // showSearch
      />
    </div>
  );
}