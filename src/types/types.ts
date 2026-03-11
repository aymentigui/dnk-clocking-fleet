// types.ts
export interface Vehicle {
  id: string;
  matricule: string;
  vin: string;
  brand: string;
  model: string;
  year: string;
  park?: {
    id: string;
    name: string;
  } | null;
  region?: string;
  region2?: string;
  inpark?: boolean;
  status?: string;
  [key: string]: any;
}

export interface Park {
  id: string;
  name: string;
}

export interface Region {
  id: string;
  name: string;
}

export interface VehicleFilters {
  searchQuery: string;
  parkId: string;
  regionId: string;
  lastRegion: string;
  inPark: string;
}

export interface ColumnDef {
  header: string;
  accessorKey: string;
  cell?: (props: any) => React.ReactNode;
}
