import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLayout from "../components/PageLayout";

export default function EmailVerifyPage() {
  const navigate = useNavigate();
  const { handleConfirmEmailChange, cancelEmailChange, pendingNewEmail, error, clearError, loading } = useAuth();

  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (!code.trim() || code.trim().length !== 6) {
      setLocalError("Ingresa el código de 6 dígitos.");
      return;
    }

    try {
      await handleConfirmEmailChange(code.trim());
      navigate("/perfil");
    } catch {
      // el error queda en AuthContext
    }
  };

  const handleCancel = () => {
    cancelEmailChange();
    navigate("/perfil");
  };

  return (
    <PageLayout>
      <div className="page-center">
        <div className="card fade-in" style={{ maxWidth: 480, width: "100%" }}>
          <a onClick={handleCancel} className="back-link">← Volver al perfil</a>

          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 4 }}>
            Verificar nuevo correo
          </h2>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 24 }}>
            Te enviamos un código a: <b>{pendingNewEmail ?? "tu nuevo correo"}</b>
          </p>

          {(localError || error) && (
            <div className="alert alert-error">{localError || error}</div>
          )}

          <form onSubmit={onSubmit}>
            <label className="label">Código (6 dígitos)</label>
            <input
              className="input"
              inputMode="numeric"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              autoFocus
            />

            <button
              className="btn btn-primary btn-block"
              type="submit"
              style={{ padding: 14, fontSize: 16, marginTop: 24 }}
              disabled={loading}
            >
              {loading ? "Verificando..." : "Confirmar cambio de correo"}
            </button>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
