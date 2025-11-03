import { AdvancedMapComponent } from "./_components/advanced-map-component";

export default function AdvancedMapPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Carte Avancée</h1>
          <p className="text-muted-foreground text-lg">Fonctionnalités avancées avec recherche et géolocalisation</p>
        </div>

        <div className="w-full">
          <AdvancedMapComponent />
        </div>
      </div>
    </main>
  )
}
