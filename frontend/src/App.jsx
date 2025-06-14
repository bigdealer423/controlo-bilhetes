import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";

import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";
import ListagemVendas from "./ListagemVendas";
import Eventos from "./Eventos";
import InfoClubes from "./InfoClubes";
import Disputas from "./Disputas";
import Compras from "./Compras";
import Outro from "./Outro";

function AppRoutes() {
  const { autenticado } = useAuth();

  return (
    <Routes>
      <Route path="/" element={autenticado ? <Navigate to="/listagem-vendas" /> : <LoginPage />} />
      <Route path="/dashboard" element={autenticado ? <Dashboard /> : <Navigate to="/" />} />
      <Route path="/listagem-vendas" element={autenticado ? <><Dashboard /><ListagemVendas /></> : <Navigate to="/" />} />
      <Route path="/eventos" element={autenticado ? <><Dashboard /><Eventos /></> : <Navigate to="/" />} />
      <Route path="/info-clubes" element={autenticado ? <><Dashboard /><InfoClubes /></> : <Navigate to="/" />} />
      <Route path="/disputas" element={autenticado ? <><Dashboard /><Disputas /></> : <Navigate to="/" />} />
      <Route path="/compras" element={autenticado ? <><Dashboard /><Compras /></> : <Navigate to="/" />} />
      <Route path="/outro" element={autenticado ? <><Dashboard /><Outro /></> : <Navigate to="/" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

