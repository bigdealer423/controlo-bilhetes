import NavbarInferior from "./components/NavbarInferior";
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
import ErrorBoundary from "./ErrorBoundary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


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
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <Router>
        <ErrorBoundary>
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <div>
                    <Dashboard onAtualizarEventos={forcarAtualizacaoEventos} />
                    <DashboardPrincipal />
                    <NavbarInferior />
                  </div>
                ) : (
                  <LoginPage />
                )
              }
            />
          
            <Route
              path="/listagem-vendas"
              element={
                isAuthenticated ? (
                  <>
                    <Dashboard onAtualizarEventos={forcarAtualizacaoEventos} />
                    <ListagemVendas atualizarEventos={true} />
                    <NavbarInferior />
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
                    <NavbarInferior />
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
                    <NavbarInferior />
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
                    <NavbarInferior />
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
                    <NavbarInferior />
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
                    <NavbarInferior />
                  </>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </TooltipProvider>
  );
}
