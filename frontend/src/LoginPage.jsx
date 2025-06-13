import { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [utilizador, setUtilizador] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (utilizador === "bigdealer" && password === "1091") {
      localStorage.setItem("login", "true");
      onLogin();
    } else {
      setErro("Credenciais inválidas.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Entrar</h2>

        {erro && <p className="text-red-500 mb-4 text-center">{erro}</p>}

        <div className="mb-4">
          <label htmlFor="utilizador" className="block text-gray-700 font-medium mb-1">
            Nome de Utilizador
          </label>
          <input
            type="text"
            id="utilizador"
            name="utilizador"
            value={utilizador}
            onChange={(e) => setUtilizador(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            autoComplete="username"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 font-medium mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
