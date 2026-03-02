"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useEffect } from "react";
import { fixLeafletDefaultIcon } from "@/lib/leafletMarkerFix";

export type LatLng = { lat: number; lng: number };

type Props = {
  position: LatLng;
  zoom?: number;
  className?: string;
};

export default function OSMMap({ position, zoom = 15, className }: Props) {
  useEffect(() => {
    fixLeafletDefaultIcon();
  }, []);

  return (
    <div className={className}>
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[position.lat, position.lng]} />
      </MapContainer>
    </div>
  );
}
