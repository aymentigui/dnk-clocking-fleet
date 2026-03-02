import { ColumnDef } from '@tanstack/react-table';
import { ConfirmVehicleItem } from '@/actions/global-etat/get-stat';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const confirmVehiclesColumns = (t: any, markAsRead: (id: string) => void): ColumnDef<ConfirmVehicleItem>[] => [
  {
    accessorKey: 'matricule',
    header: t('table.matricule'),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('matricule')}</span>
    ),
  },
  {
    accessorKey: 'parkName',
    header: t('table.parkName'),
    cell: ({ row }) => row.getValue('parkName') || '-',
  },
  {
    accessorKey: 'date',
    header: t('table.date'),
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return date.toLocaleString();
    },
  },
  {
    id: 'actions',
    header: t('table.actions'),
    cell: ({ row }) => (
      <Button onClick={() => markAsRead(row.original.id)} variant="ghost" size="sm">
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
];