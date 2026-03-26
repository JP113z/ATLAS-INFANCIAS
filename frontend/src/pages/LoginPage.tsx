import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLayout from "../components/PageLayout";

export default function LoginPage() {
  const navigate = useNavigate();
  const { handleLogin, error, clearError, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalError("Completa todos los campos");
      return;
    }

    try {
      await handleLogin(email, password);
      navigate("/mapa");
    } catch {
      // El error ya se setea en AuthContext
    }
  };

  const displayError = localError || error;

  return (
    <PageLayout>
      <div className="page-center">
        <div className="card fade-in" style={{ maxWidth: 480, width: "100%" }}>
          <a onClick={() => navigate("/")} className="back-link">← Volver al inicio</a>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 4 }}>Iniciar Sesión</h2>
          <p style={{ fontSize: 14, color: "var(--color-text)", fontWeight: 600, marginBottom: 24 }}>
            Ingresa tus credenciales para acceder a la plataforma
          </p>

          {displayError && <div className="alert alert-error">{displayError}</div>}

          <form onSubmit={onSubmit}>
            <label className="label">Correo Electrónico</label>
            <input
              className="input"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <label className="label" style={{ marginTop: 16 }}>Contraseña</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <a onClick={() => navigate("/recuperar")} className="link" style={{ fontSize: 13, display: "block", marginTop: 6 }}>
              ¿Olvidaste tu contraseña?
            </a>

            <button className="btn btn-primary btn-block" type="submit" style={{ padding: 14, fontSize: 16, marginTop: 24 }} disabled={loading}>
              {loading ? "Ingresando..." : "Inicia Sesión"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 14, marginTop: 16 }}>
            ¿No tienes cuenta?{" "}
            <a onClick={() => navigate("/registro")} className="link">Regístrate aquí</a>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
