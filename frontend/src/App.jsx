import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";
import ListagemVendas from "./ListagemVendas";
import Eventos from "./Eventos";
import InfoClubes from "./InfoClubes";
import Disputas from "./Disputas";
import Compras from "./Compras";
import Outro from "./Outro";
import { useAuth } from "./AuthContext";

export default function App() {
  const { isAuthenticated } = useAuth();

  const forcarAtualizacaoEventos = () => {
  // Exemplo de como você pode atualizar o estado dos eventos
  fetchEventos();  // Aqui, 'fetchEventos' seria uma função para buscar eventos da API ou atualizar os dados
};

const fetchEventos = async () => {
  try {
    const response = await fetch("/api/eventos");
    const eventos = await response.json();
    setEventos(eventos);  // Atualiza o estado dos eventos com os dados mais recentes
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
  }
};


  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/listagem-vendas" replace /> : <LoginPage />
          }
        />

        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/listagem-vendas" replace />
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
  );
}
