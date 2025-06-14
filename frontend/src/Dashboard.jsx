import { useNavigate, useLocation } from "react-router-dom";
import { FiSettings } from "react-icons/fi";

export default function Dashboard({ abrirModal }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menus = [
    { nome: "Listagem de Vendas", rota: "/listagem-vendas" },
    { nome: "Eventos", rota: "/eventos" },
    { nome: "Info Clubes", rota: "/info-clubes" },
    { nome: "Disputas", rota: "/disputas" },
    { nome: "Compras", rota: "/compras" },
    { nome: "Outro Menu", rota: "/outro" }
  ];

  const sair = () => {
    localStorage.removeItem("autenticado");
    navigate("/");
  };

  return (
    <div className="flex justify-between items-center bg-white shadow px-4 py-2 mb-4">
      {/* Menus de navegação */}
      <div className="flex gap-2 flex-wrap">
        {menus.map((menu) => (
          <button
            key={menu.rota}
            onClick={() => navigate(menu.rota)}
            className={`px-3 py-1 text-sm rounded transition ${
              location.pathname === menu.rota
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-blue-100"
            }`}
          >
            {menu.nome}
          </button>
        ))}
      </div>

      {/* Ícones de definições e logout */}
      <div className="flex items-center gap-4">
        {/* Roda dentada */}
        <FiSettings
          onClick={abrirModal}
          className="text-2xl text-gray-700 cursor-pointer hover:text-blue-600"
          title="Definições"
        />

        {/* Logout */}
        <button
          onClick={sair}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
