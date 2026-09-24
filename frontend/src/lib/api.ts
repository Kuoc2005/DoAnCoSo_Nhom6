/** Base URL API — để trống khi dev (proxy Vite `/api` → backend). Production: `https://api.example.com` */
export function getApiUrl(path: string): string {
  const base = import.meta.env.VITE_API_URL ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p;
  return `${base.replace(/\/$/, "")}${p}`;
}

/**
 * WebSocket hỗ trợ — dev: proxy Vite `/ws` → backend (cùng host với front).
 * Production: nếu có `VITE_API_URL` thì dùng host của API.
 */
export function getWsChatUrl(token: string): string {
  const enc = encodeURIComponent(token);
  const base = import.meta.env.VITE_API_URL ?? "";
  if (base) {
    try {
      const u = new URL(base);
      const wsProto = u.protocol === "https:" ? "wss:" : "ws:";
      return `${wsProto}//${u.host}/ws/chat?token=${enc}`;
    } catch {
      /* fall through */
    }
  }
  const wsProto = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = typeof window !== "undefined" ? window.location.host : "";
  return `${wsProto}//${host}/ws/chat?token=${enc}`;
}
/**
 * Gọi API kèm Bearer (từ localStorage) và cookie refresh.
 * Tự thử `/api/auth/refresh` một lần khi 401.
 */
export async function apiFetch(path: string, options: RequestInit = {}, retried = false): Promise<Response> {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem("accessToken");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(getApiUrl(path), {
    ...options,
    headers,
    credentials: "include",
  });

  if (
    res.status === 401 &&
    !retried &&
    !path.startsWith("/api/auth/signin") &&
    !path.startsWith("/api/auth/signup") &&
    path !== "/api/auth/refresh"
  ) {
    const r = await fetch(getApiUrl("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
    });
    if (r.ok) {
      const data = (await r.json()) as { accessToken: string };
      localStorage.setItem("accessToken", data.accessToken);
      return apiFetch(path, options, true);
    }
    localStorage.removeItem("accessToken");
  }

  return res;
}
