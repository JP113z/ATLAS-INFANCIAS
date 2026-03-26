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

              {/* Barra de resultados */}
              <div className="vote-bar">
                <div className="vote-bar-favor" style={{ width: `${results.percent_favor}%` }}>
                  <span>A favor</span>
                  <span>{results.percent_favor}%</span>
                </div>
                <div className="vote-bar-against" style={{ width: `${results.percent_against}%` }}>
                  <span>{results.percent_against}%</span>
                  <span>En contra</span>
                </div>
              </div>

              <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 16, textAlign: "center" }}>
                Total de votos: <strong>{results.total}</strong> · A favor: {results.in_favor} · En contra: {results.against}
              </p>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
