"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin } from "lucide-react"

interface LocationSearchProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void
}

export function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const searchLocation = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      // Utiliser l'API Nominatim d'OpenStreetMap pour la géocodage
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const result = data[0]
        onLocationSelect(Number.parseFloat(result.lat), Number.parseFloat(result.lon), result.display_name)
      } else {
        alert("Aucun résultat trouvé pour cette recherche")
      }
    } catch (error) {
      console.error("Erreur lors de la recherche:", error)
      alert("Erreur lors de la recherche")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchLocation()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Rechercher une adresse ou un lieu..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button type="submit" disabled={loading}>
        <Search className="h-4 w-4 mr-2" />
        {loading ? "Recherche..." : "Rechercher"}
      </Button>
    </form>
  )
}
