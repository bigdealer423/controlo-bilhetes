// src/Dashboard.jsx
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
  const [proximaRota, setProximaRota] = useState(null);  // Rota que deve ser navegada após fechar o modal

  const handleLogout = () => {
    logout();
    //navigate("/login"); //
  };

  const handleRodaDentadaClick = (e) => {
  e.stopPropagation();  // Impede que a navegação aconteça imediatamente
  console.log("Modal aberto, mostrando:", mostrarModal);
  setMostrarModal(true);  // Abre o modal
};

useEffect(() => {
  console.log("Modal visível:", mostrarModal);
}, [mostrarModal]);


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
      // navigate("/listagem-vendas");
    }
  }, [location.pathname, navigate]);

  const fecharModal = () => {
    setMostrarModal(false);
    if (proximaRota) {
      navigate(proximaRota);  // Navega para a rota que foi guardada
    }
  };

  // Lidar com a navegação das abas
  const handleMenuClick = (e, rota) => {
    e.preventDefault();
    if (rota === rotaAtual) return;  // Não faz nada se for a mesma rota
    setMostrarModal(false);  // Fecha o modal, se estiver aberto
    navigate(rota);  // Navega para a nova rota
  };

  return (
  <div className="bg-gray-100 p-3 flex justify-between items-center border-b mb-4">
    <div className="flex gap-2 flex-wrap">
      {menus.map((menu) => (
        <button
          key={menu.rota}
          onClick={(e) => {
            e.stopPropagation();  // Impede que o clique propague e acione a navegação
            handleMenuClick(e, menu.rota);  // Usando a função de navegação
          }}
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
        onClick={(e) => {
          e.stopPropagation();  // Impede que o clique no ícone de configurações dispare navegação
          handleRodaDentadaClick(e, rotaAtual);  // Abre o modal
        }}
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
      fechar={fecharModal}  // Fechar o modal e navegar
      onAtualizar={onAtualizarEventos}
    />
  </div>
);

