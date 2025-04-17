"use client";

import { createContext, useContext, useState } from "react";

type Device = {
  id: string;
  code: string;
  username: string;
  password: string;
  park: string;
  parkId: string;
  type: number;
};

type DialogContextType = {
  isOpen: boolean;
  isAdd: boolean;
  device?: Device;
  openDialog: (isAdd?: boolean, device?: Device) => void;
  closeDialog: () => void;
};

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const AddUpdateDeviceDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(true);
  const [device, setDevice] = useState<Device>();

  const openDialog = (isAdd?: boolean, device?: Device) => {
    if (isAdd !== undefined) setIsAdd(isAdd);
    if (device) setDevice(device)
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setIsAdd(true);
    setDevice(undefined);
  };

  return (
    <DialogContext.Provider value={{ isOpen, isAdd, device, openDialog, closeDialog }}>
      {children}
    </DialogContext.Provider>
  );
};

export const useAddUpdateDeviceDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};