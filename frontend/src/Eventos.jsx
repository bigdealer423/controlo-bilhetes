import { useEffect, useState } from "react";

export default function Eventos() {
  const [registos, setRegistos] = useState([]);
  const [eventosDropdown, setEventosDropdown] = useState([]);
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
    }
  };

  const buscarDropdown = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown");
    if (res.ok) {
      setEventosDropdown(await res.json());
    }
  };

  const buscarVendas = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/listagem_vendas");
    if (res.ok) setVendas(await res.json());
  };

  const buscarCompras = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/compras");
    if (res.ok) setCompras(await res.json());
  };

  const atualizarRegisto = async (id, registoAtualizado) => {
    const res = await fetch('https://controlo-bilhetes.onrender.com/eventos_completos2/' + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registoAtualizado)
    });
    if (res.ok) {
      buscarEventos();
      setModoEdicao(null);
    }
  };

  const handleInputChange = (e, id) => {
    const { name, value } = e.target;
    setRegistos((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, [name]: name === "gasto" || name === "ganho" ? parseFloat(value) || 0 : value } : r
      )
    );
  };

  const calcularTotais = (eventoNome) => {
    const totalGasto = compras.filter(c => c.evento === eventoNome).reduce((acc, cur) => acc + cur.gasto, 0);
    const totalGanho = vendas.filter(v => v.evento === eventoNome).reduce((acc, cur) => acc + cur.ganho, 0);
    return { totalGasto, totalGanho };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Resumo de Eventos</h1>
      <div className="bg-white shadow-md rounded p-4">
        <table className="min-w-full border text-sm text-left text-gray-600">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">#</th>
              <th className="p-2">Data</th>
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
            {registos.map((r) => {
              const { totalGasto, totalGanho } = calcularTotais(r.evento);
              return (
                <Fragment key={r.id}>
                  <tr className={r.estado === "Pago" ? "bg-green-100" : ""}>
                    <td className="p-2">
                      <button onClick={() => setLinhaExpandida(linhaExpandida === r.id ? null : r.id)}>
                        {linhaExpandida === r.id ? "🔼" : "🔽"}
                      </button>
                    </td>
                    <td className="p-2">{new Date(r.data_evento).toLocaleDateString("pt-PT")}</td>
                    <td className="p-2">
                      {modoEdicao === r.id ? (
                        <input name="evento" className="input" value={r.evento} onChange={(e) => handleInputChange(e, r.id)} />
                      ) : (
                        r.evento
                      )}
                    </td>
                    <td className="p-2">
                      {modoEdicao === r.id ? (
                        <input name="estadio" className="input" value={r.estadio} onChange={(e) => handleInputChange(e, r.id)} />
                      ) : (
                        r.estadio
                      )}
                    </td>
                    <td className="p-2">{totalGasto.toFixed(2)} €</td>
                    <td className="p-2">{totalGanho.toFixed(2)} €</td>
                    <td className="p-2">{(totalGanho - totalGasto).toFixed(2)} €</td>
                    <td className="p-2">
                      {modoEdicao === r.id ? (
                        <select name="estado" className="input" value={r.estado} onChange={(e) => handleInputChange(e, r.id)}>
                          <option value="Entregue">Entregue</option>
                          <option value="Por entregar">Por entregar</option>
                          <option value="Disputa">Disputa</option>
                          <option value="Pago">Pago</option>
                        </select>
                      ) : (
                        r.estado
                      )}
                    </td>
                    <td className="p-2 flex gap-2">
                      {modoEdicao === r.id ? (
                        <button onClick={() => atualizarRegisto(r.id, r)} className="text-green-600 hover:underline">Guardar</button>
                      ) : (
                        <button onClick={() => setModoEdicao(r.id)} className="text-blue-600 hover:underline">Editar</button>
                      )}
                    </td>
                  </tr>
                  {linhaExpandida === r.id && (
                    <>
                      <tr className="bg-gray-200 text-xs font-bold">
                        <td className="p-2" colSpan="9">Vendas</td>
                      </tr>
                      {vendas.filter(v => v.evento === r.evento).map(v => (
                        <tr key={`v-${v.id}`} className="bg-green-100 text-xs">
                          <td className="p-2" colSpan="2">ID {v.id_venda}</td>
                          <td className="p-2">{v.estadio}</td>
                          <td className="p-2">{v.ganho} €</td>
                          <td className="p-2">{v.estado}</td>
                          <td colSpan="4"></td>
                        </tr>
                      ))}
                      <tr className="bg-gray-200 text-xs font-bold">
                        <td className="p-2" colSpan="9">Compras</td>
                      </tr>
                      {compras.filter(c => c.evento === r.evento).map(c => (
                        <tr key={`c-${c.id}`} className="bg-red-100 text-xs">
                          <td className="p-2">{c.local_compras}</td>
                          <td className="p-2">{c.bancada}</td>
                          <td className="p-2">{c.setor}</td>
                          <td className="p-2">{c.fila}</td>
                          <td className="p-2">{c.quantidade}</td>
                          <td className="p-2">{c.gasto} €</td>
                          <td colSpan="3"></td>
                        </tr>
                      ))}
                    </>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}



