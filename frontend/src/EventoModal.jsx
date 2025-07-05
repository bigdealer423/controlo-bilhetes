// src/EventoModal.jsx
import { useEffect, useState } from "react";

const ordenarEventosDropdown = (data) => {
  return [...data].sort((a, b) => {
    const nomeA = a.nome.toLowerCase();
    const nomeB = b.nome.toLowerCase();

    const prioridade = (nome) => {
      if (nome.startsWith("sl benfica")) return 0;
      if (nome.startsWith("benfica")) return 1;
      return 2;
    };

    const pA = prioridade(nomeA);
    const pB = prioridade(nomeB);

    if (pA !== pB) return pA - pB;
    return nomeA.localeCompare(nomeB);
  });
};

export default function EventoModal({ visivel, fechar, onAtualizar }) {
  const [eventos, setEventos] = useState([]);
  const [novoEvento, setNovoEvento] = useState("");
  const [modoEdicao, setModoEdicao] = useState(null);
  const [eventoEditado, setEventoEditado] = useState("");

  useEffect(() => {
    if (visivel) buscarEventos();
  }, [visivel]);

  const buscarEventos = async () => {
    try {
      const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown");
      const data = await res.json();
      const ordenados = ordenarEventosDropdown(data);
      setEventos(ordenados);
      onAtualizar?.();
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

  const guardarEdicao = async (evento) => {
    if (!eventoEditado.trim()) return;
    try {
      const res = await fetch(`https://controlo-bilhetes.onrender.com/eventos_dropdown/${evento.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: eventoEditado })
      });
      if (res.ok) {
        setModoEdicao(null);
        setEventoEditado("");
        buscarEventos();
      }
    } catch (err) {
      console.error("Erro ao editar evento:", err);
    }
  };

  if (!visivel) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={fechar}
    >
      <div    
        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded shadow-lg w-[95vw] max-w-3xl min-h-[60vh] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // ⛔ Impede que o clique no interior feche o modal
      >
        <h2 className="text-lg font-bold mb-4">Gerir Eventos</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="border px-2 py-1 flex-grow mr-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
            placeholder="Novo evento"
            value={novoEvento}
            onChange={e => setNovoEvento(e.target.value)}
          />
          <button
            onClick={adicionarEvento}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Adicionar
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto">
          {eventos.map(e => (
            <li key={e.id} className="flex justify-between items-center border-b py-1">
              {modoEdicao === e.id ? (
                <>
                  <input
                    type="text"
                    className="border px-2 py-1 flex-grow mr-2"
                    value={eventoEditado}
                    onChange={(ev) => setEventoEditado(ev.target.value)}
                  />
                  <button
                    onClick={() => guardarEdicao(e)}
                    className="text-green-600 hover:underline mr-2"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setModoEdicao(null);
                      setEventoEditado("");
                    }}
                    className="text-gray-600 hover:underline"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <span>{e.nome}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setModoEdicao(e.id);
                        setEventoEditado(e.nome);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarEvento(e.id)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="text-right mt-4">
          <button
            onClick={fechar}
            className="text-gray-600 hover:text-black"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
