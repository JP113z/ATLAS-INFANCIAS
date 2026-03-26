import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLayout from "../components/PageLayout";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { handleRegister, error, clearError, loading } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [localError, setLocalError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (!username.trim() || !email.trim() || !password.trim()) {
      setLocalError("Completa todos los campos obligatorios");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setLocalError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      await handleRegister(username, email, password, gender || undefined);
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
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 4 }}>Registrarse</h2>
          <p style={{ fontSize: 14, color: "var(--color-text)", fontWeight: 600, marginBottom: 24 }}>
            Ingresa tu información para crear tu cuenta
          </p>

          {displayError && <div className="alert alert-error">{displayError}</div>}

          <form onSubmit={onSubmit}>
            <label className="label">Nombre de usuario</label>
            <input className="input" placeholder="tu_usuario" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />

            <label className="label" style={{ marginTop: 16 }}>Correo Electrónico</label>
            <input className="input" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />

            <label className="label" style={{ marginTop: 16 }}>Contraseña</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />

            <label className="label" style={{ marginTop: 16 }}>Confirmar Contraseña</label>
            <input className="input" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />

            <label className="label" style={{ marginTop: 16 }}>Genero</label>
            <select className="input" value={gender} onChange={(e) => setGender(e.target.value)} style={{ cursor: "pointer" }}>
              <option value="">Elegir</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
              <option value="prefiero_no_decir">Prefiero no decir</option>
            </select>

            <button className="btn btn-primary btn-block" type="submit" style={{ padding: 14, fontSize: 16, marginTop: 28 }} disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 14, marginTop: 16 }}>
            ¿Ya tienes cuenta?{" "}
            <a onClick={() => navigate("/login")} className="link">Inicia sesión aquí</a>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
