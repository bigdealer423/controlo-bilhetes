// Dashboard.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import EventoModal from "./EventoModal";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mostrarModalEvento, setMostrarModalEvento] = useState(false);

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

  return (
    <div className="bg-white p-2 shadow-md flex justify-between items-center">
      <div className="flex gap-2">
        {menus.map(menu => (
          <button
            key={menu.rota}
            onClick={() => navigate(menu.rota)}
            className={`px-3 py-1 rounded text-sm font-medium ${location.pathname === menu.rota ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
          >
            {menu.nome}
          </button>
        ))}
      </div>
      <button
        onClick={() => setMostrarModalEvento(true)}
        className="ml-4 text-gray-600 hover:text-gray-900 text-xl"
        title="Definições"
      >
        ⚙️
      </button>

      {mostrarModalEvento && <EventoModal onClose={() => setMostrarModalEvento(false)} />}
    </div>
  );
}
