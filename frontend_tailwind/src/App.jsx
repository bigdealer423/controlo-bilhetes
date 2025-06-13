
import { useState, useEffect } from "react";

export default function App() {
  const [eventos, setEventos] = useState([]);
  const [showModal, setShowModal] = useState(false);
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

  const buscarEventos = () => {
    fetch("https://controlo-bilhetes.onrender.com/eventos")
      .then(res => res.json())
      .then(data => setEventos(data));
  };

  useEffect(() => {
    buscarEventos();
  }, []);

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
        setNovoEvento({ id: "", nome: "", data: "", local: "", gasto: 0, ganho: 0, pago: false, bilhetes: [] });
        setShowModal(false);
      });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Gestão de Eventos</h1>
      <button onClick={() => setShowModal(true)} className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
        + Adicionar Evento
      </button>

      <div className="bg-white shadow rounded">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Nome</th><th className="p-2">Data</th><th className="p-2">Local</th>
              <th className="p-2">Gasto</th><th className="p-2">Ganho</th><th className="p-2">Lucro</th><th className="p-2">Pago</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map(ev => (
              <tr key={ev.id} className="border-t">
                <td className="p-2">{ev.nome}</td>
                <td className="p-2">{ev.data}</td>
                <td className="p-2">{ev.local}</td>
                <td className="p-2">{ev.gasto} €</td>
                <td className="p-2">{ev.ganho} €</td>
                <td className="p-2">{(ev.ganho - ev.gasto).toFixed(2)} €</td>
                <td className="p-2">{ev.pago ? "✅" : "❌"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-xl">
            <h2 className="text-lg font-semibold mb-4">Novo Evento</h2>
            <div className="grid grid-cols-2 gap-3">
              <input name="id" type="number" className="border p-2" placeholder="ID" value={novoEvento.id} onChange={handleChange} />
              <input name="nome" className="border p-2" placeholder="Nome" value={novoEvento.nome} onChange={handleChange} />
              <input name="data" className="border p-2" placeholder="Data" value={novoEvento.data} onChange={handleChange} />
              <input name="local" className="border p-2" placeholder="Local" value={novoEvento.local} onChange={handleChange} />
              <input name="gasto" type="number" className="border p-2" placeholder="Gasto" value={novoEvento.gasto} onChange={handleChange} />
              <input name="ganho" type="number" className="border p-2" placeholder="Ganho" value={novoEvento.ganho} onChange={handleChange} />
              <label className="col-span-2 flex items-center space-x-2">
                <input name="pago" type="checkbox" checked={novoEvento.pago} onChange={handleChange} />
                <span>Pago</span>
              </label>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-400 text-white rounded">Cancelar</button>
              <button onClick={guardarEvento} className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
