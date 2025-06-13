import { useState } from "react";

export default function LoginPage({ onLoginSuccess }) {
  const [utilizador, setUtilizador] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");

  const autenticar = () => {
    if (utilizador === "bigdealer" && password === "1091") {
      onLoginSuccess();
    } else {
      setErro("Credenciais inválidas. Tente novamente.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    autenticar();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Nome de Utilizador</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded"
              value={utilizador}
              onChange={(e) => setUtilizador(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {erro && <p className="text-red-500 text-sm">{erro}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
