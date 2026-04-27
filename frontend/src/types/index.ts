/* ───────────────────────────────────────────────
   Tipos compartidos — ATLAS Infancias
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
  created_at?: string; 
  school?: {
    id: number;
    name: string;
    city?: string;
  };
  user?: {
    id: number;
    username: string;
  };
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

// ─── Filtros del mapa ───
export interface StickerFilters {
  category?: string;
  gender?: string;
  school_id?: string;
  user_id?: string;
  date_preset?: string;
  date_from?: string;
  date_to?: string;
}

// ─── Comentarios ───
export interface Comment {
  id: number;
  sticker_id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
}

// ─── Votaciones ───
export interface VoteSession {
  id: number;
  code: string;
  sticker_id: number;
  question: string;
  active: boolean;
  created_by: number;
  created_at: string;
}

export interface VoteAnswer {
  question: string;
  answer: boolean;
}

export interface VoteResults {
  question: string;
  total: number;
  in_favor: number;
  against: number;
  percent_favor: number;
  percent_against: number;
}
