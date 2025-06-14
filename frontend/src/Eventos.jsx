import { useState, useEffect } from "react";

export default function Eventos() {
  const [registos, setRegistos] = useState([]);
  const [novoEvento, setNovoEvento] = useState({
    data_evento: "",
    evento: "",
    estadio: "",
    gasto: "",
    ganho: 0,
    estado: "Por entregar"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoEvento((prev) => ({ ...prev, [name]: value }));
  };

  const buscarEventos = () => {
    fetch("https://controlo-bilhetes.onrender.com/eventos_completos")
      .then((res) => res.json())
      .then((data) => setRegistos(data))
      .catch((err) => console.error("Erro ao carregar eventos:", err));
  };

  const adicionarEvento = () => {
    fetch("https://controlo-bilhetes.onrender.com/eventos_completos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novoEvento,
        gasto: parseFloat(novoEvento.gasto),
        ganho: parseFloat(novoEvento.ganho)
      }),
    })
      .then((res) => res.json())
      .then(() => {
        buscarEventos();
        setNovoEvento({
          data_evento: "",
          evento: "",
          estadio: "",
          gasto: "",
          ganho: 0,
          estado: "Por entregar"
        });
      });
  };

  useEffect(() => {
    buscarEventos();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Resumo de Eventos</h1>

      <div className="bg-white shadow-md rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Adicionar Evento</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input name="data_evento" type="date" className="input" value={novoEvento.data_evento} onChange={handleChange} />
          <input name="evento" className="input" placeholder="Evento" value={novoEvento.evento} onChange={handleChange} />
          <input name="estadio" className="input" placeholder="Estádio" value={novoEvento.estadio} onChange={handleChange} />
          <input name="gasto" type="number" className="input" placeholder="Gasto (€)" value={novoEvento.gasto} onChange={handleChange} />
          <input name="ganho" type="number" className="input" placeholder="Ganho (€)" value={novoEvento.ganho} onChange={handleChange} />
          <select name="estado" className="input" value={novoEvento.estado} onChange={handleChange}>
            <option value="Entregue">Entregue</option>
            <option value="Por entregar">Por entregar</option>
            <option value="Disputa">Disputa</option>
            <option value="Pago">Pago</option>
          </select>
        </div>
        <button onClick={adicionarEvento} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Guardar Evento
        </button>
      </div>

      <div className="bg-white shadow-md rounded p-4">
        <table className="min-w-full border text-sm text-left text-gray-600">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Data Evento</th>
              <th className="p-2">Evento</th>
              <th className="p-2">Estádio</th>
              <th className="p-2">Gasto</th>
              <th className="p-2">Ganho</th>
              <th className="p-2">Lucro</th>
              <th className="p-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {registos.map((r) => (
              <tr key={r.id} className={r.estado === "Pago" ? "bg-green-100" : ""}>
                <td className="p-2">{r.data_evento}</td>
                <td className="p-2">{r.evento}</td>
                <td className="p-2">{r.estadio}</td>
                <td className="p-2">{r.gasto} €</td>
                <td className="p-2">{r.ganho} €</td>
                <td className="p-2">{(r.ganho - r.gasto).toFixed(2)} €</td>
                <td className="p-2">{r.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
