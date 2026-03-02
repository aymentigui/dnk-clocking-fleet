import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { 
  confirmVehicles, 
  confirmVehiclesNotPark, 
  getCodeQrRequest, 
  getCodeQrRequestAndCreation, 
  getEditRequest 
} from '@/actions/global-etat/get-stat';
import { getParksAdmin } from '@/actions/park/get';

export type TabType = 'confirm' | 'not-park' | 'qr' | 'creation' | 'edit';

export function useVehiculesData() {
  const [activeTab, setActiveTab] = useState<TabType>('confirm');
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    parkId: undefined as string | undefined,
    all: false,
    markAsRead: true,
    page: 1,
    pageSize: 20
  });

  // Fetch parks for filter dropdown
  const { data: parksData } = useQuery({
    queryKey: ['parks-admin'],
    queryFn: async () => {
      const result = await getParksAdmin();
      return result.status === 200 ? result.data : [];
    }
  });

  // Fetch data based on active tab
  const { data, isLoading, refetch } = useQuery({
    queryKey: [activeTab, filters],
    queryFn: async () => {
      switch (activeTab) {
        case 'confirm':
          return await confirmVehicles(filters);
        case 'not-park':
          return await confirmVehiclesNotPark(filters);
        case 'qr':
          return await getCodeQrRequest(filters);
        case 'creation':
          return await getCodeQrRequestAndCreation(filters);
        case 'edit':
          return await getEditRequest(filters);
        default:
          return null;
      }
    }
  });

  return {
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    data,
    isLoading,
    refetch,
    parks: parksData || []
  };
}