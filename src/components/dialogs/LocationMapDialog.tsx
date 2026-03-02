"use client";

import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type LatLng = { lat: number; lng: number };

const OSMMap = dynamic(() => import("@/components/maps/OSMMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-md bg-muted" />,
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: LatLng;
  title?: string;
  zoom?: number;
};

export function LocationMapDialog({
  open,
  onOpenChange,
  position,
  title = "Position sur la carte",
  zoom = 17,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="h-[60vh] w-full overflow-hidden rounded-lg border">
          <OSMMap position={position} zoom={zoom} className="h-full w-full" />
        </div>

        <div className="text-sm text-muted-foreground">
          lat: {position.lat}, lng: {position.lng}
        </div>
      </DialogContent>
    </Dialog>
  );
}
