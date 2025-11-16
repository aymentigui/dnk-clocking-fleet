'use client';

import { useTranslations } from 'next-intl';

interface Driver {
  id: string;
  matricule: string;
  firstname: string;
  lastname: string;
  rotations: number;
  clockins: number;
}

interface DriversTableProps {
  drivers: Driver[];
  title: string;
  showComparison?: boolean;
  previousDrivers?: Driver[];
}

export function DriversTable({ 
  drivers, 
  title, 
  showComparison = false, 
  previousDrivers = [] 
}: DriversTableProps) {
  const t = useTranslations('StatisticsConducteurs');

  const getDriverChange = (currentDriver: Driver) => {
    if (!showComparison) return null;
    
    const previousDriver = previousDrivers.find(d => d.id === currentDriver.id);
    if (!previousDriver) return { rotations: 100, clockins: 100 }; // New driver
    
    return {
      rotations: previousDriver.rotations === 0 ? 100 : 
        ((currentDriver.rotations - previousDriver.rotations) / previousDriver.rotations) * 100,
      clockins: previousDriver.clockins === 0 ? 100 : 
        ((currentDriver.clockins - previousDriver.clockins) / previousDriver.clockins) * 100
    };
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-4 font-medium text-gray-600">{t('driverName')}</th>
              <th className="text-left p-4 font-medium text-gray-600">{t('matricule')}</th>
              <th className="text-left p-4 font-medium text-gray-600">{t('rotations')}</th>
              <th className="text-left p-4 font-medium text-gray-600">{t('clockins')}</th>
              {showComparison && (
                <>
                  <th className="text-left p-4 font-medium text-gray-600">{t('change')}</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => {
              const changes = getDriverChange(driver);
              
              return (
                <tr key={driver.id} className="border-b border-gray-100 last:border-0">
                  <td className="p-4">
                    {driver.firstname} {driver.lastname}
                  </td>
                  <td className="p-4 font-mono text-sm">{driver.matricule}</td>
                  <td className="p-4 font-medium">{driver.rotations}</td>
                  <td className="p-4 font-medium">{driver.clockins}</td>
                  {showComparison && changes && (
                    <td className="p-4">
                      <div className="flex space-x-4 text-sm">
                        <span className={getChangeColor(changes.rotations)}>
                          {getChangeIcon(changes.rotations)} {Math.abs(changes.rotations).toFixed(1)}%
                        </span>
                        <span className={getChangeColor(changes.clockins)}>
                          {getChangeIcon(changes.clockins)} {Math.abs(changes.clockins).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}