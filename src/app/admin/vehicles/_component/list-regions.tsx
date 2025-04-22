"use client"
import { DataTable } from "./data-table/data-table-parks";

export default function RegionsList({ id }: { id: string }) {

  return (
    <div className="container mx-auto pb-10">
      <DataTable
        id={id}
      />
    </div>
  );
}