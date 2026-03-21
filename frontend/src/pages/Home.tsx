type HomeProps = {
  onEnterVisitor: () => void;
};

export default function Home({ onEnterVisitor }: HomeProps) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <h1 style={{ marginBottom: 12 }}>ATLAS Infancias</h1>
        <p style={{ marginBottom: 18 }}>
          Plataforma colaborativa para mapear y visualizar stickers georeferenciados.
        </p>

        <button
          onClick={onEnterVisitor}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Modo visitante
        </button>
      </div>
    </div>
  );
}