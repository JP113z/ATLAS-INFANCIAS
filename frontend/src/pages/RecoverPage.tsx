import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Navbar";
import PageLayout from "../components/PageLayout";
import * as api from "../services/api";

export default function RecoverPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Ingresa tu correo electrónico");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.recoverPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Error al enviar el enlace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="page-center">
        <div className="card fade-in" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <a onClick={() => navigate("/")} className="back-link" style={{ textAlign: "left", display: "block" }}>← Volver al inicio</a>
          <div style={{ color: "var(--color-text)" }}>{Icons.mail}</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: "12px 0 4px" }}>Recuperar contraseña</h2>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 24 }}>
            Ingresa tu correo para recibir instrucciones
          </p>

          {error && <div className="alert alert-error">{error}</div>}
          {sent && <div className="alert alert-success">Revisa tu correo para el enlace de recuperación.</div>}

          {!sent && (
            <form onSubmit={onSubmit} style={{ textAlign: "left" }}>
              <label className="label">Correo Electrónico</label>
              <input className="input" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn btn-primary btn-block" type="submit" style={{ padding: 14, fontSize: 15, marginTop: 28 }} disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>
            </form>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
