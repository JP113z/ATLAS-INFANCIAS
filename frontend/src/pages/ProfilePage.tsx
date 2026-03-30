import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLayout from "../components/PageLayout";
import { Icons } from "../components/Navbar";
import * as api from "../services/api";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, handleLogout, refreshUser,  handleUpdateUsername, handleUpdatePassword } = useAuth();

  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState(""); 
  if (!user) {
    navigate("/login");
    return null;
  }

  const startEdit = (field: string, currentValue: string) => {
    setEditing(field);
    setSuccess("");
    setError("");

    if (field === "password") {
      setCurrentPassword("");
      setNewPassword("");
      setEditValue(""); 
    } else {
      setEditValue(currentValue);
    }
    };
  const saveEdit = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!editing) return;

      if (editing === "username") {
        if (!editValue.trim()) return;
        await handleUpdateUsername(editValue.trim());
        setEditing(null);
        setSuccess("Nombre de usuario actualizado");
        return;
      }

      if (editing === "password") {
        if (!currentPassword.trim() || !newPassword.trim()) {
          setError("Debes llenar la contraseña actual y la nueva");
          return;
        }

        await handleUpdatePassword(currentPassword, newPassword);

        setEditing(null);
        setCurrentPassword("");
        setNewPassword("");
        setSuccess("Contraseña actualizada");
        return;
      }

      setError("Por ahora solo username y contraseña");
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.")) return;
    try {
      await api.deleteMe();
      handleLogout();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Error al eliminar cuenta");
    }
  };

  const fields = [
    { key: "username", label: "Nombre de Usuario", icon: Icons.user, value: user.username },
    { key: "email", label: "Correo", icon: Icons.mail, value: user.email },
    { key: "password", label: "Contraseña", icon: Icons.lock, value: "••••••••••••" },
  ];

  return (
    <PageLayout>
      <div className="page-center">
        <div className="card fade-in" style={{ maxWidth: 560, width: "100%" }}>
          <a onClick={() => navigate("/mapa")} className="back-link" style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
            {Icons.back} Información de Usuario
          </a>

          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {fields.map((f) => (
            <div key={f.key} className="card-white" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div className="label" style={{ marginBottom: 0 }}>
                  {f.icon} {f.label}
                </div>
                {editing === f.key ? (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {editing === f.key ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {f.key === "password" ? (
                <>
                  <input
                    className="input"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Contraseña actual"
                    autoFocus
                  />
                  <input
                    className="input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nueva contraseña"
                  />
                </>
              ) : (
                <input
                  className="input"
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                  style={{ flex: 1 }}
                />
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>
                  {saving ? "..." : "Guardar"}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 15, color: "var(--color-text)", marginTop: 4, paddingLeft: 20 }}>
              {f.value}
            </div>
          )}
                    <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>
                      {saving ? "..." : "Guardar"}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 15, color: "var(--color-text)", marginTop: 4, paddingLeft: 20 }}>
                    {f.value}
                  </div>
                )}
              </div>
              {editing !== f.key && (
                <a onClick={() => startEdit(f.key, f.value)} className="link" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14, flexShrink: 0 }}>
                  {Icons.edit} Editar
                </a>
              )}
            </div>
          ))}

          <div style={{ fontSize: 14, color: "var(--color-text-secondary)", marginTop: 16 }}>
            <div>Rol: {user.role === "admin" ? "Administrador" : "Usuario"}</div>
            <div>Correo: {user.verified ? "Verificado" : "No verificado"}</div>
          </div>

          <button className="btn btn-danger" onClick={handleDelete} style={{ marginTop: 20 }}>
            Eliminar cuenta
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
