import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: "Administrador" | "Supervisor" | "Agente";
};

type AuthContextValue = {
  user: SessionUser | null;
  ready: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = "zolmyra.session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as SessionUser);
    } finally {
      setReady(true);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      async signIn(email, password, remember) {
        await new Promise((resolve) => setTimeout(resolve, 550));
        if (!email.includes("@") || password.length < 6) {
          throw new Error("Revisa tu correo y usa una contraseña de al menos 6 caracteres.");
        }
        const next: SessionUser = {
          id: "usr_demo_admin",
          name: email.split("@")[0]!.replace(/[._-]/g, " "),
          email,
          organization: "Zolmyra AI",
          role: "Administrador",
        };
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(SESSION_KEY, JSON.stringify(next));
        setUser(next);
      },
      signOut() {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        setUser(null);
        window.location.assign("/login");
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return context;
}
