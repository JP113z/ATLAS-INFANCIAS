import type {
  LoginRequest,
  RegisterRequest,
  User,
  UserUpdate,
  School,
  FeatureCollection,
  StickerFilters,
  Comment,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";


const TOKEN_KEY = "token";

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


export type LoginResponse = {
  requires_2fa: boolean;
  challenge_id: string | null;
  access_token: string | null;
  token_type: string | null;
};

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
};

export type VerifyOtpRequest = {
  challenge_id: string;
  code: string;
};


export async function loginStep1(data: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await handleResponse<LoginResponse>(res);

  if (!result.requires_2fa && result.access_token) {
    localStorage.setItem(TOKEN_KEY, result.access_token);
  }

  return result;
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

export async function recoverPassword(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/recover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function resetPassword(token: string, new_password: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/recover/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password }),
  });
  return handleResponse(res);
}


export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}



export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}



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
  const res = await fetch(`${API_URL}/user/me`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if(!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Error eliminando cuenta");
  }
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/stickers/user`, {
    headers: authHeaders(),
  });
  return handleResponse<User[]>(res);
}


export async function blockUser(userId: number, blocked: boolean) {
  const res = await fetch(`${API_URL}/auth/users/${userId}/block`, {   // 👈 /auth
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ blocked }),
  });
  return handleResponse<{ ok: boolean; blocked: boolean }>(res);
}



export async function getSchools(): Promise<School[]> {
  const res = await fetch(`${API_URL}/stickers/schools`);
  if (!res.ok) return [];
  return res.json();
}


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


// ─── Comentarios (RF_37, RF_40, RF_42–RF_44) ─────────────────────────────────

/** Obtener comentarios de un sticker */
export async function getComments(stickerId: number): Promise<Comment[]> {
  const res = await fetch(`${API_URL}/stickers/${stickerId}/comments`);
  if (!res.ok) return [];
  return res.json();
}

/** Agregar comentario a un sticker (requiere login) */
export async function addComment(stickerId: number, content: string): Promise<Comment> {
  const res = await fetch(`${API_URL}/stickers/${stickerId}/comments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  return handleResponse<Comment>(res);
}

/** Eliminar comentario — solo admins (RF_40) */
export async function deleteComment(stickerId: number, commentId: number): Promise<void> {
  const res = await fetch(`${API_URL}/stickers/${stickerId}/comments/${commentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error eliminando comentario");
}

// ─── Perfil de usuario ────────────────────────────────────────────────────────

export async function updateMyUsername(username: string): Promise<{ message: string; username: string }> {
  const res = await fetch(`${API_URL}/user/me/username`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ username }),
  });

  return handleResponse(res);
}

export async function updateMyPassword(
  current_password: string,
  new_password: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/user/me/password`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ current_password, new_password }),
  });

  return handleResponse(res);
}
export async function requestEmailChange(new_email: string, current_password: string): Promise<{ message: string; challenge_id: string; pending_email: string }> {
  const res = await fetch(`${API_URL}/user/me/email/request`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ new_email, current_password }),
  });
  return handleResponse(res);
}

export async function confirmEmailChange(challenge_id: string, code: string): Promise<{ message: string; email: string }> {
  const res = await fetch(`${API_URL}/user/me/email/confirm`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ challenge_id, code }),
  });
  return handleResponse(res);
}
