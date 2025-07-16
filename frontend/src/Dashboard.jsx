import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import EventoModal from "./EventoModal";
import { FiSettings } from "react-icons/fi";
import { useAuth } from "./AuthContext";
import ThemeToggle from "./components/ThemeToggle";


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


 
  return (
    <>
      <div className="bg-gray-100 dark:bg-gray-800 p-3 flex justify-between items-center border-b border-gray-300 dark:border-gray-700 mb-4 transition-colors duration-300">
        <div className="hidden md:flex gap-2 flex-wrap">
          {menus.map((menu) => (
            <button
              key={menu.rota}
              onClick={(e) => handleMenuClick(e, menu.rota)}
              className={`px-3 py-1 text-sm rounded transition-colors duration-300 ${
                rotaAtual === menu.rota
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600"
              }`}
            >
              {menu.nome}
            </button>
          ))}
        </div>

  
        <div className="flex items-center space-x-4 ml-4">
          <ThemeToggle />  {/* Aqui, alinhado com os botões de topo */}
          <button
            onClick={(e) => handleRodaDentadaClick(e)}  // Garante que a roda dentada apenas abre o modal
            className="text-gray-700 hover:text-black dark:text-white dark:hover:text-gray-300 transition-colors"
            title="Definições"
          >
            <FiSettings size={20} />
          </button>
  
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-800 text-sm border border-red-600 dark:border-red-400 px-2 py-1 rounded bg-white dark:bg-gray-700 dark:text-red-400 transition-colors duration-300"
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
    </>
  );
}
