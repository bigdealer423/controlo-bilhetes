import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Dashboard() {
  const { autenticado, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!autenticado) {
      navigate("/");
    }
  }, [autenticado, navigate]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex justify-end p-4">
      <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Logout</button>
    </div>
  );
}
