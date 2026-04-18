import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
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
    { nome: "Outro Menu", rota: "/outro" },
  ];

  const handleMenuClick = (e, menuRota) => {
    e.stopPropagation();
    navigate(menuRota);
  };

  const handleRodaDentadaClick = (e) => {
    e.stopPropagation();
    setMostrarModal(true);
  };

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1220]/95 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between px-3 py-2 md:px-4">
          {/* Menus topo */}
          <div className="hidden md:flex items-center gap-2 flex-wrap">
            {menus.map((menu) => {
              const ativo = rotaAtual === menu.rota;

              return (
                <button
                  key={menu.rota}
                  onClick={(e) => handleMenuClick(e, menu.rota)}
                  className={`group relative overflow-hidden rounded-xl px-4 py-2 text-[14px] font-semibold transition-all duration-300 border ${
                    ativo
                      ? "border-blue-400/40 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                      : "border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.08] hover:border-white/20"
                  }`}
                >
                  <span className="relative z-10">{menu.nome}</span>

                  {!ativo && (
                    <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Lado direito */}
          <div className="flex items-center gap-3 ml-4">
            <div className="scale-90 origin-center">
              <ThemeToggle />
            </div>

            <button
              onClick={handleRodaDentadaClick}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/80 transition-all duration-300 hover:bg-white/[0.08] hover:text-white hover:border-white/20"
              title="Definições"
            >
              <FiSettings size={18} />
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 transition-all duration-300 hover:bg-red-500/15 hover:text-red-300 hover:shadow-[0_0_18px_rgba(239,68,68,0.22)]"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <EventoModal
        visivel={mostrarModal}
        fechar={() => setMostrarModal(false)}
        onAtualizar={onAtualizarEventos}
      />
    </>
  );
}
