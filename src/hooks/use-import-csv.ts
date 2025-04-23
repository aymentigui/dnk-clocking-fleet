import { create } from "zustand";

export interface ColumnSheetsImport {
    title: string;
    require?: { req: boolean; message?: string };
    type?: { tp: "string" | "number" | "date"; message: string };
    condition?: { cond: (value: any) => boolean; message: string }[];
  }
  

interface ImportSheetsStore {
  columns: ColumnSheetsImport[];
  data: any[];
  typeData: string;
  setColumns: (columns: ColumnSheetsImport[]) => void;
  setData: (data: any[]) => void;
  setTypeData: (typeData: string) => void;
}

export const useImportSheetsStore = create<ImportSheetsStore>((set) => ({
  columns: [],
  data: [],
  typeData: "",
  setColumns: (columns) => set({ columns }),
  setData: (data) => set({ data }),
  setTypeData: (typeData) => set({ typeData }),
}));