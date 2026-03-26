import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { Icons } from "../components/Navbar";
import type { VoteSession } from "../types";
import * as api from "../services/api";

export default function VotingQuestionPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<VoteSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    if (!code) return;
    api.getVoteSession(code)
      .then((s) => {
        if (!s.active) {
          // Si ya terminó, ir a resultados
          navigate(`/votacion/${code}/resultados`, { replace: true });
          return;
        }
        setSession(s);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [code, navigate]);

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
        <div className="page-center">
          <div className="spinner" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="page-center">
        <div className="card fade-in" style={{ maxWidth: 560, width: "100%" }}>
          {error && <div className="alert alert-error">{error}</div>}

          {session && (
            <>
              <h3 style={{ fontFamily: "var(--font-display)", textAlign: "center", marginBottom: 8 }}>
                Pregunta #{session.id}
              </h3>
              <p style={{ textAlign: "center", fontSize: 18, fontWeight: 600, color: "var(--color-text)" }}>
                {session.question}
              </p>

              {/* Mini map placeholder — en producción podés mostrar el sticker real */}
              <div style={{
                background: "#e8e0d8", borderRadius: 12, height: 180, margin: "16px auto",
                maxWidth: 320, display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: 8, left: 8, background: "var(--color-white)",
                  padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  boxShadow: "var(--shadow-sm)",
                }}>
                  Sticker #{session.sticker_id}
                </div>
                <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Vista del mapa</span>
              </div>

              {!voted ? (
                <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
                  <button
                    className="btn btn-olive"
                    style={{ padding: "12px 32px", fontSize: 15, minWidth: 180 }}
                    onClick={() => handleVote(true)}
                    disabled={submitting}
                  >
                    {submitting ? "Enviando..." : "Sí, estoy de acuerdo."}
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: "12px 32px", fontSize: 15, minWidth: 180 }}
                    onClick={() => handleVote(false)}
                    disabled={submitting}
                  >
                    {submitting ? "Enviando..." : "No, estoy en desacuerdo."}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-green)" }}>¡Gracias por tu voto!</p>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 8 }}
                    onClick={() => navigate(`/votacion/${code}/resultados`)}
                  >
                    Ver resultados
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
