import { useEffect, useState } from "react";

export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [comprasFiltradas, setComprasFiltradas] = useState([]);
  const [eventosDropdown, setEventosDropdown] = useState([]);
  const [novaCompra, setNovaCompra] = useState({
    evento: "", local_compras: "", bancada: "", setor: "", fila: "", quantidade: "", gasto: ""
  });
  const [modoEdicao, setModoEdicao] = useState(null);
  const [confirmarEliminarId, setConfirmarEliminarId] = useState(null);
  const [filtros, setFiltros] = useState({ evento: "" });

  const locaisCompra = ["Benfica Viagens", "Site Benfica", "Odisseias", "Continente", "Site clube adversário", "Smartfans", "Outro"];
  const bancadas = ["Emirates", "BTV", "Sagres", "Mais vantagens"];
  const setores = [...Array.from({ length: 32 }, (_, i) => "lower " + (i + 1)),
                   ...Array.from({ length: 43 }, (_, i) => "middle " + (i + 1)),
                   ...Array.from({ length: 44 }, (_, i) => "upper " + (i + 1))];

  useEffect(() => {
    buscarCompras();
    buscarEventos();
  }, []);

  const buscarCompras = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/compras");
    const data = await res.json();
    setCompras(data);
    setComprasFiltradas(data);
  };

  const buscarEventos = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown");
    const data = await res.json();
    setEventosDropdown(data);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setNovaCompra(prev => ({ ...prev, [name]: value }));
  };

  const handleFiltroChange = e => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const aplicarFiltros = () => {
    let resultado = [...compras];
    if (filtros.evento) resultado = resultado.filter(c => c.evento === filtros.evento);
    setComprasFiltradas(resultado);
  };

  const limparFiltros = () => {
    setFiltros({ evento: "" });
    setComprasFiltradas(compras);
  };

  const guardarCompra = async () => {
    await fetch("https://controlo-bilhetes.onrender.com/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novaCompra,
        quantidade: parseInt(novaCompra.quantidade),
        gasto: parseFloat(novaCompra.gasto)
      })
    });
    setNovaCompra({ evento:"", local_compras:"", bancada:"", setor:"", fila:"", quantidade:"", gasto:"" });
    buscarCompras();
  };

  const editarCompra = compra => {
    setModoEdicao(compra.id);
    setNovaCompra({ ...compra });
  };

  const atualizarCompra = async () => {
    await fetch(`https://controlo-bilhetes.onrender.com/compras/${modoEdicao}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novaCompra,
        quantidade: parseInt(novaCompra.quantidade),
        gasto: parseFloat(novaCompra.gasto)
      })
    });
    setModoEdicao(null);
    setNovaCompra({ evento:"", local_compras:"", bancada:"", setor:"", fila:"", quantidade:"", gasto:"" });
    buscarCompras();
  };

  const pedirConfirmEliminar = id => setConfirmarEliminarId(id);
  const cancelarEliminar = () => setConfirmarEliminarId(null);

  const eliminarCompra = async id => {
    await fetch(`https://controlo-bilhetes.onrender.com/compras/${id}`, { method: "DELETE" });
    setConfirmarEliminarId(null);
    buscarCompras();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Compras</h1>

      {/* Filtro */}
      <div className="bg-gray-50 shadow-sm rounded p-4 mb-4">
        <div className="flex gap-4 items-end">
          <select name="evento" className="input" value={filtros.evento} onChange={handleFiltroChange}>
            <option value="">-- Filtrar por Evento --</option>
            {eventosDropdown.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
          </select>
          <button onClick={aplicarFiltros} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Aplicar Filtro</button>
          <button onClick={limparFiltros} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Limpar</button>
        </div>
      </div>

      {/* Form adicionar */}
      <div className="bg-white shadow-md rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">{modoEdicao ? "Editar Compra" : "Nova Compra"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select name="evento" className="input" value={novaCompra.evento} onChange={handleChange}>
            <option value="">-- Evento --</option>
            {eventosDropdown.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
          </select>
          <select name="local_compras" className="input" value={novaCompra.local_compras} onChange={handleChange}>
            <option value="">-- Local da Compra --</option>
            {locaisCompra.map(local => <option key={local} value={local}>{local}</option>)}
          </select>
          <input list="bancadas" name="bancada" className="input" placeholder="Bancada" value={novaCompra.bancada} onChange={handleChange} />
          <datalist id="bancadas">{bancadas.map(b => <option key={b} value={b} />)}</datalist>
          <input list="setores" name="setor" className="input" placeholder="Setor" value={novaCompra.setor} onChange={handleChange} />
          <datalist id="setores">{setores.map(s => <option key={s} value={s} />)}</datalist>
          <input name="fila" className="input" placeholder="Fila" value={novaCompra.fila} onChange={handleChange} />
          <input name="quantidade" type="number" className="input" placeholder="Qt." value={novaCompra.quantidade} onChange={handleChange} />
          <input name="gasto" type="text" className="input" placeholder="Gasto (€)" value={novaCompra.gasto} onChange={handleChange} />
        </div>
        <button onClick={modoEdicao ? atualizarCompra : guardarCompra}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {modoEdicao ? "Atualizar" : "Guardar"}
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white shadow-md rounded p-4 relative">
        <table className="min-w-full border text-sm text-left text-gray-600">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Evento</th>
              <th className="p-2">Local Compra</th>
              <th className="p-2">Bancada</th>
              <th className="p-2">Setor</th>
              <th className="p-2">Fila</th>
              <th className="p-2">Qt.</th>
              <th className="p-2">Gasto (€)</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {[...comprasFiltradas].sort((a, b) => a.evento.localeCompare(b.evento)).map(c => (
              <tr key={c.id} className="border-t">
                {modoEdicao === c.id ? (
                  <>
                    <td className="p-2">
                      <select name="evento" className="input" value={novaCompra.evento} onChange={handleChange}>
                        {eventosDropdown.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                      </select>
                    </td>
                    <td className="p-2">
                      <select className="input" value={novaCompra.local_compras} onChange={e => setNovaCompra({ ...novaCompra, local_compras: e.target.value })}>
                        {locaisCompra.map(local => <option key={local} value={local}>{local}</option>)}
                      </select>
                    </td>
                    <td className="p-2"><input name="bancada" className="input" value={novaCompra.bancada} onChange={handleChange} /></td>
                    <td className="p-2"><input name="setor" className="input" value={novaCompra.setor} onChange={handleChange} /></td>
                    <td className="p-2"><input name="fila" className="input" value={novaCompra.fila} onChange={handleChange} /></td>
                    <td className="p-2"><input name="quantidade" type="number" className="input" value={novaCompra.quantidade} onChange={handleChange} /></td>
                    <td className="p-2"><input name="gasto" className="input" value={novaCompra.gasto} onChange={handleChange} /></td>
                    <td className="p-2 flex gap-2">
                      <button onClick={atualizarCompra} className="text-green-600 hover:underline">Guardar</button>
                      <button onClick={() => setModoEdicao(null)} className="text-gray-600 hover:underline">Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2">{c.evento}</td>
                    <td className="p-2">{c.local_compras}</td>
                    <td className="p-2">{c.bancada}</td>
                    <td className="p-2">{c.setor}</td>
                    <td className="p-2">{c.fila}</td>
                    <td className="p-2">{c.quantidade}</td>
                    <td className="p-2">{parseInt(c.gasto)} €</td>
                    <td className="p-2 flex gap-2">
                      <button onClick={() => editarCompra(c)} className="text-blue-600 hover:underline">Editar</button>
                      <button onClick={() => pedirConfirmEliminar(c.id)} className="text-red-600 hover:underline">Eliminar</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Modal de confirmação */}
        {confirmarEliminarId !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded p-6 shadow-lg">
              <p>Tem a certeza que deseja eliminar esta compra?</p>
              <div className="mt-4 flex justify-end gap-4">
                <button onClick={() => eliminarCompra(confirmarEliminarId)} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Sim, eliminar</button>
                <button onClick={cancelarEliminar} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
