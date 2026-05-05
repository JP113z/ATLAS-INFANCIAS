import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { Icons } from "../components/Navbar";
import type { VoteResults as VoteResultsType } from "../types";
import * as api from "../services/api";

export default function VotingResultsPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [results, setResults] = useState<VoteResultsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    api.getVoteResults(code)
      .then(setResults)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <PageLayout>
        <div className="page-center"><div className="spinner" /></div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="page-center">
        <div className="card fade-in" style={{ maxWidth: 560, width: "100%" }}>
          <a onClick={() => navigate("/mapa")} className="back-link" style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
            {Icons.back} Volver
          </a>

          {error && <div className="alert alert-error">{error}</div>}

          {results && (
            <>
              <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 8 }}>Resultados</h3>
              <p style={{ fontSize: 16, color: "var(--color-text)", marginBottom: 16 }}>{results.question}</p>

              {/* Etiquetas encima de la barra */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontWeight: 700, fontSize: 14 }}>
                <span style={{ color: "var(--color-green)" }}>A favor — {results.percent_favor}%</span>
                <span style={{ color: "var(--color-red)" }}>En contra — {results.percent_against}%</span>
              </div>

              {/* Barra de resultados */}
              <div className="vote-bar">
                <div className="vote-bar-favor" style={{ width: `${results.percent_favor}%` }} />
                <div className="vote-bar-against" style={{ width: `${results.percent_against}%` }} />
              </div>

              {/* Conteos debajo de la barra */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 13, color: "var(--color-text-muted)" }}>
                <span>{results.in_favor} {results.in_favor === 1 ? "voto" : "votos"}</span>
                <span>Total: <strong>{results.total}</strong></span>
                <span>{results.against} {results.against === 1 ? "voto" : "votos"}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
