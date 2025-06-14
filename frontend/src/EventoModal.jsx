// src/EventoModal.jsx
import { useEffect, useState } from "react";

export default function EventoModal({ visivel, fechar }) {
  const [eventos, setEventos] = useState([]);
  const [novoEvento, setNovoEvento] = useState("");

  useEffect(() => {
    if (visivel) buscarEventos();
  }, [visivel]);

  const buscarEventos = async () => {
    try {
      const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown");
      const data = await res.json();
      setEventos(data);
    } catch (err) {
      console.error("Erro ao buscar eventos:", err);
    }
  };

  const adicionarEvento = async () => {
    if (!novoEvento.trim()) return;
    try {
      const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoEvento })
      });
      if (res.ok) {
        setNovoEvento("");
        buscarEventos();
      }
    } catch (err) {
      console.error("Erro ao adicionar evento:", err);
    }
  };

  const eliminarEvento = async (id) => {
    try {
      await fetch(`https://controlo-bilhetes.onrender.com/eventos_dropdown/${id}`, {
        method: "DELETE"
      });
      buscarEventos();
    } catch (err) {
      console.error("Erro ao eliminar evento:", err);
    }
  };

  if (!visivel) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-lg font-bold mb-4">Gerir Eventos</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="border px-2 py-1 flex-grow"
            placeholder="Novo evento"
            value={novoEvento}
            onChange={e => setNovoEvento(e.target.value)}
          />
          <button onClick={adicionarEvento} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Adicionar</button>
        </div>
        <ul className="max-h-40 overflow-y-auto">
          {eventos.map(e => (
            <li key={e.id} className="flex justify-between items-center border-b py-1">
              <span>{e.nome}</span>
              <button onClick={() => eliminarEvento(e.id)} className="text-red-600 hover:underline">Eliminar</button>
            </li>
          ))}
        </ul>
        <div className="text-right mt-4">
          <button onClick={fechar} className="text-gray-600 hover:text-black">Fechar</button>
        </div>
      </div>
    </div>
  );
}
