import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLayout from "../components/PageLayout";
import { Icons } from "../components/Navbar";
import type { User } from "../types";
import * as api from "../services/api";

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Proteger ruta: solo admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/mapa");
    }
  }, [user, navigate]);

  // Cargar usuarios reales
  useEffect(() => {
    api.getUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);



  const handleToggleBlock = async (u: User) => {
    const action = u.blocked ? "desbloquear" : "Bloquear";
    if (!confirm(`¿Estás seguro de que quieres ${action} a este usuario?`)) return;
    try { 
      await api.blockUser(u.id, !u.blocked);
      const updated = await api.getUsers();
      setUsers(updated);
      } catch (err:any) {
        alert("Error: " + err.message);

      }
  };
  
  // Filtrar y paginar
  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page on search
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
  console.log("USERS FROM API:", users);
}, [users]);

  
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
        <div className="card fade-in" style={{ maxWidth: 640, width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <a onClick={() => navigate("/mapa")} className="back-link" style={{ fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              {Icons.back} Volver
            </a>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--color-white)", borderRadius: 8, border: "1px solid var(--color-border)", padding: "6px 12px" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar usuario..."
                style={{ border: "none", outline: "none", fontSize: 14, fontFamily: "var(--font-body)", width: 160 }}
              />
              {Icons.search}
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {paginated.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: 20 }}>
              {search ? "No se encontraron usuarios" : "No hay usuarios registrados"}
            </p>
          ) : (
            paginated.map((u) => (
              <div key={u.id} className="user-list-item">
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 500, minWidth: 0 }}>
                  {Icons.user}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.username}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {u.email} · {u.role} · {u.gender || "sin género"}
                    </div>
                  </div>
                </div>

              <button
                className={`btn btn-sm ${u.blocked ? "btn-outline" : "btn-danger"}`}
                onClick={() => handleToggleBlock(u)}
                style={{ flexShrink: 0 }}
              >
                {u.blocked ? "Desbloquear" : "Bloquear"}
              </button>

              </div>
            ))
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>←</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <div
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: p === page ? "var(--color-text)" : "var(--color-border)",
                    cursor: "pointer",
                  }}
                />
              ))}
              <span style={{ fontSize: 13, color: "var(--color-text-muted)", marginLeft: 4 }}>{page} / {totalPages}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>→</button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
