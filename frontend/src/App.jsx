import { useEffect, useState } from "react";

export default function App() {
  const [eventos, setEventos] = useState([]);
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
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("https://controlo-bilhetes.onrender.com/eventos")
      .then(res => res.json())
      .then(setEventos)
      .catch(console.error);
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setNovoEvento(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const adicionarEvento = () => {
    fetch("https://controlo-bilhetes.onrender.com/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...novoEvento, id: parseInt(novoEvento.id) })
    })
      .then(res => res.json())
      .then(() => {
        setShowModal(false);
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
        return fetch("https://controlo-bilhetes.onrender.com/eventos").then(res => res.json());
      })
      .then(setEventos);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gestão de Bilhetes</h1>

      <button
        onClick={() => setShowModal(true)}
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        + Adicionar Evento
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-xl">
            <h2 className="text-lg font-semibold mb-4">Novo Evento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="id" type="number" className="input" placeholder="ID" value={novoEvento.id} onChange={handleChange} />
              <input name="nome" className="input" placeholder="Nome" value={novoEvento.nome} onChange={handleChange} />
              <input name="data" className="input" placeholder="Data" value={novoEvento.data} onChange={handleChange} />
              <input name="local" className="input" placeholder="Local" value={novoEvento.local} onChange={handleChange} />
              <input name="gasto" type="number" className="input" placeholder="Gasto" value={novoEvento.gasto} onChange={handleChange} />
              <input name="ganho" type="number" className="input" placeholder="Ganho" value={novoEvento.ganho} onChange={handleChange} />
              <label className="flex items-center space-x-2">
                <input name="pago" type="checkbox" checked={novoEvento.pago} onChange={handleChange} />
                <span>Pago</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={adicionarEvento}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded p-4 mt-4">
        <h2 className="text-lg font-semibold mb-2">Eventos</h2>
        <table className="min-w-full border text-sm text-left text-gray-700">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Nome</th>
              <th className="p-2">Data</th>
              <th className="p-2">Local</th>
              <th className="p-2">Gasto</th>
              <th className="p-2">Ganho</th>
              <th className="p-2">Lucro</th>
              <th className="p-2">Pago</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map(e => (
              <tr key={e.id} className="border-t">
                <td className="p-2">{e.nome}</td>
                <td className="p-2">{e.data}</td>
                <td className="p-2">{e.local}</td>
                <td className="p-2">{e.gasto} €</td>
                <td className="p-2">{e.ganho} €</td>
                <td className="p-2">{(e.ganho - e.gasto).toFixed(2)} €</td>
                <td className="p-2">{e.pago ? "✅" : "❌"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}