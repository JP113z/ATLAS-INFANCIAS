import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icons } from "./Navbar";
import type { School, User, StickerFilters } from "../types";
import * as api from "../services/api";

interface FiltersSidebarProps {
  filters: StickerFilters;
  onFiltersChange: (filters: StickerFilters) => void;
}

export default function FiltersSidebar({ filters, onFiltersChange }: FiltersSidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [uploading, setUploading] = useState(false);

  // Cargar escuelas y usuarios para los selects
    useEffect(() => {
      (async () => {
        try {
          const data = await api.getSchools();
          console.log("Schools:", data);
          setSchools(data);
        } catch (e) {
          console.error("Error loading schools:", e);
        }

        if (user) {
          try {
            const dataUsers = await api.getUsers();
            console.log("Users:", dataUsers);
            setUsers(dataUsers);
          } catch (e) {
            console.error("Error loading users:", e);
          }
        }
      })();
    }, [user]);

const updateFilter = (key: keyof StickerFilters, value: string) => {
  const next = { ...filters, [key]: value || undefined };
  onFiltersChange(next);
};


  const clearFilters = () => {
    onFiltersChange({});
  };

  const handleDownload = async () => {
    try {
      const blob = await api.downloadGeoJSON(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stickers.geojson";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Error descargando: " + err.message);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.uploadGeoJSON(file);
      alert(`${result.message}\nInsertados: ${result.inserted}\nOmitidos: ${result.skipped}`);
      // Refrescar filtros para recargar mapa
      onFiltersChange({ ...filters });
    } catch (err: any) {
      alert("Error cargando: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isDisabled = !user;

  return (
    <div className="map-sidebar fade-in">
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        {Icons.filter} Filtros de Búsqueda
      </h3>

      {/* Tipo de Sticker */}
      <label className="label">{Icons.gear} Tipo de Sticker</label>
      <select
        className="input"
        style={{ marginBottom: 16, cursor: isDisabled ? "not-allowed" : "pointer" }}
        value={filters.category || ""}
        onChange={(e) => updateFilter("category", e.target.value)}
        disabled={isDisabled}
      >
        <option value="">(todas)</option>
        <option value="transito">Tránsito</option>
        <option value="recreacion">Recreación</option>
        <option value="riesgo">Riesgo / Peligroso</option>
        <option value="afecto">Afecto</option>
      </select>

      {/* Usuario */}
      <label className="label">{Icons.user} Usuario</label>
      {users.length > 0 ? (
        <select
          className="input"
          style={{ marginBottom: 16 }}
          value={filters.user_id || ""}
          onChange={(e) => updateFilter("user_id", e.target.value)}
          disabled={isDisabled}
        >
          <option value="">(todos)</option>
          {users.map((u) => (
            <option key={u.id} value={String(u.id)}>
              {u.username}
            </option>
          ))}
        </select>
      ) : (
        <select className="input" style={{ marginBottom: 16 }} disabled={isDisabled}>
          <option value="">(todos)</option>
        </select>
      )}

      {/* Escuela */}
      <label className="label">{Icons.school} Escuela</label>
      <select
        className="input"
        style={{ marginBottom: 16 }}
        value={filters.school_id || ""}
        onChange={(e) => updateFilter("school_id", e.target.value)}
        disabled={isDisabled}
      >
        <option value="">(todas)</option>
        {schools.map((s) => (
          <option key={s.id} value={String(s.id)}>
            {s.name} {s.city ? `- ${s.city}` : ""}
          </option>
        ))}
      </select>
        {/* Rango de fechas */}
        <label className="label">{Icons.calendar} Fecha</label>

        <input
          className="input"
          type="date"
          style={{ marginBottom: 8 }}
          value={filters.date_from || ""}
          onChange={(e) => updateFilter("date_from", e.target.value)}
          disabled={isDisabled}
        />

        <input
          className="input"
          type="date"
          style={{ marginBottom: 16 }}
          value={filters.date_to || ""}
          onChange={(e) => updateFilter("date_to", e.target.value)}
          disabled={isDisabled}
        />

      {/* Género */}
      <label className="label">{Icons.user} Género</label>
      <select
        className="input"
        style={{ marginBottom: 20 }}
        value={filters.gender || ""}
        onChange={(e) => updateFilter("gender", e.target.value)}
        disabled={isDisabled}
      >
        <option value="">(todos)</option>
        <option value="masculino">Masculino</option>
        <option value="femenino">Femenino</option>
        <option value="prefiero_no_decir">Prefiero no decir</option>
      </select>

      {/* Botones */}
      <div style={{ marginTop: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {!user ? (
          <button className="btn btn-primary btn-block" onClick={() => navigate("/login")}>
            Inicia sesión para filtrar
          </button>
        ) : (
          <>
            {user.role === "admin" && (
              <>
                <button className="btn btn-olive btn-sm" style={{ flex: "1 1 45%" }} onClick={handleDownload}>
                  Descargar geoJSON
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: "1 1 45%" }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Cargando..." : "Cargar geoJSON"}
                </button>
                <input ref={fileInputRef} type="file" accept=".geojson,.json" style={{ display: "none" }} onChange={handleUpload} />
              </>
            )}
            <button className="btn btn-primary btn-sm" style={{ flex: "1 1 45%" }} onClick={clearFilters}>
              Reiniciar filtros
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: "1 1 45%" }} onClick={() => onFiltersChange({ ...filters })}>
              Aplicar filtros
            </button>
          </>
        )}
      </div>
    </div>
  );
}
