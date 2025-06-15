import { useEffect, useState } from "react";

export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [eventosDropdown, setEventosDropdown] = useState([]);
  const [modoEdicao, setModoEdicao] = useState(null);
  const [registoEditado, setRegistoEditado] = useState({});
  const [confirmaId, setConfirmaId] = useState(null);

  const locaisCompra = ["Benfica Viagens", "Site Benfica", "Odisseias", "Continente", "Site clube adversário", "Smartfans", "Outro"];
  const bancadas = ["Emirates", "BTV", "Sagres", "Mais vantagens"];
  const setores = [...Array.from({ length: 32 }, (_, i) => "lower " + (i + 1)), ...Array.from({ length: 43 }, (_, i) => "middle " + (i + 1)), ...Array.from({ length: 44 }, (_, i) => "upper " + (i + 1))];

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

  const ativarEdicao = (id, compra) => {
    setModoEdicao(id);
    setRegistoEditado({ ...compra });
  };

  const atualizarCompra = async () => {
    await fetch(`https://controlo-bilhetes.onrender.com/compras/${modoEdicao}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...registoEditado,
        quantidade: parseInt(registoEditado.quantidade),
        gasto: parseFloat(registoEditado.gasto)
      })
    });
    setModoEdicao(null);
    setRegistoEditado({});
    buscarCompras();
  };

  const eliminarCompra = async (id) => {
    await fetch(`https://controlo-bilhetes.onrender.com/compras/${id}`, {
      method: "DELETE"
    });
    setConfirmaId(null);
    buscarCompras();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Compras</h1>

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
                {modoEdicao === c.id ? (
                  <>
                    <td className="p-2">
                      <select value={registoEditado.evento} onChange={e => setRegistoEditado({ ...registoEditado, evento: e.target.value })} className="input">
                        <option value="">-- Evento --</option>
                        {eventosDropdown.map(e => (
                          <option key={e.id} value={e.nome}>{e.nome}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <select value={registoEditado.local_compras} onChange={e => setRegistoEditado({ ...registoEditado, local_compras: e.target.value })} className="input">
                        <option value="">-- Local --</option>
                        {locaisCompra.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </td>
                    <td className="p-2"><input className="input" value={registoEditado.bancada} onChange={e => setRegistoEditado({ ...registoEditado, bancada: e.target.value })} /></td>
                    <td className="p-2"><input className="input" value={registoEditado.setor} onChange={e => setRegistoEditado({ ...registoEditado, setor: e.target.value })} /></td>
                    <td className="p-2"><input className="input" value={registoEditado.fila} onChange={e => setRegistoEditado({ ...registoEditado, fila: e.target.value })} /></td>
                    <td className="p-2"><input type="number" className="input" value={registoEditado.quantidade} onChange={e => setRegistoEditado({ ...registoEditado, quantidade: e.target.value })} /></td>
                    <td className="p-2"><input type="number" className="input" value={registoEditado.gasto} onChange={e => setRegistoEditado({ ...registoEditado, gasto: e.target.value })} /></td>
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
                    <td className="p-2">{parseFloat(c.gasto).toFixed(2)} €</td>
                    <td className="p-2 flex gap-2">
                      <button onClick={() => ativarEdicao(c.id, c)} className="text-blue-600 hover:underline">Editar</button>
                      <button onClick={() => setConfirmaId(c.id)} className="text-red-600 hover:underline">Eliminar</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Confirmação */}
      {confirmaId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <p className="mb-4 text-lg">Tem a certeza que deseja eliminar esta compra?</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setConfirmaId(null)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
              <button onClick={() => eliminarCompra(confirmaId)} className="bg-red-600 text-white px-4 py-2 rounded">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

