// LoginPage.jsx
import { useState } from "react";

export default function LoginPage({ autenticar }) {
  const [nome, setNome] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");

  const fazerLogin = () => {
    if (nome === "bigdealer" && password === "1091") {
      autenticar({ nome });
    } else {
      setErro("Credenciais inválidas.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        <input
          type="text"
          placeholder="Nome de Utilizador"
          className="input w-full mb-4"
          value={nome}
          onChange={e => setNome(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="input w-full mb-4"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {erro && <p className="text-red-600 text-sm mb-4">{erro}</p>}
        <button
          onClick={fazerLogin}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
