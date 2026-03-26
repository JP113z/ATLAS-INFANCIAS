import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { Icons } from "../components/Navbar";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <div className="page-content">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 48px)", color: "var(--color-orange)", fontWeight: 700 }}>
          Bienvenido a ATLAS Infancias
        </h1>
        <p style={{ fontSize: "clamp(14px, 2.5vw, 20px)", color: "var(--color-orange)", marginTop: 12, maxWidth: 600, opacity: 0.85 }}>
          Plataforma colaborativa para mapear y visualizar stickers georeferenciados
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginTop: 48 }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/login")}>{Icons.arrow} Iniciar Sesión</button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate("/registro")}>{Icons.user} Registrarse</button>
          <button className="btn btn-outline btn-lg" onClick={() => navigate("/mapa")}>Explorar como visitante</button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", marginTop: 60, maxWidth: 900, width: "100%" }}>
          {[
            { icon: Icons.map, title: "Mapa interactivo", desc: "Explora stickers en el mapa con múltiples filtros", color: "#8FAF30" },
            { icon: Icons.smiley, title: "Modo visitante", desc: "No necesitas iniciar sesión para visualizar el mapa, puedes hacerlo como visitante", color: "var(--color-orange)" },
            { icon: Icons.check, title: "Votaciones", desc: "Participa en las votaciones activas con QR", color: "#DAA520" },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{ color: f.color, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontFamily: "var(--font-display)", color: "var(--color-orange)", fontSize: 20, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "var(--color-orange)", opacity: 0.8, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
