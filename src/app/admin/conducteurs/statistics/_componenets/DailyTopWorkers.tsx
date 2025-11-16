'use client';

import { useTranslations } from 'next-intl';
import { Trophy, Calendar, Target } from 'lucide-react';

interface DailyWorker {
  id: string;
  matricule: string;
  firstname: string;
  lastname: string;
  rotations: number;
  clockins: number;
  totalActivities: number;
  productivityScore: number;
}

interface DailyTopWorkersProps {
  data: Array<{
    date: string;
    displayDate: string;
    topWorkers: DailyWorker[];
    totalActiveDrivers: number;
    totalRotations: number;
    totalClockins: number;
  }>;
}

export function DailyTopWorkers({ data }: DailyTopWorkersProps) {
  const t = useTranslations('StatisticsConducteurs');
  const s = useTranslations('System');

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 0: return 'bg-yellow-100 border-yellow-300';
      case 1: return 'bg-gray-100 border-gray-300';
      case 2: return 'bg-orange-100 border-orange-300';
      default: return 'bg-white border-gray-200';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0: return <Trophy className="w-4 h-4 text-yellow-600" />;
      case 1: return <Target className="w-4 h-4 text-gray-600" />;
      case 2: return <Target className="w-4 h-4 text-orange-600" />;
      default: return <div className="w-4 h-4 text-sm font-bold">{rank + 1}</div>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{t('dailyTopWorkers')}</h3>
        </div>
        <p className="text-gray-600 text-sm mt-1">{t('last7days')}</p>
      </div>
      
      <div className="divide-y divide-gray-100">
        {data.map((day) => (
          <div key={day.date} className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900">
                {day.date === new Date().toISOString().split('T')[0] 
                  ? t('today') 
                  : day.displayDate
                }
              </h4>
              <div className="text-sm text-gray-500">
                {day.totalActiveDrivers} {t('activeDrivers').toLowerCase()}
              </div>
            </div>
            
            <div className="space-y-3">
              {day.topWorkers.map((worker, index) => (
                <div
                  key={worker.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getRankColor(index)}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6">
                      {getRankIcon(index)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {worker.firstname} {worker.lastname}
                      </div>
                      <div className="text-sm text-gray-500 font-mono">
                        {worker.matricule}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex space-x-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{worker.rotations}</div>
                        <div className="text-gray-500 text-xs">{t('rotations')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{worker.clockins}</div>
                        <div className="text-gray-500 text-xs">{t('clockins')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{worker.productivityScore}</div>
                        <div className="text-gray-500 text-xs">{t('productivityScore')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {day.topWorkers.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  {s('noresults')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}