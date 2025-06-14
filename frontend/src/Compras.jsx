import { useEffect, useState } from "react";

export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [eventosDropdown, setEventosDropdown] = useState([]);
  const [novaCompra, setNovaCompra] = useState({
    evento: "",
    local_compras: "",
    bancada: "",
    setor: "",
    fila: "",
    quantidade: "",
    gasto: ""
  });
  const [modoEdicao, setModoEdicao] = useState(null);

  const locaisCompra = [
    "Benfica Viagens", "Site Benfica", "Odisseias", "Continente",
    "Site clube adversário", "Smartfans", "Outro"
  ];

  const bancadas = ["Emirates", "BTV", "Sagres", "Mais vantagens"];

  const setores = [
    ...Array.from({ length: 32 }, (_, i) => "lower " + (i + 1)),
    ...Array.from({ length: 43 }, (_, i) => "middle " + (i + 1)),
    ...Array.from({ length: 44 }, (_, i) => "upper " + (i + 1))
  ];

  useEffect(() => {
    buscarCompras();
    buscarEventos();
  }, []);

  const buscarCompras = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/compras");
    const data = await res.json();
    setCompras(data);
  };

  const buscarEventos = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown");
    const data = await res.json();
    setEventosDropdown(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovaCompra(prev => ({ ...prev, [name]: value }));
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
    setNovaCompra({
      evento: "",
      local_compras: "",
      bancada: "",
      setor: "",
      fila: "",
      quantidade: "",
      gasto: ""
    });
    buscarCompras();
  };

  const editarCompra = (compra) => {
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
    setNovaCompra({
      evento: "",
      local_compras: "",
      bancada: "",
      setor: "",
      fila: "",
      quantidade: "",
      gasto: ""
    });
    buscarCompras();
  };

  const eliminarCompra = async (id) => {
    await fetch(`https://controlo-bilhetes.onrender.com/compras/${id}`, {
      method: "DELETE"
    });
    buscarCompras();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Compras</h1>

      <div className="bg-white shadow-md rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">{modoEdicao ? "Editar Compra" : "Nova Compra"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select name="evento" className="input" value={novaCompra.evento} onChange={handleChange}>
            <option value="">-- Evento --</option>
            {eventosDropdown.map(e => (
              <option key={e.id} value={e.nome}>{e.nome}</option>
            ))}
          </select>

          <select name="local_compras" className="input" value={novaCompra.local_compras} onChange={handleChange}>
            <option value="">-- Local da Compra --</option>
            {locaisCompra.map(local => (
              <option key={local} value={local}>{local}</option>
            ))}
          </select>

          <input list="bancadas" name="bancada" className="input" placeholder="Bancada" value={novaCompra.bancada} onChange={handleChange} />
          <datalist id="bancadas">
            {bancadas.map(b => <option key={b} value={b} />)}
          </datalist>

          <input list="setores" name="setor" className="input" placeholder="Setor" value={novaCompra.setor} onChange={handleChange} />
          <datalist id="setores">
            {setores.map(s => <option key={s} value={s} />)}
          </datalist>

          <input name="fila" className="input" placeholder="Fila" value={novaCompra.fila} onChange={handleChange} />
          <input name="quantidade" type="number" className="input" placeholder="Qt." value={novaCompra.quantidade} onChange={handleChange} />
          <input name="gasto" type="number" className="input" placeholder="Gasto (€)" value={novaCompra.gasto} onChange={handleChange} />
        </div>

        <button
          onClick={modoEdicao ? atualizarCompra : guardarCompra}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {modoEdicao ? "Atualizar" : "Guardar"}
        </button>
      </div>

      <div className="bg-white shadow-md rounded p-4">
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
            {compras.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.evento}</td>
                <td className="p-2">{c.local_compras}</td>
                <td className="p-2">{c.bancada}</td>
                <td className="p-2">{c.setor}</td>
                <td className="p-2">{c.fila}</td>
                <td className="p-2">{c.quantidade}</td>
                <td className="p-2">{parseFloat(c.gasto).toFixed(2)} €</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => editarCompra(c)} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => eliminarCompra(c.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

