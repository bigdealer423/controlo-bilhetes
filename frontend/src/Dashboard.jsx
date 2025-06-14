// src/Dashboard.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import EventoModal from "./EventoModal";
import { FiSettings } from "react-icons/fi";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mostrarModal, setMostrarModal] = useState(false);

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

  // Novo estado no topo do Dashboard.jsx
  const [atualizarEventos, setAtualizarEventos] = useState(false);
  const rotaAtual = location.pathname;

  return (
    <div className="bg-gray-100 p-3 flex justify-between items-center border-b mb-4">
      <div className="flex gap-2 flex-wrap">
        {menus.map(menu => (
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

      <div>
        <button
          onClick={() => setMostrarModal(true)}
          className="text-gray-700 hover:text-black ml-4"
          title="Definições"
        >
          <FiSettings size={20} />
        </button>
      </div>

      <EventoModal
  visivel={mostrarModal}
  fechar={() => {
    setMostrarModal(false);
    setAtualizarEventos(prev => !prev); // força re-render do dropdown
  }}
/>
    </div>
  );
}

