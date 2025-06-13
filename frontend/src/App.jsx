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

  const adicionarEvento = () => {
    fetch("https://controlo-bilhetes.onrender.com/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...novoEvento, id: parseInt(novoEvento.id) })
    })
      .then(res => res.json())
      .then(() => {
        buscarEventos();
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
        setMostrarModal(false);
      });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Gestão de Bilhetes</h1>

      <div className="flex justify-end mb-4">
        <button onClick={() => setMostrarModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow">
          + Adicionar Evento
        </button>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6">
            <h2 className="text-xl font-semibold mb-4">Novo Evento</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input name="id" type="number" className="input" placeholder="ID" value={novoEvento.id} onChange={handleChange} />
              <input name="nome" className="input" placeholder="Nome" value={novoEvento.nome} onChange={handleChange} />
              <input name="data" className="input" placeholder="Data" value={novoEvento.data} onChange={handleChange} />
              <input name="local" className="input" placeholder="Local" value={novoEvento.local} onChange={handleChange} />
              <input name="gasto" type="number" className="input" placeholder="Gasto" value={novoEvento.gasto} onChange={handleChange} />
              <input name="ganho" type="number" className="input" placeholder="Ganho" value={novoEvento.ganho} onChange={handleChange} />
              <label className="flex items-center space-x-2 col-span-full">
                <input name="pago" type="checkbox" checked={novoEvento.pago} onChange={handleChange} />
                <span>Pago</span>
              </label>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setMostrarModal(false)} className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-100">Cancelar</button>
              <button onClick={adicionarEvento} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Guardar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Eventos Existentes</h2>
        {eventos.length === 0 ? (
          <p className="text-gray-500">Ainda não existem eventos registados.</p>
        ) : (
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
                <tr key={e.id} className="border-t hover:bg-gray-50">
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
        )}
      </div>
    </div>
  );
}
