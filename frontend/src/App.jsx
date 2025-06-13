import { useEffect, useState } from "react";

export default function App() {
  const [eventos, setEventos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [novoEvento, setNovoEvento] = useState({
    id: "",
    nome: "",
    data: "",
    local: "",
    gasto: 0,
    ganho: 0,
    pago: false,
    bilhetes: []
  });

  useEffect(() => {
    buscarEventos();
  }, []);

  const buscarEventos = () => {
    fetch("https://controlo-bilhetes.onrender.com/eventos")
      .then(res => res.json())
      .then(data => setEventos(data))
      .catch(err => console.error("Erro ao buscar eventos:", err));
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setNovoEvento(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const guardarEvento = () => {
    fetch("https://controlo-bilhetes.onrender.com/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...novoEvento, id: parseInt(novoEvento.id) })
    })
      .then(res => res.json())
      .then(() => {
        buscarEventos();
        setMostrarModal(false);
        setNovoEvento({
          id: "",
          nome: "",
          data: "",
          local: "",
          gasto: 0,
          ganho: 0,
          pago: false,
          bilhetes: []
        });
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Gestão de Bilhetes</h1>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            + Adicionar Evento
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Local</th>
                <th className="px-4 py-2">Gasto (€)</th>
                <th className="px-4 py-2">Ganho (€)</th>
                <th className="px-4 py-2">Lucro (€)</th>
                <th className="px-4 py-2">Pago</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map(e => (
                <tr key={e.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{e.nome}</td>
                  <td className="px-4 py-2">{e.data}</td>
                  <td className="px-4 py-2">{e.local}</td>
                  <td className="px-4 py-2">{e.gasto.toFixed(2)}</td>
                  <td className="px-4 py-2">{e.ganho.toFixed(2)}</td>
                  <td className="px-4 py-2">{(e.ganho - e.gasto).toFixed(2)}</td>
                  <td className="px-4 py-2 text-center">{e.pago ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl relative">
              <button
                onClick={() => setMostrarModal(false)}
                className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl"
              >
                ×
              </button>
              <h2 className="text-xl font-semibold mb-4">Novo Evento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="id" type="number" placeholder="ID" className="input" value={novoEvento.id} onChange={handleChange} />
                <input name="nome" placeholder="Nome" className="input" value={novoEvento.nome} onChange={handleChange} />
                <input name="data" placeholder="Data" className="input" value={novoEvento.data} onChange={handleChange} />
                <input name="local" placeholder="Local" className="input" value={novoEvento.local} onChange={handleChange} />
                <input name="gasto" type="number" placeholder="Gasto (€)" className="input" value={novoEvento.gasto} onChange={handleChange} />
                <input name="ganho" type="number" placeholder="Ganho (€)" className="input" value={novoEvento.ganho} onChange={handleChange} />
                <label className="flex items-center gap-2 col-span-full">
                  <input name="pago" type="checkbox" checked={novoEvento.pago} onChange={handleChange} />
                  <span>Pago</span>
                </label>
              </div>
              <button
                onClick={guardarEvento}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Guardar Evento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
