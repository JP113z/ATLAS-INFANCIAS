import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PageLayout, { Footer } from "../components/PageLayout";
import FiltersSidebar from "../components/FiltersSidebar";
import StickerPopup from "../components/StickerPopup";
import { Icons } from "../components/Navbar";
import type { FeatureCollection, StickerFilters, StickerProperties } from "../types";
import * as api from "../services/api";

// ─── Colores por categoría ───
const CATEGORY_COLORS: Record<string, string> = {
  riesgo: "#E53935",
  peligroso: "#E53935",
  afecto: "#E91E90",
  recreacion: "#4CAF50",
  transito: "#FDD835",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category?.toLowerCase()] || "#999";
}

// ─── Crear ícono de marcador SVG por categoría ───
function createMarkerIcon(category: string) {
  const color = getCategoryColor(category);
  const svg = `
    <svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.27 21.73 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="6" fill="#fff"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
  });
}

// ─── Legend ───
function MapLegend() {
  const items = [
    { label: "Peligroso", color: CATEGORY_COLORS.riesgo },
    { label: "Afecto", color: CATEGORY_COLORS.afecto },
    { label: "Recreación", color: CATEGORY_COLORS.recreacion },
    { label: "Tránsito", color: CATEGORY_COLORS.transito },
  ];

  return (
    <div style={{
      position: "absolute", bottom: 24, right: 24, background: "var(--color-card)",
      borderRadius: 12, padding: "12px 16px", fontSize: 13, boxShadow: "var(--shadow-sm)",
      zIndex: 400, fontFamily: "var(--font-body)",
    }}>
      {items.map(({ label, color }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── MapPage ───
export default function MapPage() {
  const center: [number, number] = [9.9347, -84.0875];

  const [data, setData] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StickerFilters>({});
  const [selectedSticker, setSelectedSticker] = useState<StickerProperties | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive check
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Cargar stickers cuando cambian filtros
  useEffect(() => {
    setError(null);
    setLoading(true);
    api.getStickers(filters)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  // Key para forzar re-render del GeoJSON
  const geoJsonKey = useMemo(() => {
    if (!data) return "empty";
    return JSON.stringify(data.features.map((f) => f.properties?.id));
  }, [data]);

  return (
    <PageLayout noFooter>
      <div className="map-layout" style={{ flex: 1 }}>
        {/* Mobile filter toggle */}
        {isMobile && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ margin: "8px 16px", alignSelf: "flex-start", zIndex: 450 }}
          >
            {Icons.filter} {sidebarOpen ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        )}

        {/* Sidebar */}
        {sidebarOpen && (
          <FiltersSidebar filters={filters} onFiltersChange={setFilters} />
        )}

        {/* Map */}
        <div className="map-container">
          {/* Loading/Error overlay */}
          {loading && (
            <div style={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              background: "var(--color-white)", padding: "8px 16px", borderRadius: 8,
              boxShadow: "var(--shadow-sm)", zIndex: 450, fontSize: 13,
              fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 8,
            }}>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Cargando stickers...
            </div>
          )}

          {error && (
            <div style={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              zIndex: 450,
            }}>
              <div className="alert alert-error" style={{ marginBottom: 0 }}>Error: {error}</div>
            </div>
          )}

          {/* Sticker count */}
          {data && !loading && (
            <div style={{
              position: "absolute", top: 12, left: 12,
              background: "var(--color-white)", padding: "6px 12px", borderRadius: 8,
              boxShadow: "var(--shadow-sm)", zIndex: 400, fontSize: 12,
              fontFamily: "var(--font-body)", fontWeight: 600,
            }}>
              {data.features.length} sticker{data.features.length !== 1 ? "s" : ""}
            </div>
          )}

          <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={center} icon={createMarkerIcon("afecto")} />



            {data && (
              <GeoJSON
                key={geoJsonKey}
                data={data as any}
                pointToLayer={(feature, latlng) => {
                  const category = feature.properties?.category || "";
                  return L.marker(latlng, { icon: createMarkerIcon(category) });
                }}
                onEachFeature={(feature, layer) => {
                  // Al hacer click, abrimos el popup personalizado
                  layer.on("click", () => {
                    setSelectedSticker(feature.properties as StickerProperties);
                  });

                  // Tooltip rápido al hover
                  const props = feature.properties || {};
                  layer.bindTooltip(
                    `${props.category || "Sticker"} #${props.id || "?"}`,
                    { direction: "top", offset: [0, -30] }
                  );
                }}
              />
            )}
          </MapContainer>

          <MapLegend />

          {/* Custom Sticker Popup */}
          {selectedSticker && (
            <StickerPopup
              sticker={selectedSticker}
              onClose={() => setSelectedSticker(null)}
            />
          )}
        </div>
      </div>
      <Footer />
    </PageLayout>
  );
}
