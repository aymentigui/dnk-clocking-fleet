import { ColumnDef } from '@tanstack/react-table';
import { ConfirmVehicleNotParkItem } from '@/actions/global-etat/get-stat';
import { Button } from '@/components/ui/button';
import { Eye, AlertCircle, Edit } from 'lucide-react';

export const confirmVehiclesNotParkColumns = (t: any, markAsRead: any, updateParkVehicle: any): ColumnDef<ConfirmVehicleNotParkItem>[] => [
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
    cell: ({ row }) => (
      <div>
        <span className="font-medium">{row.getValue('parkName') || '-'}</span>
        {row.original.oldParkName && (
          <div className="text-sm text-muted-foreground">
            <span className="line-through">{row.original.oldParkName}</span>
          </div>
        )}
      </div>
    ),
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
      <div className="flex items-center gap-2">
        <Button onClick={() => markAsRead(row.original.id)} variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
        {!row.original.markAsRead && <Button onClick={() => updateParkVehicle(row.original.id)} variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>}
      </div>
    ),
  },
];