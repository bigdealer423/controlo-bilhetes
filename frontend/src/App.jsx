import { useState } from "react";
import LoginPage from "./LoginPage";
import ListagemVendas from "./ListagemVendas";

// Placeholder dos outros menus
const Eventos = () => <div className="p-6">Página de Eventos</div>;
const InfoClubes = () => <div className="p-6">Página de Info Clubes</div>;
const Disputas = () => <div className="p-6">Página de Disputas</div>;
const Compras = () => <div className="p-6">Página de Compras</div>;
const OutroMenu = () => <div className="p-6">Outro Menu</div>;

export default function App() {
  const [logado, setLogado] = useState(false);
  const [menuAtivo, setMenuAtivo] = useState("vendas");

  if (!logado) {
    return <LoginPage onLoginSuccess={() => setLogado(true)} />;
  }

  const renderConteudo = () => {
    switch (menuAtivo) {
      case "vendas":
        return <ListagemVendas />;
      case "eventos":
        return <Eventos />;
      case "clubes":
        return <InfoClubes />;
      case "disputas":
        return <Disputas />;
      case "compras":
        return <Compras />;
      case "outro":
        return <OutroMenu />;
      default:
        return <div className="p-6">Menu não encontrado</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra de navegação */}
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <div className="flex space-x-6">
          <button onClick={() => setMenuAtivo("vendas")} className="hover:text-blue-600">Listagem Vendas</button>
          <button onClick={() => setMenuAtivo("eventos")} className="hover:text-blue-600">Eventos</button>
          <button onClick={() => setMenuAtivo("clubes")} className="hover:text-blue-600">Info Clubes</button>
          <button onClick={() => setMenuAtivo("disputas")} className="hover:text-blue-600">Disputas</button>
          <button onClick={() => setMenuAtivo("compras")} className="hover:text-blue-600">Compras</button>
          <button onClick={() => setMenuAtivo("outro")} className="hover:text-blue-600">Outro</button>
        </div>
        <button
          onClick={() => setLogado(false)}
          className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </nav>

      {/* Conteúdo da página atual */}
      {renderConteudo()}
    </div>
  );
}

