import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
  getMe,
  setTokens,
  clearTokens,
  type SignupPayload,
  type MeResponse,
} from "./api";

// ---- Types ----

export type User = MeResponse;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (payload: SignupPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ---- Context ----

const AuthContext = createContext<AuthContextType | null>(null);

// ---- Provider ----

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user from localStorage on initial load (avoids flash to login screen)
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored) as User);
      } catch {
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await apiLogin(email, password);
    setTokens(data.access_token, data.refresh_token);
    // Fetch authoritative user info from /auth/me
    const me = await getMe();
    localStorage.setItem("user", JSON.stringify(me));
    setUser(me);
    return me;
  };

  const signup = async (payload: SignupPayload): Promise<User> => {
    const data = await apiSignup(payload);
    setTokens(data.access_token);
    // Build user from signup response (no refresh token on signup per spec)
    const me: User = {
      user_id: data.user_id,
      email: data.email,
      full_name: payload.full_name,
      role: data.role,
    };
    localStorage.setItem("user", JSON.stringify(me));
    setUser(me);
    return me;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiLogout();
    } catch {
      // Clear locally even if the server call fails
    }
    clearTokens();
    setUser(null);
  };

  // Call this after profile updates that might change full_name etc.
  const refreshUser = async (): Promise<void> => {
    const me = await getMe();
    localStorage.setItem("user", JSON.stringify(me));
    setUser(me);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---- Hook ----

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
