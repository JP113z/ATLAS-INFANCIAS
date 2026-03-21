import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function MapView() {
  const center: [number, number] = [9.9347, -84.0875]; // San José

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='© OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Sticker inventado  */}
        <Marker position={center}>
          <Popup>
            🎨 Sticker de prueba <br />
            ATLAS Infancias
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}