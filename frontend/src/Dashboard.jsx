import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import EventoModal from "./EventoModal";
import { FiSettings } from "react-icons/fi";
import { useAuth } from "./AuthContext";

export default function Dashboard({ onAtualizarEventos }) {
  const navigate = useNavigate();
  const location = useLocation();
  const rotaAtual = location.pathname;
  const { logout } = useAuth();

  const [mostrarModal, setMostrarModal] = useState(false);

  // Função para logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Menus de navegação
  const menus = [
    { nome: "Listagem de Vendas", rota: "/listagem-vendas" },
    { nome: "Eventos", rota: "/eventos" },
    { nome: "Info Clubes", rota: "/info-clubes" },
    { nome: "Disputas", rota: "/disputas" },
    { nome: "Compras", rota: "/compras" },
    { nome: "Outro Menu", rota: "/outro" }
  ];

  // Função de clique nos menus
  const handleMenuClick = (e, menuRota) => {
    e.stopPropagation(); // Impede a navegação imediata
    navigate(menuRota);  // Navega para a página
  };

  // Função que abre o modal da roda dentada sem fechar a navegação
  const handleRodaDentadaClick = (e) => {
    e.stopPropagation(); // Impede que a navegação aconteça imediatamente
    setMostrarModal(true);  // Abre o modal
  };

  // UseEffect para redirecionar para "Listagem de Vendas" caso esteja na rota /dashboard
  useEffect(() => {
  // Evitar redirecionamento caso já esteja no lugar correto ou com o modal aberto
  if (location.pathname === "/dashboard" && !mostrarModal) {
    navigate("/listagem-vendas");
  }
}, [location.pathname, navigate, mostrarModal]);

  return (
    <div className="bg-gray-100 p-3 flex justify-between items-center border-b mb-4">
      <div className="flex gap-2 flex-wrap">
        {menus.map((menu) => (
          <button
            key={menu.rota}
            onClick={(e) => handleMenuClick(e, menu.rota)}  // Impede navegação imediata
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
          onClick={(e) => handleRodaDentadaClick(e)}  // Garante que a roda dentada apenas abre o modal
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
        fechar={() => setMostrarModal(false)}  // Garante que o modal pode ser fechado
        onAtualizar={onAtualizarEventos}
      />
    </div>
  );  // <-- Verifique se essa linha de fechamento está aqui.
