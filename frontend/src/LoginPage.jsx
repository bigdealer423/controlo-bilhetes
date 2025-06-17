import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username === "bigdealer" && password === "1091") {
      login(); // ← reativa o context
      navigate("/listagem-vendas");
    } else {
      alert("Credenciais inválidas");
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <input type="text" placeholder="Nome de utilizador" value={username} onChange={e => setUsername(e.target.value)} className="input mb-2" />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input mb-4" />
      <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Login</button>
    </div>
  );
}

