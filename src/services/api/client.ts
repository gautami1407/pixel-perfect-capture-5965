const TOKEN_KEY = "lps_access_token";

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function imageFileUrl(imageId: string, processed = false) {
  const token = getToken();
  const params = new URLSearchParams();
  if (processed) params.set("processed", "true");
  if (token) params.set("access_token", token);
  return `${API_BASE}/images/${imageId}/file?${params.toString()}`;
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) return JSON.stringify(body.detail);
    return response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (response.status === 204) return undefined as T;
  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response));
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return (await response.json()) as T;
  return undefined as T;
}

export async function apiBlob(path: string): Promise<Blob> {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { headers });
  if (!response.ok) throw new ApiError(response.status, await parseError(response));
  return response.blob();
}
