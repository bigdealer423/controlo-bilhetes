// src/Dashboard.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import EventoModal from "./EventoModal";
import { FiSettings } from "react-icons/fi";
import { useAuth } from "./AuthContext";

const { logout } = useAuth();

export default function Dashboard({ onAtualizarEventos }) {
  const navigate = useNavigate();
  const location = useLocation();
  const rotaAtual = location.pathname;

  const [mostrarModal, setMostrarModal] = useState(false);

  const handleLogout = () => {
  logout();
  navigate("/login");
};

  const menus = [
    { nome: "Listagem de Vendas", rota: "/listagem-vendas" },
    { nome: "Eventos", rota: "/eventos" },
    { nome: "Info Clubes", rota: "/info-clubes" },
    { nome: "Disputas", rota: "/disputas" },
    { nome: "Compras", rota: "/compras" },
    { nome: "Outro Menu", rota: "/outro" }
  ];

  useEffect(() => {
    if (location.pathname === "/dashboard") {
      navigate("/listagem-vendas");
    }
  }, [location.pathname, navigate]);

  // ✅ Função de logout
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authExpires");
    navigate("/login");
  };

  return (
    <div className="bg-gray-100 p-3 flex justify-between items-center border-b mb-4">
      <div className="flex gap-2 flex-wrap">
        {menus.map((menu) => (
          <button
            key={menu.rota}
            onClick={() => navigate(menu.rota)}
            className={`px-3 py-1 text-sm rounded ${
              rotaAtual === menu.rota
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border hover:bg-blue-50"
            }`}
          >
            {menu.nome}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-4 ml-4">
  <button
    onClick={() => setMostrarModal(true)}
    className="text-gray-700 hover:text-black"
    title="Definições"
  >
    <FiSettings size={20} />
  </button>

  <button
    onClick={handleLogout}
    className="text-red-600 hover:text-red-800 text-sm border border-red-600 px-2 py-1 rounded"
  >
    Logout
  </button>
</div>

      

      <EventoModal
        visivel={mostrarModal}
        fechar={() => setMostrarModal(false)}
        onAtualizar={onAtualizarEventos}
      />
    </div>
  );
}
