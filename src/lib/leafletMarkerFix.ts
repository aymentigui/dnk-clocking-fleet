import L from "leaflet";

export function fixLeafletDefaultIcon() {
  // Évite le bug des chemins d’images du marker en bundlers modernes
  // @ts-expect-error private prop access used for fix
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  });
}
