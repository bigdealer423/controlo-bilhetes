import { useEffect, useState } from "react";

export default function ListagemVendas() {
  const [registos, setRegistos] = useState([]);
  const [eventosDropdown, setEventosDropdown] = useState([]);
  const [novoRegisto, setNovoRegisto] = useState({
    id_venda: "",
    data_evento: "",
    evento: "",
    estadio: "",
    ganho: 0,
    estado: "Por entregar"
  });
  const [selecionados, setSelecionados] = useState([]);

  useEffect(() => {
    buscarRegistos();
    buscarEventosDropdown();
  }, []);

  const buscarRegistos = () => {
    fetch("https://controlo-bilhetes.onrender.com/listagem_vendas")
      .then(res => res.json())
      .then(data => setRegistos(data))
      .catch(err => console.error("Erro ao buscar registos:", err));
  };

  const buscarEventosDropdown = () => {
    fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown")
      .then(res => res.json())
      .then(data => setEventosDropdown(data))
      .catch(err => console.error("Erro ao buscar eventos:", err));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setNovoRegisto(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const adicionarRegisto = () => {
    fetch("https://controlo-bilhetes.onrender.com/listagem_vendas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novoRegisto,
        id_venda: parseInt(novoRegisto.id_venda),
        ganho: parseFloat(novoRegisto.ganho)
      })
    })
      .then(res => res.json())
      .then(() => {
        buscarRegistos();
        setNovoRegisto({
          id_venda: "",
          data_evento: "",
          evento: "",
          estadio: "",
          ganho: 0,
          estado: "Por entregar"
        });
      });
  };

  const alternarSelecionado = (id) => {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    if (selecionados.length === registos.length) {
      setSelecionados([]);
    } else {
      setSelecionados(registos.map(r => r.id));
    }
  };

  const eliminarSelecionados = () => {
    Promise.all(selecionados.map(id =>
      fetch(`https://controlo-bilhetes.onrender.com/listagem_vendas/${id}`, {
        method: "DELETE"
      })
    )).then(() => {
      buscarRegistos();
      setSelecionados([]);
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Listagem de Vendas</h1>

      <div className="bg-white shadow-md rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Adicionar Registo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input name="id_venda" type="number" className="input" placeholder="ID Venda" value={novoRegisto.id_venda} onChange={handleChange} />
          <input name="data_evento" type="date" className="input" value={novoRegisto.data_evento} onChange={handleChange} />

          <select name="evento" className="input" value={novoRegisto.evento} onChange={handleChange}>
            <option value="">-- Selecionar Evento --</option>
            {eventosDropdown.map(e => (
              <option key={e.id} value={e.nome}>{e.nome}</option>
            ))}
          </select>

          <input name="estadio" className="input" placeholder="Estádio" value={novoRegisto.estadio} onChange={handleChange} />
          <input name="ganho" type="number" className="input" placeholder="Ganho (€)" value={novoRegisto.ganho} onChange={handleChange} />
          <select name="estado" className="input" value={novoRegisto.estado} onChange={handleChange}>
            <option value="Entregue">Entregue</option>
            <option value="Por entregar">Por entregar</option>
            <option value="Disputa">Disputa</option>
            <option value="Pago">Pago</option>
          </select>
        </div>
        <button onClick={adicionarRegisto} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Guardar Registo
        </button>
      </div>

      <div className="bg-white shadow-md rounded p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Vendas</h2>
          {selecionados.length > 0 && (
            <button onClick={eliminarSelecionados} className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700">
              Eliminar Selecionados
            </button>
          )}
        </div>
        <table className="min-w-full border text-sm text-left text-gray-600">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">
                <input type="checkbox" onChange={selecionarTodos} checked={selecionados.length === registos.length} />
              </th>
              <th className="p-2">ID Venda</th>
              <th className="p-2">Data Evento</th>
              <th className="p-2">Evento</th>
              <th className="p-2">Estádio</th>
              <th className="p-2">Ganho</th>
              <th className="p-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {registos.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">
                  <input type="checkbox" checked={selecionados.includes(r.id)} onChange={() => alternarSelecionado(r.id)} />
                </td>
                <td className="p-2">{r.id_venda}</td>
                <td className="p-2">{r.data_evento}</td>
                <td className="p-2">{r.evento}</td>
                <td className="p-2">{r.estadio}</td>
                <td className="p-2">{r.ganho} €</td>
                <td className="p-2">{r.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

