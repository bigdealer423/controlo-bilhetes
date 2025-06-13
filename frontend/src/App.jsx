import { useEffect, useState } from "react";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";

export default function App() {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const userLogado = localStorage.getItem("autenticado");
    if (userLogado === "true") {
      setAutenticado(true);
    }
  }, []);

  const fazerLogin = (username, password) => {
    if (username === "bigdealer" && password === "1091") {
      setAutenticado(true);
      localStorage.setItem("autenticado", "true");
    } else {
      alert("Credenciais inválidas");
    }
  };

  const fazerLogout = () => {
    setAutenticado(false);
    localStorage.removeItem("autenticado");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {autenticado ? (
        <Dashboard onLogout={fazerLogout} />
      ) : (
        <LoginPage onLogin={fazerLogin} />
      )}
    </div>
  );
}
