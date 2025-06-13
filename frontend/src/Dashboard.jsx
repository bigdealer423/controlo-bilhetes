import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function Dashboard() {
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

  // Ir para listagem de vendas por defeito
  useEffect(() => {
    if (location.pathname === "/dashboard") {
      navigate("/listagem-vendas");
    }
  }, [location.pathname, navigate]);

  const logout = () => {
    localStorage.removeItem("autenticado");
    navigate("/");
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          {menus.map((menu) => (
            <button
              key={menu.rota}
              onClick={() => navigate(menu.rota)}
              className={`px-3 py-1 rounded text-sm font-medium border ${
                location.pathname === menu.rota
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600 border-blue-600 hover:bg-blue-100"
              }`}
            >
              {menu.nome}
            </button>
          ))}
        </div>
        <button
          onClick={logout}
          className="px-3 py-1 rounded text-sm font-medium bg-red-600 text-white hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
