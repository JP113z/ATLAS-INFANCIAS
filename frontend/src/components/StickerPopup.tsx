import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { Icons } from "./Navbar";
import type { Comment, StickerFilters, StickerProperties } from "../types";
import * as api from "../services/api";

interface StickerPopupProps {
  sticker: StickerProperties;
  onClose: () => void;
  onFilterChange?: (filters: StickerFilters) => void;
}

/** Valor clickeable que aplica un filtro rápido (solo usuarios con sesión) */
function FilterTag({ label, onClick }: { label: string; onClick?: () => void }) {
  if (!onClick) return <span>{label}</span>;
  return (
    <span
      className="link"
      onClick={onClick}
      title="Clic para filtrar por este valor"
      style={{ fontSize: "inherit" }}
    >
      {label}
    </span>
  );
}

export default function StickerPopup({ sticker, onClose, onFilterChange }: StickerPopupProps) {
  const { user } = useAuth();

  /** Aplica un filtro rápido y cierra el popup — solo si el usuario tiene sesión */
  const applyFilter = (f: StickerFilters) => {
    if (!user || !onFilterChange) return;
    onFilterChange(f);
    onClose();
  };
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cargar comentarios reales
  useEffect(() => {
    setLoading(true);
    api.getComments(sticker.id)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sticker.id]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    try {
      const comment = await api.addComment(sticker.id, newComment.trim());
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch (err: any) {
      alert("Error al comentar: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm("¿Eliminar este comentario?")) return;
    try {
      await api.deleteComment(sticker.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const MAX_COMMENT_LEN = 400;

  return (
    <div className="sticker-popup-overlay" onClick={onClose}>
      <div className="sticker-popup fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>
            Información del sticker
          </h3>
          <div onClick={onClose} style={{ cursor: "pointer", color: "#999", padding: 4 }}>
            {Icons.close}
          </div>
        </div>

        {/* Sticker info */}
        <div
          style={{
            fontSize: 13,
            color: "var(--color-text-muted)",
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: "1px solid var(--color-border-warm)",
            lineHeight: 1.6,
          }}
        >
          <div>
            <strong>Categoría:</strong>{" "}
            <FilterTag
              label={sticker.category}
              onClick={user ? () => applyFilter({ category: sticker.category }) : undefined}
            />
          </div>

          {sticker.school && (
            <div>
              <strong>Escuela:</strong>{" "}
              <FilterTag
                label={`${sticker.school.name}${sticker.school.city ? ` (${sticker.school.city})` : ""}`}
                onClick={user ? () => applyFilter({ school_id: String(sticker.school!.id) }) : undefined}
              />
            </div>
          )}

          {sticker.user && (
            <div>
              <strong>Creado por:</strong>{" "}
              <FilterTag
                label={sticker.user.username}
                onClick={user ? () => applyFilter({ user_id: String(sticker.user!.id) }) : undefined}
              />
            </div>
          )}

          <div>
            <strong>Fecha:</strong> {formatDate(sticker.created_at)}
          </div>

          {user && (
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--color-text-muted)", fontStyle: "italic" }}>
              💡 Toca un valor para filtrar el mapa
            </div>
          )}


        </div>



        {/*Comments title*/}
        <div
          style= {{
            fontSize: 19,
            fontWeight: 550,
            color: "var(--color-text)",
            marginBottom: 8,
            marginTop: 4,
          }}
        >
          Comentarios:
        </div>

        {/* Comments */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 20 }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : comments.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", textAlign: "center", padding: "16px 0" }}>
            No hay comentarios todavía.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="comment-avatar" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text)" }}>{c.username}</div>
                <div style={{ fontSize: 13, color: "var(--color-text-muted)", wordBreak: "break-word" }}>{c.content}</div>
              </div>
              {user?.role === "admin" && (
                <button className="btn btn-danger btn-sm" style={{ flexShrink: 0 }} onClick={() => handleDelete(c.id)}>
                  Eliminar
                </button>
              )}
            </div>
          ))
        )}

        {/* Add comment */}
        <div style={{ borderTop: "1px solid var(--color-border-warm)", paddingTop: 12, marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <div className="comment-avatar" style={{ background: user ? "var(--color-primary)" : "#bbb" }} />
          <div style={{ flex: 1 }}>
            {user ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--color-text-secondary)" }}>{user.username}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>

          <input
            className="input"
            value={newComment}
            maxLength={MAX_COMMENT_LEN}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Escribe un comentario... `}
            style={{ padding: "6px 10px", fontSize: 13 }}
            disabled={submitting}
          />

          <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-text-muted)", textAlign: "right" }}>
            {newComment.length}/{MAX_COMMENT_LEN}
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleAddComment}
            disabled={submitting || !newComment.trim() || newComment.trim().length > MAX_COMMENT_LEN}
          >
            {submitting ? "..." : "Enviar"}
          </button>

                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                <span className="link" onClick={() => navigate("/login")}>Inicia sesión</span> para comentar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
