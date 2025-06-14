import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";
import ListagemVendas from "./ListagemVendas";
import Eventos from "./Eventos";
import InfoClubes from "./InfoClubes";
import Disputas from "./Disputas";
import Compras from "./Compras";
import Outro from "./Outro";

export default function App() {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const autenticadoLocal = localStorage.getItem("autenticado");
    setAutenticado(autenticadoLocal === "true");
  }, []);

  if (autenticado === null) return null; // evitar mostrar rota antes do estado carregar

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            autenticado ? <Navigate to="/listagem-vendas" replace /> : <LoginPage setAutenticado={setAutenticado} />
          }
        />

        <Route
          path="/dashboard"
          element={
            autenticado ? <Dashboard /> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/listagem-vendas"
          element={
            autenticado ? <><Dashboard /><ListagemVendas /></> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/eventos"
          element={
            autenticado ? <><Dashboard /><Eventos /></> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/info-clubes"
          element={
            autenticado ? <><Dashboard /><InfoClubes /></> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/disputas"
          element={
            autenticado ? <><Dashboard /><Disputas /></> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/compras"
          element={
            autenticado ? <><Dashboard /><Compras /></> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/outro"
          element={
            autenticado ? <><Dashboard /><Outro /></> : <Navigate to="/" replace />
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
