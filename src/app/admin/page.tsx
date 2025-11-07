// app/dashboard/statistics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import StatisticsClient from '@/components/my/admin/statistic-page';
import { getDevicesCount, getParksCount, getParkVehiclesCount, getUsersCount, getVehiclesCount, getVehiclesNoParkCount } from '@/actions/statistic/statistic';

interface StatsData {
  vehicles: number;
  parks: number;
  devices: number;
  users: number;
  vehiclesNoPark: number;
  parkVehicles: Array<{ name: string; count: number }>;
}

export default function StatisticsPage() {
  const t = useTranslations('Statistics');
  const s = useTranslations('System');
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          vehiclesRes,
          parksRes,
          devicesRes,
          usersRes,
          noParkVehiclesRes,
          parkVehiclesRes
        ] = await Promise.all([
          getVehiclesCount(),
          getParksCount(),
          getDevicesCount(),
          getUsersCount(),
          getVehiclesNoParkCount(),
          getParkVehiclesCount()
        ]);



        setStatsData({
          vehicles: vehiclesRes.data || 0,
          parks: parksRes.data || 0,
          devices: devicesRes.data || 0,
          users: usersRes.data || 0,
          vehiclesNoPark: noParkVehiclesRes.data || 0,
          parkVehicles: parkVehiclesRes.data || []
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const translations = {
    title: s('dashboard'),
    vehicles: t('vehicles'),
    parks: t('parks'),
    devices: t('devices'),
    users: t('users'),
    vehiclesNoPark: t('vehiclesNoPark'),
    distribution: t('distribution'),
    statistics: t('overview'),
    total: s('total'),
    vehiclesByStation: t('vehiclesByStation'),
    loading: s('loading'),
    attentionRequired: t('attentionRequired'),
    unassignedVehicles: (count: number) => t('unassignedVehicles', { count }),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!statsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400">
          Error loading statistics
        </div>
      </div>
    );
  }

  return <StatisticsClient statsData={statsData} translations={translations} />;
}