import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  // ⚫ Ativar dark mode por defeito ao entrar na página
  useEffect(() => {
    document.documentElement.classList.add("dark");
    setVisible(true); // ativa animação ao montar

    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault(); // previne reload do form

    if (username === "bigdealer" && password === "1091") {
      login();
      navigate("/");
    } else {
      alert("Credenciais inválidas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100 transition-colors duration-300">
      <div
        className={`bg-gray-800 p-8 rounded shadow-md w-full max-w-sm transform transition-all duration-500 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nome de utilizador"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 rounded bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors duration-300"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
