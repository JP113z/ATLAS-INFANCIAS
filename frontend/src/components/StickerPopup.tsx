import { Icons } from "./Navbar";
import type { StickerProperties } from "../types";

interface StickerPopupProps {
  sticker: StickerProperties;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  transito: "Tránsito",
  recreacion: "Recreación",
  riesgo: "Riesgo",
  afecto: "Afecto",
};

export default function StickerPopup({ sticker, onClose }: StickerPopupProps) {

  return (
    <div className="sticker-popup-overlay" onClick={onClose}>
      <div className="sticker-popup fade-in" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>
            Información del sticker
          </h3>
          <div onClick={onClose} style={{ cursor: "pointer", color: "#999", padding: 4 }}>
            {Icons.close}
          </div>
        </div>

        {/* Datos del sticker */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            <strong>Categoría:</strong>{" "}
            <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
              {CATEGORY_LABELS[sticker.category] ?? sticker.category}
            </span>
          </div>

          {sticker.school_id && (
            <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              <strong>Escuela ID:</strong> {sticker.school_id}
            </div>
          )}

          {sticker.gender && (
            <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              <strong>Género:</strong> {sticker.gender}
            </div>
          )}

          {sticker.created_at && (
            <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              <strong>Fecha:</strong>{" "}
              {new Date(sticker.created_at).toLocaleDateString("es-CR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
