import { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";

export default function App() {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const estaAutenticado = localStorage.getItem("autenticado");
    if (estaAutenticado === "true") {
      setAutenticado(true);
    }
  }, []);

  const handleLogin = (utilizador, password) => {
    if (utilizador === "bigdealer" && password === "1091") {
      localStorage.setItem("autenticado", "true");
      setAutenticado(true);
    } else {
      alert("Credenciais inválidas");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("autenticado");
    setAutenticado(false);
  };

  return autenticado ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}
