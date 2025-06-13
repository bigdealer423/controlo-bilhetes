import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("autenticado");
    navigate("/");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <button onClick={() => navigate("/listagem-vendas")} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Listagem de Vendas
        </button>
        <button onClick={() => navigate("/eventos")} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Eventos
        </button>
        <button onClick={() => navigate("/info-clubes")} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Info Clubes
        </button>
        <button onClick={() => navigate("/disputas")} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Disputas
        </button>
        <button onClick={() => navigate("/compras")} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Compras
        </button>
        <button onClick={() => navigate("/outro-menu")} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Outro Menu
        </button>
      </div>

      <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
        Logout
      </button>
    </div>
  );
}
