import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";
import ListagemVendas from "./ListagemVendas";
import Eventos from "./Eventos";
import InfoClubes from "./InfoClubes";
import Disputas from "./Disputas";
import Compras from "./Compras";
import Outro from "./Outro";
import DashboardPrincipal from "./DashboardPrincipal";
import { useAuth } from "./AuthContext";
import { TooltipProvider } from "@radix-ui/react-tooltip";

export default function App() {
  const { isAuthenticated } = useAuth();

  const forcarAtualizacaoEventos = () => {
    fetchEventos();
  };

  const fetchEventos = async () => {
    try {
      const response = await fetch("/api/eventos");
      const eventos = await response.json();
      // setEventos(eventos);  // Removido pois esta função não existe aqui
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
    }
  };

  return (
    <TooltipProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <>
                  <Dashboard onAtualizarEventos={forcarAtualizacaoEventos} />
                  <DashboardPrincipal />
                </>
              ) : (
                <LoginPage />
              )
            }
          />


            path="/listagem-vendas"
            element={
              isAuthenticated ? (
                <>
                  <Dashboard onAtualizarEventos={forcarAtualizacaoEventos} />
                  <ListagemVendas atualizarEventos={true} />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/eventos"
            element={
              isAuthenticated ? (
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
              isAuthenticated ? (
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
              isAuthenticated ? (
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
              isAuthenticated ? (
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
              isAuthenticated ? (
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
    </TooltipProvider>
  );
}
