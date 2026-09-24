import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/types/user";
import { apiFetch, getApiUrl } from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  signIn: (login: string, password: string) => Promise<AuthUser | null>;
  signUp: (payload: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    bio?: string;
  }) => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      return null;
    }
    const res = await apiFetch("/api/user/me");
    if (res.ok) {
      const data = (await res.json()) as { user: AuthUser };
      setUser(data.user);
      return data.user;
    }
    localStorage.removeItem("accessToken");
    setUser(null);
    return null;
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setReady(true));
  }, [refreshUser]);

  const signIn = useCallback(
    async (login: string, password: string): Promise<AuthUser | null> => {
      let res: Response;
      try {
        res = await fetch(getApiUrl("/api/auth/signin"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: login.trim(), password }),
        });
      } catch {
        throw new Error(
          "Không kết nối được API. Kiểm tra back-end đang chạy cổng 5001 và front-end dùng npm run dev (proxy /api)."
        );
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.message === "string" ? data.message : "Đăng nhập thất bại.");
      }
      const accessToken = data.accessToken as string | undefined;
      if (!accessToken) throw new Error("Không nhận được access token.");
      localStorage.setItem("accessToken", accessToken);
      return refreshUser();
    },
    [refreshUser]
  );

  const signUp = useCallback(
    async (payload: {
      username: string;
      email: string;
      password: string;
      displayName: string;
      bio?: string;
    }): Promise<AuthUser | null> => {
      let res: Response;
      try {
        res = await fetch(getApiUrl("/api/auth/signup"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        throw new Error(
          "Không kết nối được API. Chạy back-end (cd back-end && npm run dev), cổng 5001; front-end dùng npm run dev để proxy /api."
        );
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(typeof errBody.message === "string" ? errBody.message : `Đăng ký thất bại (${res.status}).`);
      }
      return signIn(payload.username, payload.password);
    },
    [signIn]
  );

  const signOut = useCallback(async () => {
    await fetch(getApiUrl("/api/auth/signout"), {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
      },
    }).catch(() => {});
    localStorage.removeItem("accessToken");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      signIn,
      signUp,
      signOut,
      refreshUser,
    }),
    [user, ready, signIn, signUp, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
