import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getAllRegions, getRegionStatistics } from '@/actions/clocking/get-statistics-courses';
import StatisticsContent from '../_componenets/statistic-content';

export default async function StatisticsPage() {
  const t = await getTranslations('Statistics');

  const [initialStats, regions] = await Promise.all([
    getRegionStatistics(new Date()),
    getAllRegions(),
  ]);

  // Server action that returns void and data is fetched on client
  async function handleRefresh(date: Date): Promise<void> {
    'use server';
    // This will be called from the client component
    // The client component will call getRegionStatistics separately
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<div>{t('loading')}</div>}>
          <StatisticsContent
            initialStats={initialStats}
            regions={regions}
            onRefresh={handleRefresh}
          />
        </Suspense>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Statistics',
  description: 'View comprehensive statistics about your courses and vehicles',
};