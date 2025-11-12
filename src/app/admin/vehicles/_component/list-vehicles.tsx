"use client"
import { useTranslations } from "next-intl";
import Loading from "@/components/myui/loading";
import { useEffect, useState } from "react";
import { useOrigin } from "@/hooks/use-origin";
import { useRouter, useSearchParams } from "next/navigation";
import SelectFetch from "@/components/myui/select-fetch";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useImportSheetsStore } from "@/hooks/use-import-csv";
import toast from "react-hot-toast";
import { useSession } from "@/hooks/use-session";
import ConfirmDialogDelete from "@/components/myui/shadcn-dialog-confirm";
import { generateFileClient } from "@/actions/util/export-data/export-client";
import ExportButton from "@/components/my/export-button";
import SelectSearchFetch from "@/components/myui/select-search-fetch";
import { getParksAdmin } from "@/actions/park/get";
import { createVehicles } from "@/actions/vehicle/set";
import { getCountVehicles, getVehicles, getVehiclesAll, getVehiclesAllMatrciule, getVehiclesMatriculeWithIds, getVehiclesWithIds } from "@/actions/vehicle/get";
import { deleteVehicles } from "@/actions/vehicle/delete";
import { getColumns } from "@/actions/util/sheet-columns/vehicle";
import { getColumns as getColumnsParc } from "@/actions/util/sheet-columns/vehicles-park";
import { getColumns as getColumnsRegion } from "@/actions/util/sheet-columns/vehicles-region";
import UpdateParcs from "./dialog/update-parc";
import { generateQRCodeAndDownload } from "@/actions/util/qrcode";
import { Eye, QrCode, Settings2, Trash } from "lucide-react";
import { getRegionsAdmin } from "@/actions/region/get";
import UpdateRegion from "./dialog/update-region";
import { UpdateVehiclesParc, UpdateVehiclesParcMatricule, UpdateVehiclesRegionMatricules } from "@/actions/vehicle/update";
import SearchTable from "@/components/myui/table/search-table";
import TablePagination from "@/components/myui/table/table-pagination";
import { useAddUpdateVehicleDialog } from "@/context/add-update-dialog-context-vehicle";

const selectors = [
  { title: "matricule", selector: "matricule" },
  { title: "vin", selector: "vin" },
  { title: "brand", selector: "brand" },
  { title: "model", selector: "model" },
  { title: "year", selector: "year" },
  { title: "park", selector: "park" },
];

