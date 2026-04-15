/* ───────────────────────────────────────────────
   Tipos compartidos — ATLAS Infancias · Sprint 1
   ─────────────────────────────────────────────── */

// ─── Auth ───
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  gender?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// ─── Usuarios ───
export interface User {
  id: number;
  username: string;
  email: string;
  gender?: string | null;
  role: "user" | "admin";
  verified: boolean;
  blocked: boolean;
  created_at?: string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  password?: string;
}

// ─── Escuelas ───
export interface School {
  id: number;
  name: string;
  city?: string | null;
}

// ─── Stickers ───
export interface StickerProperties {
  id: number;
  category: string;
  user_id?: number | null;
  school_id?: number | null;
  gender?: string | null;
  created_at?: string;
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: StickerProperties;
}

export interface FeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// ─── Filtros del mapa (RF_01–RF_06) ───
export interface StickerFilters {
  category?: string;
  gender?: string;
  school_id?: string;
  user_id?: string;
  date_preset?: string;
  date_from?: string;
  date_to?: string;
}
