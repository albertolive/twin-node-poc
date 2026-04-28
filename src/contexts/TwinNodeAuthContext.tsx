"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  identity: string | null;
  error: string | null;
};

type TwinNodeAuthContextType = {
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
} & AuthState;

const TwinNodeAuthContext = createContext<TwinNodeAuthContextType | undefined>(
  undefined
);

export const useTwinNodeAuth = () => {
  const context = useContext(TwinNodeAuthContext);
  if (!context) {
    throw new Error("useTwinNodeAuth must be used within TwinNodeAuthProvider");
  }
  return context;
};

type TwinNodeAuthProviderProps = {
  children: ReactNode;
};

export const TwinNodeAuthProvider = ({
  children,
}: TwinNodeAuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    identity: null,
    error: null,
  });

  const checkAuth = async () => {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/twin-node/verify", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // If response is not OK, try to parse error message, but don't fail if it's not JSON
        let data: { valid: boolean; error?: string; identity?: string };
        try {
          data = (await response.json()) as {
            valid: boolean;
            error?: string;
            identity?: string;
          };
        } catch {
          // If JSON parsing fails, create a default response
          data = {
            valid: false,
            error: `Request failed with status ${response.status}`,
          };
        }

        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          identity: null,
          error: data.error || null,
        }));
        return;
      }

      const data = (await response.json()) as {
        valid: boolean;
        error?: string;
        identity?: string;
      };

      if (data.valid) {
        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          identity: data.identity || prev.identity,
          error: null,
        }));
      } else {
        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          identity: null,
          error: data.error || null,
        }));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.name === "AbortError"
            ? "Request timeout - please check your connection"
            : error.message
          : "Failed to verify authentication";

      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch("/api/twin-node/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as {
        success: boolean;
        identity?: string;
        error?: string;
      };

      if (data.success) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          identity: data.identity || null,
          error: null,
        });
        return { success: true };
      } else {
        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          error: data.error || "Login failed",
        }));
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/twin-node/logout", {
        method: "POST",
      });
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        identity: null,
        error: null,
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state even if API call fails
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        identity: null,
        error: null,
      });
    }
  };

  useEffect(() => {
    void checkAuth();
  }, []);

  const contextValue = useMemo(
    () => ({
      ...authState,
      login,
      logout,
      checkAuth,
    }),
    [authState, login, logout, checkAuth]
  );

  return (
    <TwinNodeAuthContext value={contextValue}>{children}</TwinNodeAuthContext>
  );
};
