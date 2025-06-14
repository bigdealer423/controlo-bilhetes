import { useEffect, useState } from "react";

export default function EventoModal({ onClose }) {
  const [eventos, setEventos] = useState([]);
  const [novoEvento, setNovoEvento] = useState("");

  useEffect(() => {
    buscarEventos();
  }, []);

  const buscarEventos = () => {
    fetch("https://controlo-bilhetes.onrender.com/eventos-definidos")
      .then(res => res.json())
      .then(data => setEventos(data))
      .catch(err => console.error("Erro ao buscar eventos definidos:", err));
  };

  const adicionarEvento = () => {
    if (!novoEvento.trim()) return;
    fetch("https://controlo-bilhetes.onrender.com/eventos-definidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: novoEvento })
    })
      .then(() => {
        setNovoEvento("");
        buscarEventos();
      });
  };

  const eliminarEvento = (id) => {
    fetch(`https://controlo-bilhetes.onrender.com/eventos-definidos/${id}`, {
      method: "DELETE"
    })
      .then(() => buscarEventos());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-600 text-xl">&times;</button>
        <h2 className="text-lg font-bold mb-4">Eventos Definidos</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={novoEvento}
            onChange={(e) => setNovoEvento(e.target.value)}
            className="border px-2 py-1 flex-1"
            placeholder="Novo evento"
          />
          <button onClick={adicionarEvento} className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">
            Adicionar
          </button>
        </div>
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {eventos.map((e) => (
            <li key={e.id} className="flex justify-between items-center border-b py-1">
              <span>{e.nome}</span>
              <button onClick={() => eliminarEvento(e.id)} className="text-red-500 hover:text-red-700">Eliminar</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
