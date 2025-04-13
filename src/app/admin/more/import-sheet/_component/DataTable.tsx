import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataTableProps {
  data: { nom: string; prenom?: string; date?: string; age?: number }[];
}

export function DataTable({ data }: DataTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Prénom</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Age</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index}>
            <TableCell>{row.nom}</TableCell>
            <TableCell>{row.prenom || "-"}</TableCell>
            <TableCell>{row.date || "-"}</TableCell>
            <TableCell>{row.age !== undefined ? row.age : "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
