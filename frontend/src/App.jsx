import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";
import ListagemVendas from "./ListagemVendas";
import Eventos from "./Eventos";
import InfoClubes from "./InfoClubes";
import Disputas from "./Disputas";
import Compras from "./Compras";
import Outro from "./Outro";

export default function App() {
  const [autenticado, setAutenticado] = useState(localStorage.getItem("autenticado") === "true");

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
            autenticado ? <Dashboard setAutenticado={setAutenticado} /> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/listagem-vendas"
          element={
            autenticado ? <><Dashboard setAutenticado={setAutenticado} /><ListagemVendas /></> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/eventos"
          element={
            autenticado ? <><Dashboard setAutenticado={setAutenticado} /><Eventos /></> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/info-clubes"
          element={
            autenticado ? <><Dashboard setAutenticado={setAutenticado} /><InfoClubes /></> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/disputas"
          element={
            autenticado ? <><Dashboard setAutenticado={setAutenticado} /><Disputas /></> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/compras"
          element={
            autenticado ? <><Dashboard setAutenticado={setAutenticado} /><Compras /></> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/outro"
          element={
            autenticado ? <><Dashboard setAutenticado={setAutenticado} /><Outro /></> : <Navigate to="/" replace />
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
