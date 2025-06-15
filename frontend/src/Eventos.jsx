import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function Eventos() {
  const [registos, setRegistos] = useState([]);
  const [modoEdicao, setModoEdicao] = useState(null);
  const [linhaExpandida, setLinhaExpandida] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [eventoAEliminar, setEventoAEliminar] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const carregarDados = async () => {
      await buscarVendas();
      await buscarCompras();
    };
    carregarDados();
  }, []);

  useEffect(() => {
    if (vendas.length && compras.length) {
      buscarEventos();
    }
  }, [vendas, compras]);

  const buscarEventos = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2");
    if (res.ok) {
      let eventos = await res.json();

      eventos = eventos.map(evento => {
        const totalGasto = compras
          .filter(c => c.evento === evento.evento)
          .reduce((acc, curr) => acc + parseFloat(curr.gasto || 0), 0);

        const totalGanho = vendas
          .filter(v => v.evento === evento.evento)
          .reduce((acc, curr) => acc + parseFloat(curr.ganho || 0), 0);

        return {
          ...evento,
          gasto: totalGasto,
          ganho: totalGanho,
        };
      });

      eventos.sort((a, b) => new Date(a.data_evento) - new Date(b.data_evento));

      setRegistos(eventos);
    } else {
      console.error("Erro ao carregar eventos.");
    }
  };

  const buscarVendas = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/listagem_vendas");
    if (res.ok) setVendas(await res.json());
  };

  const buscarCompras = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/compras");
    if (res.ok) setCompras(await res.json());
  };

  const atualizarCampo = async (id, campo, valor) => {
    const registo = registos.find(r => r.id === id);
    if (!registo) return;

    const atualizado = { ...registo, [campo]: valor };
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(atualizado)
    });
    if (res.ok) buscarEventos();
  };

  const adicionarLinha = async () => {
    const novo = {
      data_evento: new Date().toISOString().split("T")[0],
      evento: "",
      estadio: "",
      gasto: 0,
      ganho: 0,
      estado: "Por entregar"
    };
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novo)
    });
    if (res.ok) buscarEventos();
  };

  const confirmarEliminar = (id) => {
    setEventoAEliminar(id);
    setModalVisivel(true);
  };

  const eliminarRegisto = async () => {
    if (!eventoAEliminar) return;
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2/" + eventoAEliminar, {
      method: "DELETE"
    });
    if (res.ok) {
      setModalVisivel(false);
      setEventoAEliminar(null);
      buscarEventos();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Resumo de Eventos</h1>

      <button onClick={adicionarLinha} className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Adicionar Evento
      </button>

      <div className="bg-white shadow-md rounded p-4">
        <table className="min-w-full border text-sm text-left text-gray-600">
          <thead>
            <tr className="bg-gray-100">
              <th></th>
              <th className="p-2">Data</th>
              <th className="p-2">Evento</th>
              <th className="p-2">Estádio</th>
              <th className="p-2">Gasto</th>
              <th className="p-2">Ganho</th>
              <th className="p-2">Lucro</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {registos.map(r => (
              <tr key={r.id} className={`cursor-pointer ${r.estado === "Pago" ? "bg-green-100" : ""}`}>
                <td className="p-2">
                  <button onClick={() => setLinhaExpandida(linhaExpandida === r.id ? null : r.id)}>
                    {linhaExpandida === r.id ? "🔼" : "🔽"}
                  </button>
                </td>
                <td className="p-2">{r.data_evento}</td>
                <td className="p-2">{r.evento}</td>
                <td className="p-2">{r.estadio}</td>
                <td className="p-2">{r.gasto} €</td>
                <td className="p-2">{r.ganho} €</td>
                <td className="p-2">{(r.ganho - r.gasto).toFixed(2)} €</td>
                <td className="p-2">{r.estado}</td>
                <td className="p-2">
                  <button onClick={() => confirmarEliminar(r.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalVisivel && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded shadow-lg">
            <p className="mb-4">Tem a certeza que deseja eliminar este evento?</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setModalVisivel(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
              <button onClick={eliminarRegisto} className="bg-red-600 text-white px-4 py-2 rounded">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


