import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PageLayout from "../components/PageLayout";
import type { VoteSession } from "../types";
import * as api from "../services/api";

//  Íconos por categoría (mismos PNG que el mapa principal)
const CATEGORY_ICONS: Record<string, string> = {
  peligroso: "/assets/peligroso.png",
  riesgo:    "/assets/peligroso.png",   // alias: la BD usa "riesgo"
  recreacion: "/assets/recreativo.png",
  afecto:    "/assets/afecto.png",
  transito:  "/assets/transito.png",
};

function createMarkerIcon(category?: string | null) {
  const iconUrl = CATEGORY_ICONS[(category ?? "").toLowerCase()];
  return L.icon({
    iconUrl: iconUrl ?? "/assets/transito.png",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

export default function VotingQuestionPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<VoteSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);

  const intervalRef = useRef<number | null>(null);

  // Carga inicial 
  useEffect(() => {
    if (!code) return;
    api.getVoteSession(code)
      .then((s) => {
        if (!s.active) {
          navigate(`/votacion/${code}/resultados`, { replace: true });
          return;
        }
        setSession(s);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [code, navigate]);

  // Redirige a resultados cuando el admin cierre la votación 
  useEffect(() => {
    if (!code || loading || error) return;

    intervalRef.current = window.setInterval(async () => {
      try {
        const s = await api.getVoteSession(code);
        if (!s.active) {
          navigate(`/votacion/${code}/resultados`, { replace: true });
        }
      } catch {}
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [code, loading, error, navigate]);

  const handleVote = async (answer: boolean) => {
    if (!code) return;
    setSubmitting(true);
    try {
      await api.submitVote(code, answer);
      setVoted(true);
    } catch (err: any) {
      setError(err.message || "Error al votar");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="page-center"><div className="spinner" /></div>
      </PageLayout>
    );
  }

  const hasLocation =
    session?.sticker_lat != null && session?.sticker_lon != null;

  return (
    <PageLayout>
      <div className="page-center">
        <div className="card fade-in" style={{ maxWidth: 560, width: "100%" }}>
          {error && <div className="alert alert-error">{error}</div>}

          {session && (
            <>
              <h3 style={{ fontFamily: "var(--font-display)", textAlign: "center", marginBottom: 8 }}>
                Votación
              </h3>
              <p style={{ textAlign: "center", fontSize: 18, fontWeight: 600, color: "var(--color-text)", marginBottom: 16 }}>
                {session.question}
              </p>

              {/*  Mapa con el sticker  */}
              <div style={{ borderRadius: 12, overflow: "hidden", height: 200, marginBottom: 20 }}>
                {hasLocation ? (
                  <MapContainer
                    center={[session.sticker_lat!, session.sticker_lon!]}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                    scrollWheelZoom={false}
                    dragging={false}
                    doubleClickZoom={false}
                    attributionControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker
                      position={[session.sticker_lat!, session.sticker_lon!]}
                      icon={createMarkerIcon(session.sticker_category)}
                    />
                  </MapContainer>
                ) : (
                  <div style={{
                    height: "100%", background: "#e8e0d8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, color: "var(--color-text-muted)",
                  }}>
                    Sticker #{session.sticker_id}
                  </div>
                )}
              </div>

              {/*  Botones de voto  */}
              {!voted ? (
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    className="btn btn-olive"
                    style={{ padding: "12px 32px", fontSize: 15, minWidth: 180 }}
                    onClick={() => handleVote(true)}
                    disabled={submitting}
                  >
                    {submitting ? "Enviando..." : "Estoy de acuerdo"}
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: "12px 32px", fontSize: 15, minWidth: 180 }}
                    onClick={() => handleVote(false)}
                    disabled={submitting}
                  >
                    {submitting ? "Enviando..." : "No estoy de acuerdo"}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", marginTop: 8 }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-green)" }}>
                    ¡Gracias por tu voto!
                  </p>
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>
                    Esperando a que el administrador cierre la votación...
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
