import { ColumnDef } from '@tanstack/react-table';
import { QrRequestItem } from '@/actions/global-etat/get-stat';
import { Button } from '@/components/ui/button';
import { Eye, QrCode } from 'lucide-react';

export const qrRequestColumns = (t: any, generateQrCode: (matricule: string, id: string) => Promise<void>): ColumnDef<QrRequestItem>[] => [
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
    cell: ({ row }) => 
      <div className="flex flex-col">
        <span>{row.getValue('parkName')}</span>
        {row.original.oldParkName && (
          <span className="text-sm text-muted-foreground">
            {' '}{row.original.oldParkName}
          </span>
        )}
      </div>
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
      <Button  variant="outline" size="sm" className="gap-2" onClick={() => generateQrCode(row.original.matricule, row.original.id)}>
        <QrCode className="h-4 w-4" />
        Generate QR
      </Button>
    ),
  },
];