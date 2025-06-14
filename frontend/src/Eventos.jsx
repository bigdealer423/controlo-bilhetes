import { useEffect, useState } from "react";

export default function Eventos() {
  const [registos, setRegistos] = useState([]);
  const [eventosDropdown, setEventosDropdown] = useState([]);
  const [novoRegisto, setNovoRegisto] = useState({
    data_evento: "",
    evento: "",
    estadio: "",
    gasto: "",
    ganho: "",
    estado: "Por entregar"
  });
  const [modoEdicao, setModoEdicao] = useState(null);

  useEffect(() => {
    buscarEventos();
    buscarDropdown();
  }, []);

  const buscarEventos = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos");
    const data = await res.json();
    setRegistos(data);
  };

  const buscarDropdown = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown");
    const data = await res.json();
    setEventosDropdown(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoRegisto((prev) => ({ ...prev, [name]: value }));
  };

  const guardarRegisto = async () => {
    await fetch("https://controlo-bilhetes.onrender.com/eventos_completos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novoRegisto,
        gasto: parseFloat(novoRegisto.gasto) || 0,
ganho: parseFloat(novoRegisto.ganho) || 0
      })
    });
    setNovoRegisto({
      data_evento: "",
      evento: "",
      estadio: "",
      gasto: "",
      ganho: "",
      estado: "Por entregar"
    });
    buscarEventos();
  };

  const editarRegisto = (registo) => {
    setModoEdicao(registo.id);
    setNovoRegisto({ ...registo });
  };

  const atualizarRegisto = async () => {
    await fetch('https://controlo-bilhetes.onrender.com/eventos_completos/' + modoEdicao, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novoRegisto,
        gasto: parseFloat(novoRegisto.gasto) || 0,
ganho: parseFloat(novoRegisto.ganho) || 0
      })
    });
    setModoEdicao(null);
    setNovoRegisto({
      data_evento: "",
      evento: "",
      estadio: "",
      gasto: "",
      ganho: "",
      estado: "Por entregar"
    });
    buscarEventos();
  };

  const eliminarRegisto = async (id) => {
    await fetch('https://controlo-bilhetes.onrender.com/eventos_completos/' + id, {
      method: "DELETE"
    });
    buscarEventos();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Resumo de Eventos</h1>

      <div className="bg-white shadow-md rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">{modoEdicao ? "Editar Evento" : "Adicionar Evento"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input name="data_evento" type="date" className="input" value={novoRegisto.data_evento} onChange={handleChange} />
          <select name="evento" className="input" value={novoRegisto.evento} onChange={handleChange}>
            <option value="">-- Selecionar Evento --</option>
            {eventosDropdown.map(e => (
              <option key={e.id} value={e.nome}>{e.nome}</option>
            ))}
          </select>
          <input name="estadio" className="input" placeholder="Estádio" value={novoRegisto.estadio} onChange={handleChange} />
          <input name="gasto" type="number" className="input" placeholder="Gasto (€)" value={novoRegisto.gasto} onChange={handleChange} />
          <input name="ganho" type="number" className="input" placeholder="Ganho (€)" value={novoRegisto.ganho} onChange={handleChange} />
          <select name="estado" className="input" value={novoRegisto.estado} onChange={handleChange}>
            <option value="Entregue">Entregue</option>
            <option value="Por entregar">Por entregar</option>
            <option value="Disputa">Disputa</option>
            <option value="Pago">Pago</option>
          </select>
        </div>
        <button
          onClick={modoEdicao ? atualizarRegisto : guardarRegisto}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {modoEdicao ? "Atualizar" : "Guardar"}
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
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {registos.map(r => (
              <tr key={r.id} className={r.estado === "Pago" ? "bg-green-100" : "border-t"}>
                <td className="p-2">{r.data_evento}</td>
                <td className="p-2">{r.evento}</td>
                <td className="p-2">{r.estadio}</td>
                <td className="p-2">{r.gasto} €</td>
                <td className="p-2">{r.ganho} €</td>
                <td className="p-2">{(r.ganho - r.gasto).toFixed(2)} €</td>
                <td className="p-2">{r.estado}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => editarRegisto(r)} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => eliminarRegisto(r.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
