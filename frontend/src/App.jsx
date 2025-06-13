import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import LoginPage from "./LoginPage";

export default function App() {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const loginAnterior = localStorage.getItem("login");
    if (loginAnterior === "true") {
      setAutenticado(true);
    }
  }, []);

  const handleLogin = (username, password) => {
    if (username === "bigdealer" && password === "1091") {
      localStorage.setItem("login", "true");
      setAutenticado(true);
    } else {
      alert("Credenciais inválidas");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("login");
    setAutenticado(false);
  };

  return (
    <div>
      {autenticado ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}

