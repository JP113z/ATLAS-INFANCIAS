import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icons } from "./Navbar";
import type { Comment, StickerProperties } from "../types";
import * as api from "../services/api";

interface StickerPopupProps {
  sticker: StickerProperties;
  onClose: () => void;
}

export default function StickerPopup({ sticker, onClose }: StickerPopupProps) {
  const { user } = useAuth();
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

  const handleCreateVoting = async () => {
    const question = prompt("Escribe la pregunta para la votación:", `¿Estas de acuerdo con que esta zona es ${sticker.category}?`);
    if (!question) return;
    try {
      const session = await api.createVoteSession(sticker.id, question);
      navigate(`/admin/votacion/${session.code}`);
    } catch (err: any) {
      alert("Error creando votación: " + err.message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <div className="sticker-popup-overlay" onClick={onClose}>
      <div className="sticker-popup fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-olive btn-sm" onClick={() => navigate("/votacion/unirse")}>
              Unirse a votación
            </button>
            {user?.role === "admin" && (
              <button className="btn btn-outline btn-sm" onClick={handleCreateVoting}>
                Crear votación
              </button>
            )}
          </div>
          <div onClick={onClose} style={{ cursor: "pointer", color: "#999", padding: 4 }}>
            {Icons.close}
          </div>
        </div>

        {/* Sticker info */}
        <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--color-border-warm)" }}>
          Categoría: <strong>{sticker.category}</strong> · ID: {sticker.id}
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
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un comentario..."
                    style={{ padding: "6px 10px", fontSize: 13 }}
                    disabled={submitting}
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleAddComment} disabled={submitting || !newComment.trim()}>
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