export default function ListVehicles() {
  const translate = useTranslations("Vehicle")
  const translateSystem = useTranslations("System");
  const translateErrors = useTranslations("Error")

  const origin = useOrigin()
  const { session } = useSession()
  const searchParams = useSearchParams();
  const { data: sheetData, setColumns, setData: setSheetData, typeData, setTypeData } = useImportSheetsStore();
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(searchParams.get("page") ? Number(searchParams.get("page")) : 1);
  const [pageSize, setPageSize] = useState(10);
  const [count, setCount] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchPark, setSearchPark] = useState("");
  const [searchRegion, setSearchRegion] = useState("");
  const [parks, setParks] = useState([])
  const [regions, setRegions] = useState([])

  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const [open4, setOpen4] = useState(false);
  const { openDialog } = useAddUpdateVehicleDialog();

  const [userSheetNotCreated, setUserSheetNotCreated] = useState<any>([])
  const [userSheetCreated, setUserSheetCreated] = useState(false)

  const [data, setData] = useState<any[]>([]);
  const columnsSheet = getColumns()
  const columnsSheetVehiclesPark = getColumnsParc()
  const columnsSheetVehiclesRegion = getColumnsRegion()

  const handleOpenDialogWithTitle = (vehicle: any) => {
    openDialog(false, vehicle)
  };

  const generateQRAll = () => {
    getVehiclesAllMatrciule().then((res) => {
      if (res && res.status === 200) {
        generateQRCodeAndDownload(res.data)
      }
    })
  };

  const generateQRAllSelected = () => {
    getVehiclesMatriculeWithIds(selectedIds).then((res) => {
      if (res && res.status === 200) {
        generateQRCodeAndDownload(res.data)
      }
    })
  };

  const importvehicles = () => {
    setColumns(columnsSheet);
    setTypeData("Vehicle")
    router.push("/admin/sheetimport")
  }

  const importvehiclespark = () => {
    setColumns(columnsSheetVehiclesPark);
    setTypeData("Parc")
    router.push("/admin/sheetimport")
  }

  const importvehiclesregion = () => {
    setColumns(columnsSheetVehiclesRegion);
    setTypeData("Region")
    router.push("/admin/sheetimport")
  }

  useEffect(() => {
    setMounted(true);
    getParksAdmin().then((res) => {
      if (res && res.status === 200) {
        setParks(res.data)
      }
    });
    getRegionsAdmin().then((res) => {
      if (res && res.status === 200) {
        setRegions(res.data)
      }
    });
  }, []);

  useEffect(() => {
    if (sheetData && sheetData.length > 0) {
      if (typeData === "Vehicle") {
        createVehicles(sheetData).then((res) => {
          if (res.status === 200) {
            if (res.data.vehicles) {
              res.data.vehicles.forEach((vehicle) => {
                if (vehicle.status !== 200) {
                  setUserSheetNotCreated((prev: any) => [...prev, vehicle.data])
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
          setSheetData([]);
        });
      } else if (typeData === "Parc") {
        UpdateVehiclesParcMatricule(sheetData).then((res) => {
          if (res.status === 200) {
            toast.success(res.data.message);
            window.location.reload()
          } else {
            toast.error(res.data.message);
          }
        }).catch((error) => {
          toast.error(translateSystem("errorcreate"));
        }).finally(() => {
          setSheetData([]);
        });
      } else if (typeData === "Region") {
        UpdateVehiclesRegionMatricules(sheetData, "1").then((res) => {
          if (res.status === 200) {
            toast.success(res.data.message);
            window.location.reload()
          } else {
            toast.error(res.data.message);
            setColumns(columnsSheet);
          }
        }).catch((error) => {
          toast.error(translateSystem("errorcreate"));
        }).finally(() => {
          setSheetData([]);
        });
      }
      else if (typeData === "Region2") {
        UpdateVehiclesRegionMatricules(sheetData, "2").then((res) => {
          if (res.status === 200) {
            toast.success(res.data.message);
            window.location.reload()
          } else {
            toast.error(res.data.message);
            setColumns(columnsSheet);
          }
        }).catch((error) => {
          toast.error(translateSystem("errorcreate"));
        }).finally(() => {
          setSheetData([]);
        });
      }
    }
  }, [sheetData]);

  useEffect(() => {
    fetchDevices();
  }, [page, debouncedSearchQuery, mounted, pageSize, searchPark, searchRegion]);

  const fetchDevices = async () => {
    setData([]);
    setIsLoading(false)
    try {
      if (!origin) return
      setIsLoading(true);
      const response = await getVehicles(page, pageSize, debouncedSearchQuery, searchPark, searchRegion);
      console.log(response)
      if (response.status === 200) {
        setData(response.data);
      }

      const countResponse = await getCountVehicles(debouncedSearchQuery, searchPark, searchRegion);
      if (countResponse.status === 200) {
        setCount(countResponse.data);
      }
      setIsLoading(false);
    } catch (error) {
      console.log("Error fetching devices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportSelected = async (type: number = 1) => {
    const res = await getVehiclesWithIds(selectedIds)
    if (res.status !== 200) {
      toast.error(translateErrors("badrequest"))
      return
    }

    const data = res.data.map((vehicle: any) => ({
      matricule: vehicle.matricule,
      vin: vehicle.vin,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      park: vehicle.park ? vehicle.park.name : "",
    }))

    generateFileClient(selectors, data, type);
  };

  const exportAll = async (type: number = 1) => {
    const res = await getVehiclesAll()
    if (res.status !== 200) {
      toast.error(translateErrors("badrequest"))
      return
    }

    const data = res.data.map((vehicle: any) => ({
      matricule: vehicle.matricule,
      vin: vehicle.vin,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      park: vehicle.park ? vehicle.park.name : "",
    }))

    generateFileClient(selectors, data, type);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data) {
      setSelectedIds(data.map((c: any) => c.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((sid) => sid !== id))
    }
  }

  const deleteVehiclesHandler = async (ids: string[]) => {
    if (!origin) return;
    const response = await deleteVehicles(ids);
    if (response.status === 200) {
      toast.success(response.data.message);
      window.location.reload();
    } else {
      toast.error(response.data.message);
    }
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < data.length

  if (!mounted) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="py-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {translate("title")}
      </h1>

      {/* Alertes */}
      {userSheetCreated && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {translateSystem("mustrefreshtoseedata")}
        </div>
      )}

      {/* Erreurs */}
      {userSheetNotCreated && userSheetNotCreated.length > 0 && (
        <div className="max-h-48 overflow-auto mb-6">
          {userSheetNotCreated.map((data: any, index: any) => (
            <div key={index} className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-2">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <h2 className="font-semibold">{translateErrors("errors")}</h2>
              </div>
              <p className="mt-1 text-sm">
                {(data.message ? data.message + " : " : "") + " " + (data.vehicle.matricule ?? "") + " " + (data.vehicle.vin ?? "") + " " + (data.vehicle.model ?? "") + " " + (data.vehicle.year ?? "")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Barre d'actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button
            onClick={importvehicles}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {translateSystem('import')}
          </Button>

          {(session?.user?.permissions.find((permission: string) => permission === "vehicles_park_update") ?? false) || session?.user?.is_admin ? (
            <Button
              onClick={importvehiclespark}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              {translate('importvehiclespark')}
            </Button>
          ) : null}

          {(session?.user?.permissions.find((permission: string) => permission === "vehicles_park_region") ?? false) || session?.user?.is_admin ? (
            <Button
              onClick={importvehiclesregion}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              {translate('importvehiclesregion')}
            </Button>
          ) : null}

          <Button
            onClick={generateQRAll}
            variant="outline"
            className="border-gray-300 hover:bg-gray-50"
          >
            <QrCode size={20} className="mr-2" />
          </Button>

          {selectedIds.length > 0 && (
            <Button
              onClick={generateQRAllSelected}
              variant="outline"
              className="border-green-300 hover:bg-green-50 text-green-700"
            >
              <QrCode size={20} className="mr-2" />
              {translateSystem("downloadjustselected")}
            </Button>
          )}

          <ExportButton
            all={true}
            handleExportCSV={() => exportAll(1)}
            handleExportXLSX={() => exportAll(2)}
          />

          {selectedIds.length > 0 && (
            <ExportButton
              all={false}
              handleExportCSV={() => exportSelected(1)}
              handleExportXLSX={() => exportSelected(2)}
            />
          )}

          {/* Boutons d'action avec permissions */}
          <div className="flex flex-wrap gap-2 border-l border-gray-300 pl-3 ml-3">
            {(session?.user?.permissions.find((permission: string) => permission === "vehicles_delete") ?? false) || session?.user?.is_admin ? (
              selectedIds.length > 0 && (
                <ConfirmDialogDelete
                  open={open}
                  setOpen={setOpen}
                  selectedIds={selectedIds}
                  textToastSelect={translate("selectvehicles")}
                  triggerText={translate("deletevehicles")}
                  titleText={translate("confermationdelete")}
                  descriptionText={translate("confermationdeletemessage")}
                  deleteAction={deleteVehicles}
                />
              )
            ) : null}

            {(session?.user?.permissions.find((permission: string) => permission === "vehicles_park_update") ?? false) || session?.user?.is_admin ? (
              selectedIds.length > 0 && (
                <UpdateParcs
                  open={open2}
                  setOpen={setOpen2}
                  selectedIds={selectedIds}
                  parcs={parks}
                />
              )
            ) : null}

            {(session?.user?.permissions.find((permission: string) => permission === "vehicles_region_update") ?? false) || session?.user?.is_admin ? (
              selectedIds.length > 0 && (
                <UpdateRegion
                  type="1"
                  open={open3}
                  setOpen={setOpen3}
                  selectedIds={selectedIds}
                  parcs={regions}
                />
              )
            ) : null}

            {(session?.user?.permissions.find((permission: string) => permission === "vehicles_region_update") ?? false) || session?.user?.is_admin ? (
              selectedIds.length > 0 && (
                <UpdateRegion
                  type="2"
                  open={open4}
                  setOpen={setOpen4}
                  selectedIds={selectedIds}
                  parcs={regions}
                />
              )
            ) : null}
          </div>
        </div>
      </div>

      {/* Filtres et contrôles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="w-48">
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

            <div className="w-48">
              <SelectSearchFetch
                value={searchPark}
                onChange={(val) => { setSearchPark(val) }}
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

            <div className="w-48">
              <SelectSearchFetch
                value={searchRegion}
                onChange={(val) => { setSearchRegion(val) }}
                label={translate("selectregion")}
                placeholder={translate("selectregion")}
                options={
                  regions.map((region: any) => ({
                    value: region.id,
                    label: region.name
                  }))
                }
              />
            </div>
          </div>

          {/* Composant de recherche */}
          <div className="flex-1 max-w-md">
            <SearchTable
              page={page}
              debouncedSearchQuery={debouncedSearchQuery}
              setDebouncedSearchQuery={setDebouncedSearchQuery}
            />
          </div>
        </div>
      </div>

      {/* Tableau */}
      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Loading />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {translate("matricule")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {translate("model")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {translate("year")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {translate("brand")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {translate("vin")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {translate("park")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {translate("region")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {translate("region")} 2
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {translateSystem("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.length > 0 ? (
                  data.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(vehicle.id)}
                          onChange={(e) => handleSelectOne(vehicle.id, e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {vehicle.matricule}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {vehicle.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {vehicle.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {vehicle.brand}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {vehicle.vin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {vehicle.park}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {vehicle.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {vehicle.region2}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {(session?.user?.permissions.find((permission: string) => permission === "vehicles_delete") ?? false) || session?.user?.is_admin ? (
                            <Button
                              onClick={() => deleteVehiclesHandler([vehicle.id])}
                              variant="destructive"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Trash size={14} />
                            </Button>
                          ) : null}

                          {(session?.user?.permissions.find((permission: string) => permission === "vehicles_update") ?? false) || session?.user?.is_admin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialogWithTitle(vehicle)}
                              className="h-8 w-8 p-0 border-gray-300"
                            >
                              <Settings2 size={14} />
                            </Button>
                          ) : null}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`${window.location.pathname}/${vehicle.id}`)}
                            className="h-8 w-8 p-0 border-gray-300"
                          >
                            <Eye size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium">{translateSystem("noresults")}</p>
                        {/* <p className="text-sm mt-1">{translateSystem("trychangingfilters")}</p> */}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination et total */}
      {!isLoading && (
        <div className="mt-6">
          <TablePagination
            page={page}
            setPage={setPage}
            count={count}
            pageSize={pageSize}
            isLoading={isLoading}
            debouncedSearchQuery={debouncedSearchQuery}
          />

          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 mt-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {translateSystem("total")}: <span className="font-bold">{count}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}