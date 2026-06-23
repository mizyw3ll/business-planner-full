import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "../../api";
import { fetchCsrfToken, stopCsrfRefresh } from "../../api";
import { queryKeys } from "../../lib/queryClient";
import * as authApi from "./authApi";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signin: (login: string, password: string) => Promise<void>;
  signup: (payload: {
    email: string;
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<void>;
  signout: () => Promise<void>;
  requestVerify: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Fire-and-forget CSRF refresh — don't block auth
      fetchCsrfToken().catch(() => {});

      try {
        const cached = queryClient.getQueryData<User>(queryKeys.user);
        if (cached) {
          if (!cancelled) {
            setUser(cached);
          }
          return;
        }
        // Retry until backend is ready.
        // Network errors (502/503/connection refused) = backend still starting → keep retrying.
        // 401 = backend says "not authenticated" → give up immediately.
        while (!cancelled) {
          try {
            const me = await authApi.me();
            if (!cancelled) {
              queryClient.setQueryData(queryKeys.user, me);
              setUser(me);
            }
            return;
          } catch (err: any) {
            const status = err?.response?.status;
            // Definitive 401 = user is not logged in, stop retrying
            if (status === 401) {
              if (!cancelled) {
                queryClient.removeQueries({ queryKey: queryKeys.user });
                setUser(null);
              }
              return;
            }
            // Network error or 5xx = backend not ready, keep retrying
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      stopCsrfRefresh();
    };
  }, [queryClient]);

  const signin = useCallback(
    async (login: string, password: string) => {
      await authApi.login(login, password);
      const me = await authApi.me();
      queryClient.setQueryData(queryKeys.user, me);
      setUser(me);
    },
    [queryClient],
  );

  const signup = useCallback(
    async (payload: { email: string; username: string; password: string; first_name?: string; last_name?: string }) => {
      await authApi.register(payload);
      await signin(payload.email, payload.password);
    },
    [signin],
  );

  const signout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors — clear client state regardless
    }
    queryClient.removeQueries({ queryKey: queryKeys.user });
    setUser(null);
  }, [queryClient]);

  const requestVerify = useCallback(async () => {
    await authApi.requestVerification();
  }, []);

  const value = useMemo(
    () => ({ user, loading, signin, signup, signout, requestVerify, setUser }),
    [user, loading, signin, signup, signout, requestVerify],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
