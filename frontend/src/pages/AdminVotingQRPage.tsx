import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLayout from "../components/PageLayout";
import { Icons } from "../components/Navbar";
import * as api from "../services/api";

export default function AdminVotingQRPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [voterCount, setVoterCount] = useState(0);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef<number | null>(null);

  // Proteger: solo admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/mapa");
    }
  }, [user, navigate]);

  // Polling de votantes activos cada 5 segundos
  useEffect(() => {
    if (!code) return;

    const fetchVoters = () => {
      api.getActiveVoters(code)
        .then((data) => setVoterCount(data.count))
        .catch(() => {});
    };

    fetchVoters();
    intervalRef.current = window.setInterval(fetchVoters, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [code]);

  const handleEnd = async () => {
    if (!code) return;
    if (!confirm("¿Finalizar esta votación? Los participantes ya no podrán votar.")) return;
    setEnding(true);
    try {
      await api.endVoteSession(code);
      navigate(`/votacion/${code}/resultados`);
    } catch (err: any) {
      setError(err.message || "Error finalizando votación");
      setEnding(false);
    }
  };

  // URL para QR (en producción usarías una librería como qrcode.react)
  const votingUrl = `${window.location.origin}/votacion/${code}`;

  return (
    <PageLayout>
      <div className="page-center">
        <div className="card fade-in" style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
          <a
            onClick={() => navigate("/mapa")}
            className="back-link"
            style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 6, fontSize: 16, fontWeight: 700, marginBottom: 24 }}
          >
            {Icons.back} Volver
          </a>

          {error && <div className="alert alert-error">{error}</div>}

          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 20 }}>Código QR</h3>

          {/* QR Code — usando API externa para generar QR real */}
          <div style={{
            width: 200, height: 200, margin: "0 auto 20px",
            background: "var(--color-white)", border: "3px solid var(--color-text)",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
          }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(votingUrl)}`}
              alt="QR Code"
              width={180}
              height={180}
              style={{ imageRendering: "pixelated" }}
              onError={(e) => {
                // Fallback si no hay internet
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.innerHTML += '<div style="font-size:13px;color:#888;padding:16px">QR no disponible sin internet.<br/>Usa el código de abajo.</div>';
              }}
            />
            <div style={{
              position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
              background: "var(--color-text)", color: "var(--color-white)",
              padding: "2px 12px", borderRadius: "0 0 6px 6px", fontSize: 11, fontWeight: 700,
            }}>
              SCAN ME!
            </div>
          </div>

          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-secondary)" }}>
            Código de la votación
          </p>
          <div style={{
            background: "var(--color-white)", border: "1px solid var(--color-border)",
            borderRadius: 8, padding: "10px 24px", fontSize: 22, fontWeight: 700,
            letterSpacing: 3, display: "inline-block", margin: "4px 0 8px",
            fontFamily: "monospace", userSelect: "all", cursor: "text",
          }}>
            {code}
          </div>

          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 20 }}>
            Compartí este código o el QR para que los participantes se unan
          </p>

          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
            Votantes actuales: <strong style={{ color: "var(--color-olive)" }}>{voterCount}</strong>
          </p>

          <button
            className="btn btn-olive"
            onClick={handleEnd}
            disabled={ending}
            style={{ padding: "10px 28px", fontSize: 15, marginTop: 12 }}
          >
            {ending ? "Finalizando..." : "Finalizar votación"}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
