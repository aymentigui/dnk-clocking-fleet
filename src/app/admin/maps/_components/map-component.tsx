"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix pour les icônes par défaut de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

export function MapComponent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialiser la carte
    const map = L.map(mapRef.current).setView([48.8566, 2.3522], 13) // Paris par défaut

    // Ajouter les tuiles OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    // Ajouter quelques marqueurs d'exemple
    const markers = [
      {
        position: [48.8566, 2.3522] as [number, number],
        title: "Paris",
        description: "La capitale de la France",
      },
      {
        position: [48.8584, 2.2945] as [number, number],
        title: "Tour Eiffel",
        description: "Monument emblématique de Paris",
      },
      {
        position: [48.8606, 2.3376] as [number, number],
        title: "Louvre",
        description: "Musée le plus visité au monde",
      },
    ]

    markers.forEach((marker) => {
      L.marker(marker.position).addTo(map).bindPopup(`<b>${marker.title}</b><br>${marker.description}`)
    })

    // Ajouter un cercle d'exemple
    L.circle([48.8566, 2.3522], {
      color: "red",
      fillColor: "#f03",
      fillOpacity: 0.2,
      radius: 1000,
    })
      .addTo(map)
      .bindPopup("Zone de 1km autour du centre de Paris")

    mapInstanceRef.current = map

    // Nettoyage lors du démontage du composant
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return <div ref={mapRef} className="w-full h-full" style={{ minHeight: "400px" }} />
}
