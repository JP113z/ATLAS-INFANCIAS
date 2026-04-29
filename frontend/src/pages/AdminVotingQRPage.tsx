import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLayout from "../components/PageLayout";
import * as api from "../services/api";

const VOTING_DURATION_SECONDS = 20 * 60; // 20 minutos

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function AdminVotingQRPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [voterCount, setVoterCount] = useState(0);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(VOTING_DURATION_SECONDS);

  const pollIntervalRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // Proteger: solo admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/mapa");
    }
  }, [user, navigate]);

  const endSession = useCallback(async (auto: boolean) => {
    if (!code || ending) return;
    if (!auto && !confirm("¿Finalizar esta votación? Los participantes ya no podrán votar.")) return;

    setEnding(true);

    // Limpiar intervals antes de navegar
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    try {
      await api.endVoteSession(code);
      navigate(`/votacion/${code}/resultados`);
    } catch (err: any) {
      setError(err.message || "Error finalizando votación");
      setEnding(false);
    }
  }, [code, ending, navigate]);

  // Polling de votantes activos cada 5 segundos
  useEffect(() => {
    if (!code) return;

    const fetchVoters = () => {
      api.getActiveVoters(code)
        .then((data) => setVoterCount(data.count))
        .catch(() => {});
    };

    fetchVoters();
    pollIntervalRef.current = window.setInterval(fetchVoters, 5000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [code]);

  // Countdown de 20 minutos — cierra automáticamente al llegar a 0
  useEffect(() => {
    countdownRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          endSession(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [endSession]);

  const votingUrl = `${window.location.origin}/votacion/${code}`;

  const timerColor =
    timeLeft <= 60 ? "var(--color-red)" :
    timeLeft <= 120 ? "#f59e0b" :
    "var(--color-text)";

  return (
    <PageLayout>
      <div className="page-center">
        <div className="card fade-in" style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>

          {error && <div className="alert alert-error">{error}</div>}

          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 20 }}>Código QR</h3>

          {/* QR Code */}
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
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.innerHTML +=
                  '<div style="font-size:13px;color:#888;padding:16px">QR no disponible sin internet.<br/>Usa el código de abajo.</div>';
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

          {/* Contador regresivo */}
          <div style={{
            background: "var(--color-white)", border: `2px solid ${timerColor}`,
            borderRadius: 10, padding: "8px 20px", display: "inline-block",
            marginBottom: 16, transition: "border-color 0.5s",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 2 }}>
              Tiempo restante
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", color: timerColor, transition: "color 0.5s" }}>
              {formatTime(timeLeft)}
            </div>
            {timeLeft <= 120 && (
              <div style={{ fontSize: 11, color: timerColor, marginTop: 2 }}>
                {timeLeft <= 60 ? "¡La votación se cerrará pronto!" : "Menos de 2 minutos"}
              </div>
            )}
          </div>

          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
            Votantes actuales: <strong style={{ color: "var(--color-olive)" }}>{voterCount}</strong>
          </p>

          <button
            className="btn btn-olive"
            onClick={() => endSession(false)}
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
