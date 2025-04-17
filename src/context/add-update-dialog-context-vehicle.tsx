"use client";

import { createContext, useContext, useState } from "react";

type Vehicle = {
  id: string;
  matricule: string;
  model?: string;
  year?: number;
  brand?: string;
  vin?: string | null;
  park?: string;
  parkId?: string;
};

type DialogContextType = {
  isOpen: boolean;
  isAdd: boolean;
  vehicle?: Vehicle;
  openDialog: (isAdd?: boolean, vehicle?: Vehicle) => void;
  closeDialog: () => void;
};

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const AddUpdateVehicleDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(true);
  const [vehicle, setVehicle] = useState<Vehicle>();

  const openDialog = (isAdd?: boolean, vehicle?: Vehicle) => {
    if (isAdd !== undefined) setIsAdd(isAdd);
    if (vehicle) setVehicle(vehicle)
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setIsAdd(true);
    setVehicle(undefined);
  };

  return (
    <DialogContext.Provider value={{ isOpen, isAdd, vehicle, openDialog, closeDialog }}>
      {children}
    </DialogContext.Provider>
  );
};

export const useAddUpdateVehicleDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};