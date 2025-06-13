import { useState } from "react";
import ListagemVendas from "./ListagemVendas";

export default function Dashboard({ onLogout }) {
  const [menuAtivo, setMenuAtivo] = useState("Listagem de Vendas");

  const menus = [
    "Listagem de Vendas",
    "Eventos",
    "Info Clubes",
    "Disputas",
    "Compras",
    "Menu 6"
  ];

  const renderizarConteudo = () => {
    switch (menuAtivo) {
      case "Listagem de Vendas":
        return <ListagemVendas />;
      default:
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold">
              {menuAtivo} (em desenvolvimento)
            </h2>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <nav className="space-x-4">
          {menus.map((menu) => (
            <button
              key={menu}
              className={`px-3 py-1 rounded ${
                menuAtivo === menu ? "bg-blue-600" : "bg-gray-700"
              }`}
              onClick={() => setMenuAtivo(menu)}
            >
              {menu}
            </button>
          ))}
        </nav>
        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
        >
          Logout
        </button>
      </header>
      <main className="bg-gray-50">{renderizarConteudo()}</main>
    </div>
  );
}
