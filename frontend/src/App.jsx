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

  if (autenticado === null) return null;

  // Força reload para atualizar dropdown de eventos
  const forcarAtualizacaoEventos = () => window.location.reload();

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            autenticado ? <Navigate to="/listagem-vendas" replace /> : <LoginPage />
          }
        />

        <Route
          path="/dashboard"
          element={
            autenticado ? <Dashboard onAtualizarEventos={forcarAtualizacaoEventos} /> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/listagem-vendas"
          element={
            autenticado ? (
              <>
                <Dashboard onAtualizarEventos={forcarAtualizacaoEventos} />
                <ListagemVendas />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/eventos"
          element={
            autenticado ? (
              <>
                <Dashboard onAtualizarEventos={forcarAtualizacaoEventos} />
                <Eventos />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/info-clubes"
          element={
            autenticado ? (
              <>
                <Dashboard onAtualizarEventos={forcarAtualizacaoEventos} />
                <InfoClubes />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/disputas"
          element={
            autenticado ? (
              <>
                <Dashboard onAtualizarEventos={forcarAtualizacaoEventos} />
                <Disputas />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/compras"
          element={
            autenticado ? (
              <>
                <Dashboard onAtualizarEventos={forcarAtualizacaoEventos} />
                <Compras />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/outro"
          element={
            autenticado ? (
              <>
                <Dashboard onAtualizarEventos={forcarAtualizacaoEventos} />
                <Outro />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
