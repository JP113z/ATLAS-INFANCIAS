/* ───────────────────────────────────────────────
   Servicio API — ATLAS Infancias
   
   Centraliza todas las llamadas al backend FastAPI.
   Ajustá las rutas si tu backend usa prefijos distintos
   (por ejemplo /api/v1/...).
   ─────────────────────────────────────────────── */

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  UserUpdate,
  School,
  FeatureCollection,
  StickerFilters,
  Comment,
  VoteSession,
  VoteResults,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

// ─── Helpers ───


export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}


function authHeaders(): HeadersInit {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.detail || body.message || `Error HTTP ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

// ─── Auth ───

const TOKEN_KEY = "token";
/*
export async function login(data: LoginRequest): Promise<AuthResponse> {
  // FastAPI OAuth2 espera form-data, no JSON
  const formData = new URLSearchParams();
  formData.append("username", data.email); // OAuth2PasswordRequestForm usa "username"
  formData.append("password", data.password);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  const result = await handleResponse<AuthResponse>(res);
  localStorage.setItem(TOKEN_KEY, result.access_token);
  return result;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await handleResponse<AuthResponse>(res);
  localStorage.setItem(TOKEN_KEY, result.access_token);
  return result;
}
*/


export async function loginStep1(data: LoginRequest): Promise<LoginStep1Response> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return handleResponse<LoginStep1Response>(res);
}

export async function verifyOtp(data: VerifyOtpRequest): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/auth/2fa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await handleResponse<TokenResponse>(res);
  localStorage.setItem(TOKEN_KEY, result.access_token);
  return result;
}

export async function register(data: RegisterRequest): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return handleResponse<{ message: string }>(res);
}

/*

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<AuthResponse>(res);
}

export async function register(data: RegisterRequest): Promise<User> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<User>(res);
}
*/
export async function recoverPassword(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/recover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}


export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}



export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}



// ─── Usuario actual ───

export async function getMe(): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  });
  return handleResponse<User>(res);
}

export async function updateMe(data: UserUpdate): Promise<User> {
  const res = await fetch(`${API_URL}/users/me`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<User>(res);
}

export async function deleteMe(): Promise<void> {
  const res = await fetch(`${API_URL}/users/me`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Error eliminando cuenta");
  }
}

// ─── Usuarios (admin) ───

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/stickers/user`, {
    headers: authHeaders(),
  });
  return handleResponse<User[]>(res);
}

export async function blockUser(userId: number): Promise<void> {
  const res = await fetch(`${API_URL}/users/${userId}/block`, {
    method: "PUT",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Error bloqueando usuario");
  }
}

// ─── Escuelas ───

export async function getSchools(): Promise<School[]> {
  const res = await fetch(`${API_URL}/stickers/schools`);
  if (!res.ok) return [];
  return res.json();
}

// ─── Stickers (GeoJSON) ───

export async function getStickers(filters: StickerFilters = {}): Promise<FeatureCollection> {
  const params = new URLSearchParams();

  if (filters.category) params.set("category", filters.category);
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.school_id) params.set("school_id", filters.school_id);
  if (filters.user_id) params.set("user_id", filters.user_id);

  if (filters.date_from || filters.date_to) {
    if (filters.date_from) params.set("date_from", filters.date_from);
    if (filters.date_to) params.set("date_to", filters.date_to);
  } else if (filters.date_preset) {
    params.set("date_preset", filters.date_preset);
  }

  const qs = params.toString();
  const res = await fetch(`${API_URL}/stickers${qs ? `?${qs}` : ""}`);
  return handleResponse<FeatureCollection>(res);
}

export async function uploadGeoJSON(
  file: File
): Promise<{ inserted: number; skipped: number; skipped_details?: any[]; message: string }> {
  const formData = new FormData();
  formData.append("file", file);


  const token = getToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_URL}/geojson/import`, {
    method: "POST",
    headers,
    body: formData,
  });

  return handleResponse(res);
}

export async function downloadGeoJSON(filters: StickerFilters = {}): Promise<Blob> {
  const params = new URLSearchParams();

  // El backend /geojson/export solo acepta estos filtros :
  if (filters.category) params.set("category", filters.category);
  if (filters.school_id) params.set("school_id", String(filters.school_id));
  if (filters.user_id) params.set("user_id", String(filters.user_id));

  params.set("download", "true");

  const qs = params.toString();

  const token = getToken();
  const headers: HeadersInit = {
    Accept: "application/geo+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_URL}/geojson/export${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error descargando GeoJSON (HTTP ${res.status})`);
  }

  return await res.blob();
}

// ─── Comentarios ───

export async function getComments(stickerId: number): Promise<Comment[]> {
  const res = await fetch(`${API_URL}/stickers/${stickerId}/comments`);
  if (!res.ok) return [];
  return res.json();
}

export async function addComment(stickerId: number, content: string): Promise<Comment> {
  const res = await fetch(`${API_URL}/stickers/${stickerId}/comments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  return handleResponse<Comment>(res);
}

export async function deleteComment(stickerId: number, commentId: number): Promise<void> {
  const res = await fetch(`${API_URL}/stickers/${stickerId}/comments/${commentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error eliminando comentario");
}

// ─── Votaciones ───

export async function createVoteSession(stickerId: number, question: string): Promise<VoteSession> {
  const res = await fetch(`${API_URL}/votes`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ sticker_id: stickerId, question }),
  });
  return handleResponse<VoteSession>(res);
}

export async function getVoteSession(code: string): Promise<VoteSession> {
  const res = await fetch(`${API_URL}/votes/${code}`);
  return handleResponse<VoteSession>(res);
}

export async function submitVote(code: string, answer: boolean): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/votes/${code}/answer`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ answer }),
  });
  return handleResponse(res);
}

export async function getVoteResults(code: string): Promise<VoteResults> {
  const res = await fetch(`${API_URL}/votes/${code}/results`);
  return handleResponse<VoteResults>(res);
}

export async function endVoteSession(code: string): Promise<void> {
  const res = await fetch(`${API_URL}/votes/${code}/end`, {
    method: "PUT",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error finalizando votación");
}

export async function getActiveVoters(code: string): Promise<{ count: number }> {
  const res = await fetch(`${API_URL}/votes/${code}/voters`);
  return handleResponse(res);
}

export type LoginStep1Response = {
  requires_2fa: boolean;
  challenge_id: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
};

export type VerifyOtpRequest = {
  challenge_id: string;
  code: string;
};