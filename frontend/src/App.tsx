import { useState } from "react";
import Home from "./pages/Home";
import MapPage from "./pages/MapPage";

export default function App() {
  const [screen, setScreen] = useState<"home" | "map">("home");

  if (screen === "home") {
    return <Home onEnterVisitor={() => setScreen("map")} />;
  }

  return <MapPage onBack={() => setScreen("home")} />;
}