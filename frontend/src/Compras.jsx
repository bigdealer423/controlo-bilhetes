import { useEffect, useState } from "react";

export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [novaCompra, setNovaCompra] = useState({
    local: "",
    bancada: "",
    setor: "",
    fila: "",
    quantidade: "",
    gasto: ""
  });

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovaCompra(prev => ({ ...prev, [name]: value }));
  };

  const guardarCompra = () => {
    setCompras([...compras, { ...novaCompra }]);
    setNovaCompra({
      local: "",
      bancada: "",
      setor: "",
      fila: "",
      quantidade: "",
      gasto: ""
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Compras</h1>

      <div className="bg-white shadow-md rounded p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select name="local" className="input" value={novaCompra.local} onChange={handleChange}>
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
          onClick={guardarCompra}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Guardar
        </button>
      </div>

      <div className="bg-white shadow-md rounded p-4">
        <table className="min-w-full border text-sm text-left text-gray-600">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Local</th>
              <th className="p-2">Bancada</th>
              <th className="p-2">Setor</th>
              <th className="p-2">Fila</th>
              <th className="p-2">Qt.</th>
              <th className="p-2">Gasto (€)</th>
            </tr>
          </thead>
          <tbody>
            {compras.map((c, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2">{c.local}</td>
                <td className="p-2">{c.bancada}</td>
                <td className="p-2">{c.setor}</td>
                <td className="p-2">{c.fila}</td>
                <td className="p-2">{c.quantidade}</td>
                <td className="p-2">{parseFloat(c.gasto).toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
