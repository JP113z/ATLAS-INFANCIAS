import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type FeatureCollection = {
  type: "FeatureCollection";
  features: any[];
};

type School = { id: number; name: string; city?: string | null };
type User = { id: number; username: string; gender?: string | null };

type Props = {
  onBack: () => void;
}

export default function MapView() {
  const center: [number, number] = [9.9347, -84.0875];
  const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

  const [data, setData] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  //  opciones para selects  
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  //  filtros 
  const [category, setCategory] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [schoolId, setSchoolId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  // tipo de fecha
  const [datePreset, setDatePreset] = useState<string>(""); // hoy, ultimos_7, ultimos_30
  const [dateFrom, setDateFrom] = useState<string>(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState<string>("");     // YYYY-MM-DD

  // Cargar listas
  useEffect(() => {
    // Aqui es para que eventualmlente sea con poner el nombre 
    Promise.all([
      fetch(`${API_URL}/schools`).then(r => (r.ok ? r.json() : [])),
      fetch(`${API_URL}/users`).then(r => (r.ok ? r.json() : [])),
    ])
      .then(([schoolsData, usersData]) => {
        setSchools(schoolsData);
        setUsers(usersData);
      })
      .catch(() => {
      });
  }, [API_URL]);

  // Construir URL 
  const url = useMemo(() => {
    const params = new URLSearchParams();

    if (category) params.set("category", category);
    if (gender) params.set("gender", gender);
    if (schoolId) params.set("school_id", schoolId);
    if (userId) params.set("user_id", userId);

    // Si hay rango manual, usamos date_from/date_to si no, usamos date_preset.
    if (dateFrom || dateTo) {
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      // y limpiamos preset para evitar mezclas raras
    } else if (datePreset) {
      params.set("date_preset", datePreset);
    }

    const qs = params.toString();
    return `${API_URL}/stickers${qs ? `?${qs}` : ""}`;
  }, [API_URL, category, gender, schoolId, userId, datePreset, dateFrom, dateTo]);

  // Actualiza el mapa cuando cambian filtros porque cambia url
  useEffect(() => {
    setError(null);
    setLoading(true);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [url]);

  const clearFilters = () => {
    setCategory("");
    setGender("");
    setSchoolId("");
    setUserId("");
    setDatePreset("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%" }}>
      {/* Sidebar izquierda */}
      <aside
        style={{
          width: 300,
          padding: 12,
          borderRight: "1px solid #ddd",
          background: "#fafafa",
          overflowY: "auto",
        }}
      >
        
        <h3 style={{ marginTop: 0 }}>Filtros</h3>

        {/* Tipo de calcomanía */}
        <div style={{ marginBottom: 12 }}>
          <label>Tipo (categoría)</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: "100%", padding: 6 }}
          >@            <option value="">(todas)</option>
            <option value="transito">Tránsito</option>
            <option value="recreacion">Recreación</option>
            <option value="riesgo">Riesgo</option>
            <option value="afecto">Afecto</option>
          </select>
        </div>

        {/* Género */}
        <div style={{ marginBottom: 12 }}>
          <label>Género</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={{ width: "100%", padding: 6 }}
          >
            <option value="">(todos)</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="prefiero_no_decir">Prefiero no decir</option>
          </select>
        </div>

        {/* Escuela */}
        <div style={{ marginBottom: 12 }}>
          <label>Escuela</label>
          {schools.length > 0 ? (
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              style={{ width: "100%", padding: 6 }}
            >
              <option value="">(todas)</option>
              {schools.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name} {s.city ? `- ${s.city}` : ""}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              min={1}
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              placeholder="ID de escuela (ej: 1)"
              style={{ width: "100%", padding: 6 }}
            />
          )}
        </div>

        {/* Usuario */}
        <div style={{ marginBottom: 12 }}>
          <label>Usuario</label>
          {users.length > 0 ? (
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{ width: "100%", padding: 6 }}
            >
              <option value="">(todos)</option>
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.username} {u.gender ? `(${u.gender})` : ""}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              min={1}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="ID de usuario (ej: 1)"
              style={{ width: "100%", padding: 6 }}
            />
          )}
        </div>

        {/* Tipo de fecha */}
        <div style={{ marginBottom: 12 }}>
          <label>Fecha (preset)</label>
          <select
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value);
              // si selecciona preset, borramos rango
              setDateFrom("");
              setDateTo("");
            }}
            style={{ width: "100%", padding: 6 }}
          >
            <option value="">(sin filtro)</option>
            <option value="hoy">Hoy</option>
            <option value="ultimos_7">Últimos 7 días</option>
            <option value="ultimos_30">Últimos 30 días</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Rango manual</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setDatePreset("");
              }}
              style={{ flex: 1, padding: 6 }}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setDatePreset("");
              }}
              style={{ flex: 1, padding: 6 }}
            />
          </div>
          <small style={{ color: "#666" }}>Si usas rango, ignora el preset.</small>
        </div>

        <button onClick={clearFilters} style={{ width: "100%", padding: 8 }}>
          Limpiar filtros
        </button>

        <div style={{ marginTop: 12, fontSize: 12, color: "#444" }}>
          {loading ? "Cargando..." : data ? `Stickers: ${data.features.length}` : ""}
          {error ? <div style={{ color: "crimson" }}>Error: {error}</div> : null}
        </div>
      </aside>

      {/* Mapa se actualiza cuando cambian filtros */}
      <main style={{ flex: 1 }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {error && (
            <Popup position={center}>
              Error cargando stickers: {error}
            </Popup>
          )}

          {data && (
            <GeoJSON
              key={JSON.stringify(data.features.map(f => f.properties?.id))}
              data={data as any}
              onEachFeature={(feature, layer) => {
                const props = feature.properties || {};
                const content = `
                  <b>Sticker</b><br/>
                  ID: ${props.id ?? "?"}<br/>
                  Categoría: ${props.category ?? "?"}<br/>
                  Escuela: ${props.school_id ?? "?"}<br/>
                  Usuario: ${props.user_id ?? "?"}<br/>
                  Género: ${props.gender ?? "?"}<br/>
                  Fecha: ${props.created_at ?? "?"}
                `;
                layer.bindPopup(content);
              }}
            />
          )}
        </MapContainer>
        
      </main>
    </div>
  );
}