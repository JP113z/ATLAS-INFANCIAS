import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import PageLayout from "../components/PageLayout";
import { Icons } from "../components/Navbar";
import * as api from "../services/api";

export default function VotingJoinPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const qrRef = useRef<Html5Qrcode | null>(null);
  const scannerStarted = useRef(false); // evita doble inicio en StrictMode

  // Detectar mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /**
   * FIX: El div "qr-reader-div" siempre está en el DOM (oculto cuando no se usa).
   * Este effect arranca el scanner DESPUÉS de que React terminó de renderizar,
   * garantizando que el div ya existe cuando html5-qrcode lo busca por ID.
   */
  useEffect(() => {
    if (!scanning) return;
    if (scannerStarted.current) return;
    scannerStarted.current = true;

    const scanner = new Html5Qrcode("qr-reader-div");
    qrRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          // Extraer el código del URL del QR, o usarlo directo
          let extracted = decodedText.trim();
          try {
            const url = new URL(decodedText);
            const parts = url.pathname.split("/").filter(Boolean);
            const idx = parts.indexOf("votacion");
            if (idx !== -1 && parts[idx + 1]) {
              extracted = parts[idx + 1];
            }
          } catch {
            // No era URL — usar el texto directo como código
          }

          scanner
            .stop()
            .catch(() => {})
            .finally(() => {
              qrRef.current = null;
              scannerStarted.current = false;
              navigate(`/votacion/${extracted}`);
            });
        },
        () => {} // errores de frame individuales, se ignoran
      )
      .catch((err) => {
        console.error("Error al iniciar cámara:", err);
        qrRef.current = null;
        scannerStarted.current = false;
        setScanning(false);
        setError(
          "No se pudo acceder a la cámara. Asegúrate de dar permiso y de usar HTTPS o localhost."
        );
      });

    // Cleanup si el componente se desmonta mientras escanea
    return () => {
      if (qrRef.current) {
        qrRef.current.stop().catch(() => {});
        qrRef.current = null;
      }
      scannerStarted.current = false;
    };
  }, [scanning, navigate]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Ingresa un código de sesión");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const session = await api.getVoteSession(trimmed);
      if (!session.active) {
        setError("Esta votación ya finalizó");
        return;
      }
      navigate(`/votacion/${trimmed}`);
    } catch (err: any) {
      setError(err.message || "Código de sesión no encontrado");
    } finally {
      setLoading(false);
    }
  };

  const startScan = () => {
    setError("");
    setScanning(true);
    // El useEffect de arriba se encarga de iniciar el scanner
    // una vez que React renderizó el div "qr-reader-div"
  };

  const stopScan = () => {
    if (qrRef.current) {
      qrRef.current
        .stop()
        .catch(() => {})
        .finally(() => {
          qrRef.current = null;
          scannerStarted.current = false;
          setScanning(false);
        });
    } else {
      scannerStarted.current = false;
      setScanning(false);
    }
  };

  return (
    <PageLayout>
      <div className="page-center">
        <div className="card fade-in" style={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
          <a
            onClick={() => navigate("/mapa")}
            className="back-link"
            style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 6, fontSize: 16, fontWeight: 700, marginBottom: 20 }}
          >
            {Icons.back} Volver
          </a>

          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 20 }}>
            ¡Bienvenido a la votación!
          </h2>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Formulario de código manual */}
          <form onSubmit={handleJoin}>
            <label className="label" style={{ justifyContent: "center" }}>
              Escribe el código de la sesión
            </label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ej: xpf6hi"
              style={{ textAlign: "center", fontSize: 18, padding: "12px 16px", marginTop: 8, maxWidth: 280, margin: "8px auto 0" }}
            />
            <br />
            <button
              className="btn btn-olive"
              type="submit"
              style={{ padding: "10px 24px", fontSize: 15, marginTop: 12 }}
              disabled={loading}
            >
              {loading ? "Buscando..." : "Entrar"}
            </button>
          </form>

          {/* Sección de escaneo QR — solo en mobile */}
          {isMobile && (
            <div style={{ marginTop: 24, borderTop: "1px solid var(--color-border-warm)", paddingTop: 20 }}>
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 12 }}>
                O escanea el código QR de la pantalla
              </p>

              {/* El div SIEMPRE está en el DOM — solo cambia visibilidad.
                  Esto es necesario para que html5-qrcode lo encuentre al arrancar. */}
              <div
                id="qr-reader-div"
                style={{
                  display: scanning ? "block" : "none",
                  width: 280,
                  margin: "0 auto 12px",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "2px solid var(--color-border)",
                }}
              />

              {!scanning ? (
                <button className="btn btn-olive btn-sm" onClick={startScan}>
                  Escanear QR con cámara
                </button>
              ) : (
                <button className="btn btn-outline btn-sm" onClick={stopScan} style={{ marginTop: 8 }}>
                  Cancelar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
