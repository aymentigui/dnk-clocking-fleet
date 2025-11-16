'use client';

import { useTranslations } from 'next-intl';

interface PeriodSelectorProps {
    period: string;
    onPeriodChange: (period: string) => void;
}

export function PeriodSelector({ period, onPeriodChange }: PeriodSelectorProps) {
    const t = useTranslations('StatisticsConducteurs');

    const periods = [
        { value: 'week', label: t('week') },
        { value: 'month', label: t('month') },
        { value: 'threeMonths', label: t('threeMonths') },
        { value: 'year', label: t('year') }
    ];

    return (
        <div className="flex space-x-2">
            {periods.map((p) => (
                <button
                    key={p.value}
                    onClick={() => onPeriodChange(p.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${period === p.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
}