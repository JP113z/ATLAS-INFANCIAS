import type { ReactNode } from "react";
import Navbar from "./Navbar";

export function Footer() {
  return (
    <footer className="footer">
      © 2026 ATLAS Infancias - Prototipo de Sistema
    </footer>
  );
}

interface PageLayoutProps {
  children: ReactNode;
  noFooter?: boolean;
}

export default function PageLayout({ children, noFooter = false }: PageLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </main>
      {!noFooter && <Footer />}
    </div>
  );
}
