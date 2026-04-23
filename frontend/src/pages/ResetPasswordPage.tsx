import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import * as api from "../services/api";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Token inválido o faltante
  if (!token) {
    return (
      <PageLayout>
        <div className="page-center">
          <div className="card fade-in" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, marginBottom: 12 }}>
              Enlace inválido
            </h2>
            <p style={{ fontSize: 14, marginBottom: 24 }}>
              Este enlace de recuperación no es válido o ya expiró.
            </p>
            <button className="btn btn-primary" onClick={() => navigate("/recuperar")}>
              Solicitar nuevo enlace
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Error al restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PageLayout>
        <div className="page-center">
          <div className="card fade-in" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, marginBottom: 12 }}>
              ¡Contraseña actualizada!
            </h2>
            <p style={{ fontSize: 14, marginBottom: 24 }}>
              Tu contraseña fue cambiada correctamente. Ya puedes iniciar sesión.
            </p>
            <button className="btn btn-primary" onClick={() => navigate("/login")}>
              Ir al login
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="page-center">
        <div className="card fade-in" style={{ maxWidth: 480, width: "100%" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, marginBottom: 4 }}>
            Nueva contraseña
          </h2>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 24 }}>
            Ingresa tu nueva contraseña para recuperar el acceso
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={onSubmit}>
            <label className="label">Nueva contraseña</label>
            <input
              className="input"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoFocus
            />

            <label className="label" style={{ marginTop: 16 }}>Confirmar contraseña</label>
            <input
              className="input"
              type="password"
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              className="btn btn-primary btn-block"
              type="submit"
              style={{ padding: 14, fontSize: 15, marginTop: 28 }}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
