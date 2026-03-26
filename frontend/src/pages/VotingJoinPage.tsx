import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { Icons } from "../components/Navbar";
import * as api from "../services/api";

export default function VotingJoinPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Ingresa un código de sesión");
      return;
    }

    setError("");
    setLoading(true);
    try {
      // Verificar que la sesión existe y está activa
      const session = await api.getVoteSession(code.trim());
      if (!session.active) {
        setError("Esta votación ya finalizó");
        return;
      }
      // Navegar a la pregunta con el código
      navigate(`/votacion/${code.trim()}`);
    } catch (err: any) {
      setError(err.message || "Código de sesión no encontrado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="page-center">
        <div className="card fade-in" style={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
          <a onClick={() => navigate("/mapa")} className="back-link" style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 6, fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            {Icons.back} Volver
          </a>

          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 20 }}>¡Bienvenido a la votación!</h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleJoin}>
            <label className="label" style={{ justifyContent: "center" }}>Escribe el código de la sesión</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ej: xpf6hi"
              style={{ textAlign: "center", fontSize: 18, padding: "12px 16px", marginTop: 8, maxWidth: 280, margin: "8px auto 0" }}
            />
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 8 }}>Tu sesión y código QR se guardará</p>
            <button className="btn btn-olive" type="submit" style={{ padding: "10px 24px", fontSize: 15, marginTop: 12 }} disabled={loading}>
              {loading ? "Buscando..." : "Entrar"}
            </button>
          </form>

          <div style={{ marginTop: 24, borderTop: "1px solid var(--color-border-warm)", paddingTop: 20, fontSize: 14, color: "var(--color-text-secondary)" }}>
            O escanea el código QR que se ve en pantalla
            <br />
            <button className="btn btn-olive btn-sm" style={{ marginTop: 8 }} onClick={() => alert("Funcionalidad de escaneo QR pendiente de implementar con librería de cámara")}>
              Escanear QR
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
