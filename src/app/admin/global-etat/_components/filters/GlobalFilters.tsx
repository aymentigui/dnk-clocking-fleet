'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface GlobalFiltersProps {
  startDate?: Date;
  endDate?: Date;
  parkId?: string;
  parks: any[];
  markAsRead?: boolean;
  all?: boolean;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onParkChange: (parkId: string | undefined) => void;
  onMarkAsReadChange: (markAsRead: boolean) => void;
  allSelectChange: (all: boolean) => void;
  onReset: () => void;
}

export function GlobalFilters({
  startDate,
  endDate,
  parkId,
  parks,
  markAsRead,
  all,
  onStartDateChange,
  onEndDateChange,
  onParkChange,
  onMarkAsReadChange,
  allSelectChange,
  onReset
}: GlobalFiltersProps) {
  const t = useTranslations('GlobalEtat.filters');

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('startDate')}</label>
        <Input
          type="date"
          value={startDate ? startDate.toISOString().split('T')[0] : ''}
          onChange={(e) => onStartDateChange(e.target.value ? new Date(e.target.value) : undefined)}
          className="w-[200px]"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('endDate')}</label>
        <Input
          type="date"
          value={endDate ? endDate.toISOString().split('T')[0] : ''}
          onChange={(e) => onEndDateChange(e.target.value ? new Date(e.target.value) : undefined)}
          className="w-[200px]"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t('park')}</label>
        <Select
          value={parkId || 'all'}
          onValueChange={(value) => onParkChange(value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('allParks')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allParks')}</SelectItem>
            {parks.map((park) => (
              <SelectItem key={park.id} value={park.id}>
                {park.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t('markAsRead')}</label>
        <Select
          value={markAsRead ? 'all' : 'unread'}
          onValueChange={(value) => onMarkAsReadChange(value === 'all' ? true : false)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="unread">{t('unread')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t('all')}</label>
        <Select
          value={all ? 'all' : 'filtered'}
          onValueChange={(value) => allSelectChange(value === 'all')}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="filtered">{t('filtered')}</SelectItem>
            <SelectItem value="all">{t('all')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={onReset}>
        {t('reset')}
      </Button>
    </div>
  );
}