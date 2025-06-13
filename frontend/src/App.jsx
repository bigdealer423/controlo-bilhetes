import { useState } from "react";
import LoginPage from "./LoginPage";
import ListagemVendas from "./ListagemVendas"; // este é o que já tem
// Placeholder para os outros menus:
const Eventos = () => <div>Eventos</div>;
const InfoClubes = () => <div>Info Clubes</div>;
const Disputas = () => <div>Disputas</div>;
const Compras = () => <div>Compras</div>;
const OutroMenu = () => <div>Outro menu</div>;

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
        return <div>Menu inválido</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de navegação */}
      <nav className="bg-white shadow mb-4">
        <ul className="flex justify-between items-center px-4 py-2">
          <div className="flex space-x-4">
            <li><button onClick={() => setMenuAtivo("vendas")} className="hover:underline">Listagem Vendas</button></li>
            <li><button onClick={() => setMenuAtivo("eventos")} className="hover:underline">Eventos</button></li>
            <li><button onClick={() => setMenuAtivo("clubes")} className="hover:underline">Info Clubes</button></li>
            <li><button onClick={() => setMenuAtivo("disputas")} className="hover:underline">Disputas</button></li>
            <li><button onClick={() => setMenuAtivo("compras")} className="hover:underline">Compras</button></li>
            <li><button onClick={() => setMenuAtivo("outro")} className="hover:underline">Outro</button></li>
          </div>
          <li>
            <button onClick={() => setLogado(false)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Logout</button>
          </li>
        </ul>
      </nav>

      {/* Conteúdo da página */}
      {renderConteudo()}
    </div>
  );
}

