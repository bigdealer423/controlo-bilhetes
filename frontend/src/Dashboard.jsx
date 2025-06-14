import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();               // Atualiza o contexto
    setTimeout(() => {
      navigate("/");        // Aguarda que o estado seja atualizado
    }, 0);
  };

  return (
    <div>
      {/* ... outros menus ... */}
      <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-1 rounded">
        Logout
      </button>
    </div>
  );
}
