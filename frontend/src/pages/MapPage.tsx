import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
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
  riesgo:    "#E53935",
  afecto:    "#E91E90",
  recreacion: "#4CAF50",
  transito:  "#FDD835",
};


const CATEGORY_ICONS: Record<string, string> = {
  peligroso: "/assets/peligroso.png",
  riesgo:    "/assets/peligroso.png",   // alias: la BD usa "riesgo"
  recreacion: "/assets/recreativo.png",
  afecto: "/assets/afecto.png",
  transito: "/assets/transito.png",
};


// ─── Crear ícono de segun foto ───

function createMarkerIcon(category: string) {
  const iconUrl = CATEGORY_ICONS[category?.toLowerCase()];

  return L.icon({
    iconUrl: iconUrl ?? "/assets/transito.png",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}



const BASEMAPS = {
  osm: {
    name: "Mapa estándar",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap",
  },
  dark: {
    name: "Oscuro",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CARTO",
  },
  light: {
    name: "Claro",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CARTO",
  },
  satellite: {
    name: "Satélite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
  },
};


// ─── Legend ───
function MapLegend() {
  const items = [
    { label: "Riesgo / Peligroso", color: CATEGORY_COLORS.riesgo },
    { label: "Afecto",             color: CATEGORY_COLORS.afecto },
    { label: "Recreación",         color: CATEGORY_COLORS.recreacion },
    { label: "Tránsito",           color: CATEGORY_COLORS.transito },
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
  const [filters, setFilters] = useState<StickerFilters>({});
  const [selectedSticker, setSelectedSticker] = useState<StickerProperties | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [basemap, setBasemap] = useState<keyof typeof BASEMAPS>("osm");


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
    api.getStickers(filters)
      .then(setData)
      .catch(() => {});
  }, [filters]);

  // Key para forzar re-render del GeoJSON
  const geoJsonKey = useMemo(() => {
    if (!data) return "empty";
    return JSON.stringify(data.features.map((f) => f.properties?.id));
  }, [data]);


 
  return (
    <PageLayout noFooter>
      {/* Botón toggle de filtros — fuera del map-layout para no romper la cadena de alturas */}
      {isMobile && (
        <div className="map-mobile-toggle">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {Icons.filter} {sidebarOpen ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>
      )}

      <div className="map-layout">
        {sidebarOpen && (
          <FiltersSidebar filters={filters} onFiltersChange={setFilters} />
        )}

        <div className="map-container">

          {/* Basemap selector */}
          <div style={{ position: "absolute", top: 12, right: 12, zIndex: 500 }}>
            <select
              className="input"
              value={basemap}
              onChange={(e) => setBasemap(e.target.value as any)}
            >
              {Object.entries(BASEMAPS).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
          </div>

          <MapContainer center={center} zoom={14} style={{ width: "100%", height: "100%", minHeight: 300 }}>
            <TileLayer
              url={BASEMAPS[basemap].url}
              attribution={BASEMAPS[basemap].attribution}
            />

            {data && (
              <GeoJSON
                key={geoJsonKey}
                data={data as any}

                pointToLayer={(feature, latlng) => {
                  const category = feature.properties?.category || "";
                  return L.marker(latlng, {
                    icon: createMarkerIcon(category),
                  });
                }}

                onEachFeature={(feature, layer) => {
                  layer.on("click", () => {
                    setSelectedSticker(feature.properties as StickerProperties);
                  });
                }}
              />
            )}
          </MapContainer>

          <MapLegend />

          {selectedSticker && (
            <StickerPopup
              sticker={selectedSticker}
              onClose={() => setSelectedSticker(null)}
              onFilterChange={(f) => {
                setFilters(f);
                setSelectedSticker(null);
                // En mobile, abrimos el sidebar para que el usuario vea el filtro activo
                if (isMobile) setSidebarOpen(true);
              }}
            />
          )}
        </div>
      </div>
      <Footer />
    </PageLayout>
  );
}
