"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { LocationSearch } from "./location-search"
import { Button } from "@/components/ui/button"
import { Navigation, Layers, Bus } from "lucide-react"

// Fix pour les icônes par défaut de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

const busData = [
  {
    id: 1,
    line: "Ligne 1",
    route: "Bab El Oued - El Harrach",
    lat: 36.7538,
    lng: 3.0588,
    status: "En service",
    nextStop: "Place des Martyrs",
  },
  {
    id: 2,
    line: "Ligne 5",
    route: "Hydra - Rouiba",
    lat: 36.7372,
    lng: 3.0731,
    status: "En service",
    nextStop: "Grande Poste",
  },
  {
    id: 3,
    line: "Ligne 12",
    route: "Kouba - Birtouta",
    lat: 36.7628,
    lng: 3.042,
    status: "En retard",
    nextStop: "1er Mai",
  },
  {
    id: 4,
    line: "Ligne 8",
    route: "Bouzareah - Dar El Beida",
    lat: 36.7489,
    lng: 3.0456,
    status: "En service",
    nextStop: "Audin",
  },
  {
    id: 5,
    line: "Ligne 15",
    route: "Cheraga - Reghaia",
    lat: 36.7311,
    lng: 3.0512,
    status: "En service",
    nextStop: "Port Said",
  },
]

export function AdvancedMapComponent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [currentLayer, setCurrentLayer] = useState<"osm" | "satellite">("osm")
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [showBuses, setShowBuses] = useState(false)
  const busMarkersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current).setView([36.7538, 3.0588], 13)

    // Couches de cartes
    const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    })

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: '© <a href="https://www.esri.com/">Esri</a>',
        maxZoom: 19,
      },
    )

    // Ajouter la couche par défaut
    osmLayer.addTo(map)

    mapInstanceRef.current = map

    // Nettoyage lors du démontage du composant
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    if (!mapInstanceRef.current) return

    mapInstanceRef.current.setView([lat, lng], 15)
    L.marker([lat, lng]).addTo(mapInstanceRef.current).bindPopup(name).openPopup()
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par ce navigateur")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation([latitude, longitude])

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15)
          L.marker([latitude, longitude]).addTo(mapInstanceRef.current).bindPopup("Votre position actuelle").openPopup()
        }
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error)
        alert("Impossible d'obtenir votre position")
      },
    )
  }

  const toggleLayer = () => {
    if (!mapInstanceRef.current) return

    const newLayer = currentLayer === "osm" ? "satellite" : "osm"

    // Supprimer toutes les couches
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current!.removeLayer(layer)
      }
    })

    // Ajouter la nouvelle couche
    if (newLayer === "osm") {
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)
    } else {
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: '© <a href="https://www.esri.com/">Esri</a>',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)
    }

    setCurrentLayer(newLayer)
  }

  const createBusIcon = (status: string) => {
    const color = status === "En service" ? "#22c55e" : "#ef4444"
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">🚌</div>
      `,
      className: "custom-bus-icon",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })
  }

  const toggleBuses = () => {
    if (!mapInstanceRef.current) return

    if (showBuses) {
      // Supprimer tous les marqueurs de bus
      busMarkersRef.current.forEach((marker) => {
        mapInstanceRef.current!.removeLayer(marker)
      })
      busMarkersRef.current = []
    } else {
      // Ajouter les marqueurs de bus
      busData.forEach((bus) => {
        const marker = L.marker([bus.lat, bus.lng], {
          icon: createBusIcon(bus.status),
        })
          .bindPopup(`
          <div style="font-family: system-ui; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: bold;">${bus.line}</h3>
            <p style="margin: 4px 0; color: #4b5563;"><strong>Route:</strong> ${bus.route}</p>
            <p style="margin: 4px 0; color: #4b5563;"><strong>Statut:</strong> 
              <span style="color: ${bus.status === "En service" ? "#22c55e" : "#ef4444"}; font-weight: bold;">
                ${bus.status}
              </span>
            </p>
            <p style="margin: 4px 0; color: #4b5563;"><strong>Prochain arrêt:</strong> ${bus.nextStop}</p>
          </div>
        `)
          .addTo(mapInstanceRef.current!)

        busMarkersRef.current.push(marker)
      })
    }

    setShowBuses(!showBuses)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1">
          <LocationSearch onLocationSelect={handleLocationSelect} />
        </div>
        <div className="flex gap-2">
          <Button onClick={getCurrentLocation} variant="outline">
            <Navigation className="h-4 w-4 mr-2" />
            Ma position
          </Button>
          <Button onClick={toggleLayer} variant="outline">
            <Layers className="h-4 w-4 mr-2" />
            {currentLayer === "osm" ? "Satellite" : "Carte"}
          </Button>
          <Button onClick={toggleBuses} variant={showBuses ? "default" : "outline"}>
            <Bus className="h-4 w-4 mr-2" />
            {showBuses ? "Masquer bus" : "Afficher bus"}
          </Button>
        </div>
      </div>

      <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg border">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  )
}
