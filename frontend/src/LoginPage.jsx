import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [utilizador, setUtilizador] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const autenticar = () => {
    if (utilizador === "bigdealer" && password === "1091") {
      localStorage.setItem("autenticado", "true");
      navigate("/dashboard");
    } else {
      setErro("Credenciais inválidas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        
        <input
          type="text"
          id="utilizador"
          name="utilizador"
          placeholder="Nome de utilizador"
          className="w-full p-2 border rounded mb-4"
          value={utilizador}
          onChange={e => setUtilizador(e.target.value)}
        />

        <input
          type="password"
          id="password"
          name="password"
          placeholder="Password"
          className="w-full p-2 border rounded mb-4"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {erro && <div className="text-red-600 text-sm mb-2">{erro}</div>}

        <button
          onClick={autenticar}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}

