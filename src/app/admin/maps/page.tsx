import { MapComponent } from "./_components/map-component";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">OpenStreetMap avec Next.js</h1>
          <p className="text-muted-foreground text-lg">Carte interactive utilisant OpenStreetMap et Leaflet</p>
        </div>

        <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg border">
          <MapComponent />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-2">Carte Interactive</h3>
            <p className="text-muted-foreground">Naviguez sur la carte avec la souris ou les contrôles tactiles</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-2">Marqueurs</h3>
            <p className="text-muted-foreground">Cliquez sur les marqueurs pour voir les informations</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-2">Open Source</h3>
            <p className="text-muted-foreground">Utilise OpenStreetMap, une alternative libre à Google Maps</p>
          </div>
        </div>
      </div>
    </main>
  )
}
