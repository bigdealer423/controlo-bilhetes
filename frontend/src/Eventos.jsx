import { useEffect, useState } from "react";More actions

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
  const [linhaExpandida, setLinhaExpandida] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [compras, setCompras] = useState([]);

  useEffect(() => {
    buscarEventos();
    buscarDropdown();
    buscarVendas();
    buscarCompras();
  }, []);

  const buscarEventos = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2");
    if (res.ok) {
      const data = await res.json();
      setRegistos(data);
    } else {
      console.error("Erro ao carregar eventos.");
    }
  };

  const buscarDropdown = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown");
    if (res.ok) {
      const data = await res.json();
      setEventosDropdown(data);
    } else {
      console.error("Erro ao carregar dropdown.");
    }
  };

  const buscarVendas = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/listagem_vendas");
    if (res.ok) {
      setVendas(await res.json());
    }
  };

  const buscarCompras = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/compras");
    if (res.ok) {
      setCompras(await res.json());
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoRegisto((prev) => ({ ...prev, [name]: value }));
  };

  const guardarRegisto = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novoRegisto,
        gasto: parseFloat(novoRegisto.gasto) || 0,
        ganho: parseFloat(novoRegisto.ganho) || 0
      })
    });
    if (res.ok) {
      setNovoRegisto({
        data_evento: "",
        evento: "",
        estadio: "",
        gasto: "",
        ganho: "",
        estado: "Por entregar"
      });
      buscarEventos();
    } else {
      console.error("Erro ao guardar evento.");
    }
  };

  const editarRegisto = (registo) => {
    setModoEdicao(registo.id);
    setNovoRegisto({ ...registo });
  };

  const atualizarRegisto = async () => {
    const res = await fetch('https://controlo-bilhetes.onrender.com/eventos_completos2/' + modoEdicao, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novoRegisto,
        gasto: parseFloat(novoRegisto.gasto) || 0,
        ganho: parseFloat(novoRegisto.ganho) || 0
      })
    });
    if (res.ok) {
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
    } else {
      console.error("Erro ao atualizar evento.");
    }
  };

  const eliminarRegisto = async (id) => {
    const res = await fetch('https://controlo-bilhetes.onrender.com/eventos_completos2/' + id, {
      method: "DELETE"
    });
    if (res.ok) buscarEventos();
    else console.error("Erro ao eliminar.");
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
              <>
                <tr key={r.id} onClick={() => setLinhaExpandida(linhaExpandida === r.id ? null : r.id)} className={r.estado === "Pago" ? "bg-green-100 cursor-pointer" : "border-t cursor-pointer"}>
                  <td className="p-2">{new Date(r.data_evento).toLocaleDateString("pt-PT")}</td>
                  <td className="p-2">{r.evento}</td>
                  <td className="p-2">{r.estadio}</td>
                  <td className="p-2">{r.gasto} €</td>
                  <td className="p-2">{r.ganho} €</td>
                  <td className="p-2">{(r.ganho - r.gasto).toFixed(2)} €</td>
                  <td className="p-2">{r.estado}</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); editarRegisto(r); }} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={(e) => { e.stopPropagation(); eliminarRegisto(r.id); }} className="text-red-600 hover:underline">Eliminar</button>
                  </td>
                </tr>
                {linhaExpandida === r.id && (
                  <>
                    {vendas.some(v => v.evento === r.evento) && (
                      <>
                        <tr className="bg-gray-50">
                          <td colSpan="8" className="p-2 font-semibold">Vendas</td>
                        </tr>
                        <tr className="bg-gray-100 text-xs font-bold">
                          <td className="p-2">ID Venda</td>
                          <td className="p-2">Bilhetes</td>
                          <td className="p-2">Ganho</td>
                          <td className="p-2">Estado</td>
                          <td colSpan="4"></td>
                        </tr>
                        {vendas.filter(v => v.evento === r.evento).map(v => (
                          <tr key={"v" + v.id} className="text-xs bg-white border-t">
                            <td className="p-2">{v.id_venda}</td>
                            <td className="p-2">{v.estadio}</td>
                            <td className="p-2">{v.ganho} €</td>
                            <td className="p-2">{v.estado}</td>
                            <td colSpan="4"></td>
                          </tr>
                        ))}
                      </>
                    )}
                    {compras.some(c => c.evento === r.evento) && (
                      <>
                        <tr className="bg-gray-50">
                          <td colSpan="8" className="p-2 font-semibold">Compras</td>
                        </tr>
                        <tr className="bg-gray-100 text-xs font-bold">
                          <td className="p-2">Local</td>
                          <td className="p-2">Bancada</td>
                          <td className="p-2">Setor</td>
                          <td className="p-2">Fila</td>
                          <td className="p-2">Qt</td>
                          <td className="p-2">Gasto</td>
                          <td colSpan="2"></td>
                        </tr>
                        {compras.filter(c => c.evento === r.evento).map(c => (
                          <tr key={"c" + c.id} className="text-xs bg-white border-t">
                            <td className="p-2">{c.local_compras}</td>
                            <td className="p-2">{c.bancada}</td>
                            <td className="p-2">{c.setor}</td>
                            <td className="p-2">{c.fila}</td>
                            <td className="p-2">{c.quantidade}</td>
                            <td className="p-2">{c.gasto} €</td>
                            <td colSpan="2"></td>
                          </tr>
                        ))}
                      </>
                    )}
                  </>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
