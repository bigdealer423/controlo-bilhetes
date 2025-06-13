import { useState } from "react";
import ListagemVendas from "./ListagemVendas";

export default function Dashboard({ onLogout }) {
  const [menuAtivo, setMenuAtivo] = useState("listagem");

  const renderConteudo = () => {
    switch (menuAtivo) {
      case "listagem":
        return <ListagemVendas />;
      case "eventos":
        return <div className="p-6">Página de Eventos (em desenvolvimento)</div>;
      case "infoClubes":
        return <div className="p-6">Informações dos Clubes (em desenvolvimento)</div>;
      case "disputas":
        return <div className="p-6">Gestão de Disputas (em desenvolvimento)</div>;
      case "compras":
        return <div className="p-6">Gestão de Compras (em desenvolvimento)</div>;
      case "outro":
        return <div className="p-6">Outro menu (por definir)</div>;
      default:
        return null;
    }
  };

  return (
    <div>
      <nav className="bg-blue-700 text-white px-4 py-3 flex justify-between items-center">
        <div className="flex space-x-4">
          <button onClick={() => setMenuAtivo("listagem")}>Listagem de Vendas</button>
          <button onClick={() => setMenuAtivo("eventos")}>Eventos</button>
          <button onClick={() => setMenuAtivo("infoClubes")}>Info Clubes</button>
          <button onClick={() => setMenuAtivo("disputas")}>Disputas</button>
          <button onClick={() => setMenuAtivo("compras")}>Compras</button>
          <button onClick={() => setMenuAtivo("outro")}>Outro</button>
        </div>
        <button onClick={onLogout} className="bg-white text-blue-700 px-3 py-1 rounded hover:bg-gray-200">
          Logout
        </button>
      </nav>
      <main className="bg-gray-50 min-h-screen">{renderConteudo()}</main>
    </div>
  );
}
