import MapView from "../components/MapView";

type MapPageProps = {
  onBack: () => void;
};

export default function MapPage({ onBack }: MapPageProps) {
  return (
    <div style={{ position: "relative" }}>
      {/* Botón flotante para volver */}
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          zIndex: 1000,
          top: 12,
          left: 12,
          padding: "10px 12px",
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
          background: "white",
        }}
      >
        ← Volver
      </button>

      <MapView />
    </div>
  );
}