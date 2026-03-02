import { ColumnDef } from '@tanstack/react-table';
import { CreationRequestItem } from '@/actions/global-etat/get-stat';
import { Button } from '@/components/ui/button';
import { Eye, Check } from 'lucide-react';

export const creationRequestColumns = (t: any, markAsRead: any): ColumnDef<CreationRequestItem>[] => [
  {
    accessorKey: 'matricule',
    header: t('table.matricule'),
    cell: ({ row }) => (
       <div className="flex flex-col">
        <span className="font-medium">{row.getValue('matricule')}</span>
        <div className="text-sm text-muted-foreground">
          {row.original.old_matricule && (
            <div>
              <span className="line-through">{row.original.old_matricule}</span>
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'brand',
    header: t('table.brand'),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('brand') || '-'}</span>
    ),
  },
  {
    accessorKey: 'model',
    header: t('table.model'),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('model') || '-'}</span>
    ),
  },
  {
    accessorKey: 'year',
    header: t('table.year'),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('year') || '-'}</span>
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
      <div className="flex gap-2">
        <Button onClick={()=>markAsRead(row.original.id)} variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
        {/* <Button variant="default" size="sm" className="gap-2">
          <Check className="h-4 w-4" />
          Confirm
        </Button> */}
      </div>
    ),
  },
];