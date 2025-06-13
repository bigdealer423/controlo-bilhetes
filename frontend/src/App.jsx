import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";

export default function App() {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const autenticadoLocal = localStorage.getItem("autenticado");
    setAutenticado(autenticadoLocal === "true");
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            autenticado ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />
        <Route
          path="/dashboard"
          element={
            autenticado ? <Dashboard /> : <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
