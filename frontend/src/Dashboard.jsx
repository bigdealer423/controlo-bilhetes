import { useState } from "react";
import ListagemVendas from "./ListagemVendas";
// futuramente importar Eventos, InfoClubes, etc.

export default function Dashboard({ onLogout }) {
  const [menuAtivo, setMenuAtivo] = useState("listagem");

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button onClick={() => setMenuAtivo("listagem")}>Listagem Vendas</button>
          <button onClick={() => setMenuAtivo("eventos")}>Eventos</button>
          <button onClick={() => setMenuAtivo("clubes")}>Info Clubes</button>
          <button onClick={() => setMenuAtivo("disputas")}>Disputas</button>
          <button onClick={() => setMenuAtivo("compras")}>Compras</button>
          <button onClick={() => setMenuAtivo("outro")}>Outro</button>
        </div>
        <button onClick={onLogout} className="text-red-600 font-semibold">
          Logout
        </button>
      </div>

      <div>
        {menuAtivo === "listagem" && <ListagemVendas />}
        {/* Renderizar outros menus quando forem criados */}
      </div>
    </div>
  );
}
