import { ColumnDef } from '@tanstack/react-table';
import { EditRequestItem } from '@/actions/global-etat/get-stat';
import { Button } from '@/components/ui/button';
import { Eye, Check, X } from 'lucide-react';

export const editRequestColumns = (t: any, markAsRead: any, approve: any): ColumnDef<EditRequestItem>[] => [
  {
    accessorKey: 'matricule',
    header: t('table.matricule'),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.getValue('matricule')}</span>
        <div className="text-sm text-muted-foreground">
          {row.original.old_matricule && row.original.old_matricule !== row.original.matricule && (
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
      <div className="flex flex-col">
        <span className="font-medium">{row.getValue('brand') || '-'}</span>
        <div className="text-sm text-muted-foreground">
          {row.original.old_brand && (
            <div>
              <span className="line-through">{row.original.old_brand}</span>
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'model',
    header: t('table.model'),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.getValue('model') || '-'}</span>
        <div className="text-sm text-muted-foreground">
          {row.original.old_model && (
            <div>
              <span className="line-through">{row.original.old_model}</span>
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'year',
    header: t('table.year'),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.getValue('year') || '-'}</span>
        <div className="text-sm text-muted-foreground">
          {row.original.old_year && (
            <div>
              <span className="line-through">{row.original.old_year}</span>
            </div>
          )}
        </div>
      </div>
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
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => markAsRead(row.original.id)}>
          <Eye className="h-4 w-4" />
        </Button>
        {!row.original.markAsRead &&
          <Button variant="outline" size="sm" className="gap-2 text-green-600" onClick={() => approve(row.original.id,row.original.brand, row.original.model, row.original.year )}>
            <Check className="h-4 w-4" />
            {t('table.approve')}
          </Button>
        }
        {/* <Button variant="outline" size="sm" className="gap-2 text-red-600">
          <X className="h-4 w-4" />
          Reject
        </Button> */}
      </div>
    ),
  },
];