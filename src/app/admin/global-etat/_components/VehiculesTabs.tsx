'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlobalFilters } from './filters/GlobalFilters';
import { useTranslations } from 'next-intl';
import { confirmVehiclesColumns } from './columns/confirm-vehicles-columns';
import { confirmVehiclesNotParkColumns } from './columns/confirm-vehicles-not-park-columns';
import { qrRequestColumns } from './columns/qr-request-columns';
import { creationRequestColumns } from './columns/creation-request-columns';
import { editRequestColumns } from './columns/edit-request-columns';
import { TabType, useVehiculesData } from '../_hooks/use-vehicules-data';
import { DataTable } from './data-table';
import { Pagination } from './pagination';
import { markAsView, updateParkVehicleFromGlobalEtat, updateVehicleDataFromGlobalEtat } from '@/actions/global-etat/functions';
import { generateQRCodeAndDownloadSingleWithoutZip } from '@/actions/util/qrcode';
import toast from 'react-hot-toast';
import { generateFileClient } from '@/actions/util/export-data/export-client';
import { Button } from '@/components/ui/button';

export function VehiculesTabs() {
  const t = useTranslations('GlobalEtat');
  const {
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    data,
    isLoading,
    parks,
    refetch
  } = useVehiculesData();

  const tabs: { value: TabType; label: string }[] = [
    { value: 'confirm', label: t('tabs.confirmVehicles') },
    { value: 'not-park', label: t('tabs.confirmVehiclesNotPark') },
    { value: 'qr', label: t('tabs.qrRequest') },
    { value: 'creation', label: t('tabs.creationRequest') },
    { value: 'edit', label: t('tabs.editRequest') },
  ];

  const generateQrCode = async (matricule: string, id: string) => {
    await generateQRCodeAndDownloadSingleWithoutZip(matricule)
    const res = await markAsView(id)
    if (res?.status === 200) {
      refetch()
    } else {
      toast.error("Failed to mark as viewed");
    }
  }

  const exporExcel = async (type: number = 2) => {
    if (!data || !data.items)
      return

    const selectors = [
      { title: "type", selector: "mtypee" },
      { title: "matricule", selector: "matricule" },
      { title: "brand", selector: "brand" },
      { title: "model", selector: "model" },
      { title: "year", selector: "year" },
      { title: "park", selector: "park" },
      { title: "old_matricule", selector: "old_matricule" },
      { title: "old_brand", selector: "ld_bran" },
      { title: "old_model", selector: "old_model" },
      { title: "yold_yearr", selector: "yold_yearr" },
      { title: "old_park", selector: "old_park" },
    ];

    const myData = data.items.map((item: any) => ({
      type: activeTab,
      matricule: item.matricule,
      brand: item.brand,
      model: item.model,
      year: item.year,
      park: item.parkName,
      old_matricule: item.old_matricule,
      old_brand: item.brand,
      old_model: item.model,
      old_year: item.year,
      old_park: item.oldParkName,
    }))

    generateFileClient(selectors, myData, type);
  };

  const updateVehicle = async (id: string, brand: string, model: string, year: number | string) => {
    const response = await updateVehicleDataFromGlobalEtat(id, {
      brand, model, year: Number(year)
    })
    if (response?.status === 200) {
      const res = await markAsView(id)
      if (res?.status === 200) {
        refetch()
      } else {
        toast.error("Vehicle updated but failed to mark as viewed");
      }
    } else {
      toast.error(response?.data?.message || "Failed to update vehicle");
    }
  }

  const markAsRead = async (id: string) => {
    const response = await markAsView(id)
    if (response?.status === 200) {
      refetch()
    } else {
      toast.error("Failed to mark as viewed");
    }
  }

  const updateParkVehicle = async (id: string) => {
    const response = await updateParkVehicleFromGlobalEtat(id)
    if (response?.status === 200) {
      const res = await markAsView(id)
      if (res?.status === 200) {
        refetch()
      } else {
        toast.error("Park vehicle updated but failed to mark as viewed");
      }
    } else {
      toast.error(response?.data?.message || "Failed to update park vehicle");
    }
  }

  const getRowClassName = (row: any) => {
    // Vérifier si view_at existe et n'est pas null
    if (row.markAsRead) {
      return "bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:hover:bg-green-800 theme-ocean:bg-green-800 theme-ocean:hover:bg-green-700"; // ou toute autre couleur pour vu
    }
    return "bg-red-50 hover:bg-red-100 dark:bg-red-900 dark:hover:bg-red-800 theme-ocean:bg-red-800 theme-ocean:hover:bg-red-700"; // ou toute autre couleur pour non vu
  }

  const getColumns = () => {
    switch (activeTab) {
      case 'confirm':
        return confirmVehiclesColumns(t, markAsRead);
      case 'not-park':
        return confirmVehiclesNotParkColumns(t, markAsRead, updateParkVehicle);
      case 'qr':
        return qrRequestColumns(t, generateQrCode);
      case 'creation':
        return creationRequestColumns(t, markAsRead);
      case 'edit':
        return editRequestColumns(t, markAsRead, updateVehicle);
      default:
        return [];
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters(prev => ({ ...prev, pageSize, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-2'>
            <GlobalFilters
              startDate={filters.startDate}
              endDate={filters.endDate}
              parkId={filters.parkId}
              parks={parks}
              markAsRead={filters.markAsRead}
              all={filters.all}
              onStartDateChange={(date) => setFilters(prev => ({ ...prev, startDate: date, page: 1 }))}
              onEndDateChange={(date) => setFilters(prev => ({ ...prev, endDate: date, page: 1 }))}
              onParkChange={(parkId) => setFilters(prev => ({ ...prev, parkId, page: 1 }))}
              allSelectChange={(all) => setFilters(prev => ({ ...prev, all, page: 1 }))}
              onMarkAsReadChange={(markAsRead) => setFilters(prev => ({ ...prev, markAsRead: markAsRead, page: 1 }))}
              onReset={() => setFilters({ startDate: undefined, endDate: undefined, parkId: undefined, page: 1, pageSize: 20, markAsRead: false, all: false })}
            />
            <Button variant={"primary"} onClick={() => exporExcel()}>Export</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="grid w-full grid-cols-5">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardContent className="pt-6">
                <DataTable
                  columns={getColumns()}
                  data={data?.items || []}
                  isLoading={isLoading}
                  getRowClassName={getRowClassName}
                />

                {data && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {t('pagination.total', { count: data.total })}
                    </div>
                    <Pagination
                      currentPage={data.page}
                      totalPages={Math.ceil(data.total / data.pageSize)}
                      onPageChange={handlePageChange}
                      pageSize={data.pageSize}
                      onPageSizeChange={handlePageSizeChange}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}