import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type FeatureCollection = {
  type: "FeatureCollection";
  features: any[];
};

export default function MapView() {
  const center: [number, number] = [9.9347, -84.0875]; // San José
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/stickers")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='© OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Si hay error */}
        {error && (
          <Popup position={center}>
            Error cargando stickers: {error}
          </Popup>
        )}

        {/* Render GeoJSON */}
        {data && (
          <GeoJSON
            data={data as any}
            onEachFeature={(feature, layer) => {
              const props = feature.properties || {};
              const content = `
                <b>Sticker</b><br/>
                ID: ${props.id ?? "?"}<br/>
                Categoría: ${props.category ?? "?"}<br/>
                Escuela: ${props.school_id ?? "?"}
              `;
              layer.bindPopup(content);
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}