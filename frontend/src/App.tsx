import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RecoverPage from "./pages/RecoverPage";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";
import AdminUsersPage from "./pages/AdminUsersPage";
import TwoFactorPage from "./pages/TwoFactorPage";
import EmailVerifyPage from "./pages/EmailVerifyPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VotingJoinPage from "./pages/VotingJoinPage";
import VotingQuestionPage from "./pages/VotingQuestionPage";
import VotingResultsPage from "./pages/VotingResultsPage";
import AdminVotingQRPage from "./pages/AdminVotingQRPage";

// Styles
import "./styles/global.css";

/**
 * Ruta protegida — redirige a /login si no hay sesión.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Ruta solo para admin — redirige a /mapa si no es admin.
 */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/mapa" replace />;
  }

  return <>{children}</>;
}

/**
 * Si el usuario ya inició sesión, redirige al mapa
 * (para landing, login, registro).
 */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/mapa" replace />;
  }

  return <>{children}</>;
}
function TwoFactorRoute({ children }: { children: React.ReactNode }) {
  const { loading, challengeId } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!challengeId) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function EmailChangeRoute({ children }: { children: React.ReactNode }) {
  const { loading, emailChangeChallengeId } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!emailChangeChallengeId) {
    return <Navigate to="/perfil" replace />;
  }

  return <>{children}</>;
}
function AppRoutes() {
  return (
    <Routes>
      {/* ─── Rutas públicas (redirigen al mapa si ya logueado) ─── */}
      <Route
        path="/"
        element={
          <GuestRoute>
            <LandingPage />
          </GuestRoute>
        }
      />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/2fa"
        element={
          <TwoFactorRoute>
              <TwoFactorPage />
           </TwoFactorRoute>
          }
/>

      <Route
        path="/registro"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route path="/recuperar" element={<RecoverPage />} />
      <Route path="/recuperar/nueva-contrasena" element={<ResetPasswordPage />} />

      {/* ─── Mapa — accesible para todos (visitante + logueado) ─── */}
      <Route path="/mapa" element={<MapPage />} />

      {/* ─── Rutas protegidas (requieren login) ─── */}
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/verificar-correo"
        element={
          <ProtectedRoute>
            <EmailChangeRoute>
              <EmailVerifyPage />
            </EmailChangeRoute>
          </ProtectedRoute>
        }
      />

      {/* ─── Admin only ─── */}
      <Route
        path="/admin/usuarios"
        element={
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/votacion/:code"
        element={
          <AdminRoute>
            <AdminVotingQRPage />
          </AdminRoute>
        }
      />

      {/* ─── Votaciones — accesibles para todos ─── */}
      <Route path="/votacion/unirse" element={<VotingJoinPage />} />
      <Route path="/votacion/:code" element={<VotingQuestionPage />} />
      <Route path="/votacion/:code/resultados" element={<VotingResultsPage />} />

      {/* ─── 404 ─── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
