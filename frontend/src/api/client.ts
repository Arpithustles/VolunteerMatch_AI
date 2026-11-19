const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export type ApiError = { detail?: string; message?: string };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("vm_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data: unknown = await res.json();
      if (typeof data === "object" && data !== null) {
        const errorBody = data as { detail?: unknown; message?: unknown };
        const candidate = errorBody.detail ?? errorBody.message;
        if (typeof candidate === "string") {
          detail = candidate;
        } else if (Array.isArray(candidate)) {
          detail = candidate.map((item: unknown) => {
            if (typeof item === "object" && item !== null && "msg" in item && typeof item.msg === "string") {
              return item.msg;
            }
            return JSON.stringify(item) ?? String(item);
          }).join(", ");
        }
      }
    } catch {}
    if (res.status === 401) {
      localStorage.removeItem("vm_token");
      localStorage.removeItem("vm_user");
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  base: BASE,
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T,>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T,>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const qs = (params: Record<string, unknown>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};
