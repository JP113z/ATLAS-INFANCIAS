import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/Logo_color.png";

// ─── SVG Icons (inline para no depender de librería externa) ───
export const Icons = {
  arrow: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
  ),
  user: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  back: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
  ),
  filter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
  ),
  gear: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
  ),
  school: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
  ),
  calendar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
  ),
  lock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
  ),
  mail: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /></svg>
  ),
  menu: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
  ),
  map: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" x2="8" y1="2" y2="18" /><line x1="16" x2="16" y1="6" y2="22" /></svg>
  ),
  smiley: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></svg>
  ),
  check: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
  ),
  vote: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 10h8M8 14h4"/><circle cx="17" cy="14" r="3"/><path d="m19 16-1.5-1.5"/></svg>
  ),
};

// ─── Logo ───
export function Logo({ size = 44 }: { size?: number }) {
  return (
    <img
      src={logoImg}
      alt="ATLAS de las Niñeces"
      style={{ height: size, width: "auto" }}
    />
  );
}

// ─── Navbar ───
export default function Navbar() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const navTo = (path: string) => {
    navigate(path);
    closeMobile();
  };

  return (
    <nav className="navbar">
      <div onClick={() => navTo(user ? "/mapa" : "/")} style={{ cursor: "pointer" }}>
        <Logo />
      </div>

      {/* Desktop */}
      <div className="navbar-actions">
        {!user ? (
          <>
            <button className="btn btn-primary" onClick={() => navTo("/login")}>{Icons.arrow} Iniciar Sesión</button>
            <button className="btn btn-secondary" onClick={() => navTo("/registro")}>{Icons.user} Registrarse</button>
          </>
        ) : (
          <>
            {user.role === "admin" && (
              <button className="btn btn-outline btn-sm" onClick={() => navTo("/admin/usuarios")}>Administrar usuarios</button>
            )}
            <button className="btn btn-olive btn-sm" onClick={() => navTo("/votacion/unirse")}>{Icons.vote} Votaciones</button>
            <button className="btn btn-primary btn-sm" onClick={() => navTo("/perfil")}>{Icons.user} Perfil</button>
            <button className="btn btn-danger btn-sm" onClick={() => { handleLogout(); navTo("/"); }}>Cerrar Sesión</button>
          </>
        )}
      </div>

      {/* Mobile toggle */}
      <button className="navbar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? Icons.close : Icons.menu}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="navbar-mobile-menu">
          {!user ? (
            <>
              <button className="btn btn-primary btn-block" onClick={() => navTo("/login")}>Iniciar Sesión</button>
              <button className="btn btn-secondary btn-block" onClick={() => navTo("/registro")}>Registrarse</button>
              <button className="btn btn-olive btn-block" onClick={() => navTo("/votacion/unirse")}>{Icons.vote} Unirse a Votación</button>
            </>
          ) : (
            <>
              {user.role === "admin" && <button className="btn btn-outline btn-block" onClick={() => navTo("/admin/usuarios")}>Administrar usuarios</button>}
              <button className="btn btn-olive btn-block" onClick={() => navTo("/votacion/unirse")}>{Icons.vote} Votaciones</button>
              <button className="btn btn-primary btn-block" onClick={() => navTo("/perfil")}>{Icons.user} Perfil</button>
              <button className="btn btn-danger btn-block" onClick={() => { handleLogout(); navTo("/"); }}>Cerrar Sesión</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
