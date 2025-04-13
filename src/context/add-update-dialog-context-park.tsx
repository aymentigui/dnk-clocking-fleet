"use client";

import { createContext, useContext, useState } from "react";

type Park = {
  id: string;
  name: string;
  description?: string;
  address?: string;
};

type DialogContextType = {
  isOpen: boolean;
  isAdd: boolean;
  park?: Park;
  openDialog: (isAdd?: boolean, park?: Park) => void;
  closeDialog: () => void;
};

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const AddUpdateParkDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(true);
  const [park, setPark] = useState<Park>();

  const openDialog = (isAdd?: boolean, park?: Park) => {
    if (isAdd !== undefined) setIsAdd(isAdd);
    if (park) setPark(park)
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setIsAdd(true);
    setPark(undefined);
  };

  return (
    <DialogContext.Provider value={{ isOpen, isAdd, park, openDialog, closeDialog }}>
      {children}
    </DialogContext.Provider>
  );
};

export const useAddUpdateParkDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};