"use client";

import { createContext, useContext, useState } from "react";

type Region = {
  id: string;
  name: string;
  description?: string;
  address?: string;
};

type DialogContextType = {
  isOpen: boolean;
  isAdd: boolean;
  region?: Region;
  openDialog: (isAdd?: boolean, region?: Region) => void;
  closeDialog: () => void;
};

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const AddUpdateRegionDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(true);
  const [region, setRegion] = useState<Region>();

  const openDialog = (isAdd?: boolean, region?: Region) => {
    if (isAdd !== undefined) setIsAdd(isAdd);
    if (region) setRegion(region)
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setIsAdd(true);
    setRegion(undefined);
  };

  return (
    <DialogContext.Provider value={{ isOpen, isAdd, region, openDialog, closeDialog }}>
      {children}
    </DialogContext.Provider>
  );
};

export const useAddUpdateRegionDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};