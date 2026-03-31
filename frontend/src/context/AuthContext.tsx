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

  /**
   * Paso 1: valida password.
   * Retorna true si login fue directo (verified=true en BD).
   * Retorna false si requiere 2FA (verified=false).
   */
  handleLogin: (email: string, password: string) => Promise<boolean>;

  handleVerifyOtp: (code: string) => Promise<void>;
  handleUpdateUsername: (username: string) => Promise<void>;
  handleUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  handleRequestEmailChange: (newEmail: string, currentPassword: string) => Promise<void>;
  handleConfirmEmailChange: (code: string) => Promise<void>;


  emailChangeChallengeId: string | null;
  pendingNewEmail: string | null;

  handleRegister: (
    username: string,
    email: string,
    password: string,
    gender?: string
  ) => Promise<void>;

  handleLogout: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;

  requires2FA: boolean;
  challengeId: string | null;
  pendingEmail: string | null;
  cancel2FA: () => void;
}

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

  const [requires2FA, setRequires2FA] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const [emailChangeChallengeId, setEmailChangeChallengeId] = useState<string | null>(null);
  const [pendingNewEmail, setPendingNewEmail] = useState<string | null>(null);

  useEffect(() => {
    if (api.isAuthenticated()) {
      api
        .getMe()
        .then(setUser)
        .catch(() => {
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
    }
  }, []);

  const handleUpdateUsername = useCallback(
  async (username: string) => {
    setError(null);
    setLoading(true);

    try {
      await api.updateMyUsername(username);
      await refreshUser(); // para que el UI muestre el nuevo username
    } catch (err: any) {
      setError(err.message || "Error al actualizar el nombre de usuario");
      throw err;
    } finally {
      setLoading(false);
    }
  },
  [refreshUser]
);

const handleRequestEmailChange = useCallback(async (newEmail: string, currentPassword: string) => {
  setError(null);
  setLoading(true);
  try {
    const resp = await api.requestEmailChange(newEmail, currentPassword);
    setEmailChangeChallengeId(resp.challenge_id);
    setPendingNewEmail(resp.pending_email);
  } catch (err: any) {
    setError(err.message || "No se pudo solicitar el cambio de correo");
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

const handleConfirmEmailChange = useCallback(async (code: string) => {
  if (!emailChangeChallengeId) {
    const e = new Error("No hay solicitud de cambio de correo pendiente.");
    setError(e.message);
    throw e;
  }

  setError(null);
  setLoading(true);
  try {
    await api.confirmEmailChange(emailChangeChallengeId, code);
    setEmailChangeChallengeId(null);
    setPendingNewEmail(null);
    await refreshUser();
  } catch (err: any) {
    setError(err.message || "Código inválido o expirado");
    throw err;
  } finally {
    setLoading(false);
  }
}, [emailChangeChallengeId, refreshUser]);

const handleUpdatePassword = useCallback(
  async (currentPassword: string, newPassword: string) => {
    setError(null);
    setLoading(true);

    try {
      await api.updateMyPassword(currentPassword, newPassword);


    } catch (err: any) {
      setError(err.message || "Error al actualizar la contraseña");
      throw err;
    } finally {
      setLoading(false);
    }
  },
  []
);

  const handleLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);

    try {
      const resp = await api.loginStep1({ email, password });

      if (!resp.requires_2fa && resp.access_token) {
        const me = await api.getMe();
        setUser(me);
        setLoading(false);
        return true;
      }

      setRequires2FA(true);
      setChallengeId(resp.challenge_id);
      setPendingEmail(email);
      setLoading(false);
      return false;

    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
      setLoading(false);
      throw err;
    }
  }, []);

  const handleVerifyOtp = useCallback(async (code: string) => {
    if (!challengeId) {
      const e = new Error("No hay challenge_id. Inicia sesión de nuevo.");
      setError(e.message);
      throw e;
    }

    setError(null);
    setLoading(true);

    try {
      await api.verifyOtp({ challenge_id: challengeId, code });

      const me = await api.getMe();
      setUser(me);

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


  const handleRegister = useCallback(
    async (username: string, email: string, password: string, gender?: string) => {
      setError(null);
      setLoading(true);
      try {
        await api.register({ username, email, password, gender });
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
        handleUpdateUsername,
        handleUpdatePassword,
        handleRequestEmailChange,
        handleConfirmEmailChange,
        emailChangeChallengeId,
        pendingNewEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}