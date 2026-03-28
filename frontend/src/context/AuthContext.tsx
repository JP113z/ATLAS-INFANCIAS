/* ───────────────────────────────────────────────
   AuthContext — manejo de sesión con JWT
   ─────────────────────────────────────────────── */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "../types";
import * as api from "../services/api";


interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;

  /** Login Paso 1: valida password y obtiene challenge_id */
  handleLogin: (email: string, password: string) => Promise<void>;

  /** Verificación paso 2: valida OTP y obtiene token + user */
  handleVerifyOtp: (code: string) => Promise<void>;

  /** Registro: solo crea cuenta ) */
  handleRegister: (
    username: string,
    email: string,
    password: string,
    gender?: string
  ) => Promise<void>;

  /** Cerrar sesión */
  handleLogout: () => void;

  /** Recarga perfil del usuario */
  refreshUser: () => Promise<void>;

  /** Limpia error */
  clearError: () => void;

  /** Para saber si hay un 2FA pendiente */
  requires2FA: boolean;

  /** Para la pantalla OTP */
  challengeId: string | null;
  pendingEmail: string | null;

  /** Cancela el flujo 2FA (por si el usuario se arrepiente) */
  cancel2FA: () => void;
}

//interface AuthState {
//  user: User | null;
//  loading: boolean;
//  error: string | null;
//  /** Inicia sesión y carga el perfil automáticamente */
//  handleLogin: (email: string, password: string) => Promise<void>;
//  /** Registra y luego logea automáticamente */
//  handleRegister: (
//    username: string,
//    email: string,
//    password: string,
//    gender?: string
//  ) => Promise<void>;
//  /** Cierra sesión y limpia todo */
//  handleLogout: () => void;
//  /** Recarga el perfil del usuario (por ej. después de editar) */
//  refreshUser: () => Promise<void>;
//  /** Limpia el error manualmente */
//  clearError: () => void;
//}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 2FA state ---
  const [requires2FA, setRequires2FA] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Al montar, revisamos si hay token guardado y cargamos perfil
  useEffect(() => {
/*
    // ─── DEV MODE: Comentar esto cuando el backend esté listo ───
    const DEV_MODE = true; // cambiar a false cuando tengas backend

    if (DEV_MODE) {
      setUser({
        id: 1,
        username: "dev_user",
        email: "dev@test.com",
        role: "admin",  // cambiá a "user" para probar vista de usuario normal
        verified: true,
        gender: "masculino",
      });
      setLoading(false);
      return;
    }
    // ─── FIN DEV MODE ───
*/
     //Si el backend ya está listo, descomenta el bloque de abajo y comenta el bloque de DEV_MODE 
    if (api.isAuthenticated()) {
      api
        .getMe()
        .then(setUser)
        .catch(() => {
          // Token inválido o expirado
          api.logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
      
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.getMe();
      setUser(me);
    } catch {
      // silencioso
    }
  }, []);
/**
  const handleLogin = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await api.login({ email, password });
      const me = await api.getMe();
      setUser(me);
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
*/

  /** Login Step 1 */
  const handleLogin = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      // Paso 1: backend devuelve challenge_id
      const resp = await api.loginStep1({ email, password });

      // resp: { requires_2fa: true, challenge_id: "..." }
      setRequires2FA(true);
      setChallengeId(resp.challenge_id);
      setPendingEmail(email);


    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Verify Step 2 */
  const handleVerifyOtp = useCallback(async (code: string) => {
    if (!challengeId) {
      const e = new Error("No hay challenge_id. Inicia sesión de nuevo.");
      setError(e.message);
      throw e;
    }

    setError(null);
    setLoading(true);

    try {
      // Paso 2: backend devuelve token y api.verifyOtp lo guarda 
      await api.verifyOtp({ challenge_id: challengeId, code });

      // Con token guardado, obtenemos el perfil
      const me = await api.getMe();
      setUser(me);

      // Limpiar estado 2FA
      setRequires2FA(false);
      setChallengeId(null);
      setPendingEmail(null);
    } catch (err: any) {
      setError(err.message || "Código inválido o expirado");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

/**
  const handleRegister = useCallback(
    async (username: string, email: string, password: string, gender?: string) => {
      setError(null);
      setLoading(true);
      try {
        await api.register({ username, email, password, gender });
        // Después de registrar, logeamos automáticamente
        await api.login({ email, password });
        const me = await api.getMe();
        setUser(me);
      } catch (err: any) {
        setError(err.message || "Error al registrarse");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );
*/


 const handleRegister = useCallback(
    async (username: string, email: string, password: string, gender?: string) => {
      setError(null);
      setLoading(true);
      try {
        await api.register({ username, email, password, gender });
        // Redirigimos a login
      } catch (err: any) {
        setError(err.message || "Error al registrarse");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const cancel2FA = useCallback(() => {
    setRequires2FA(false);
    setChallengeId(null);
    setPendingEmail(null);
    setError(null);
  }, []);

  const handleLogout = useCallback(() => {
    api.logout();
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);
/*
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        handleLogin,
        handleRegister,
        handleLogout,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );*/
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        handleLogin,
        handleVerifyOtp,
        handleRegister,
        handleLogout,
        refreshUser,
        clearError,
        requires2FA,
        challengeId,
        pendingEmail,
        cancel2FA,
      }}
    >
      {children}
    </AuthContext.Provider>
  );

}
