import { useEffect, useState } from "react";

export default function Eventos() {
  const [registos, setRegistos] = useState([]);
  const [eventosDropdown, setEventosDropdown] = useState([]);
  const [linhaEditavel, setLinhaEditavel] = useState(null);
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
    if (res.ok) setRegistos(await res.json());
  };

  const buscarDropdown = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown");
    if (res.ok) setEventosDropdown(await res.json());
  };

  const buscarVendas = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/listagem_vendas");
    if (res.ok) setVendas(await res.json());
  };

  const buscarCompras = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/compras");
    if (res.ok) setCompras(await res.json());
  };

  const atualizarLinha = (id, campo, valor) => {
    setRegistos(registos.map(r => r.id === id ? { ...r, [campo]: valor } : r));
  };

  const guardarAlteracoes = async (registo) => {
    const somaCompras = compras.filter(c => c.evento === registo.evento).reduce((s, c) => s + c.gasto, 0);
    const somaVendas = vendas.filter(v => v.evento === registo.evento).reduce((s, v) => s + v.ganho, 0);
    const atualizado = { ...registo, gasto: somaCompras, ganho: somaVendas };

    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2/" + registo.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(atualizado)
    });

    if (res.ok) {
      setLinhaEditavel(null);
      buscarEventos();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Resumo de Eventos</h1>

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
            {registos.map(r => {
              const edicao = linhaEditavel === r.id;
              const gasto = compras.filter(c => c.evento === r.evento).reduce((s, c) => s + c.gasto, 0);
              const ganho = vendas.filter(v => v.evento === r.evento).reduce((s, v) => s + v.ganho, 0);

              return (
                <tr key={r.id} className={r.estado === "Pago" ? "bg-green-100" : "border-t"}>
                  <td className="p-2">
                    {edicao
                      ? <input type="date" value={r.data_evento} onChange={e => atualizarLinha(r.id, "data_evento", e.target.value)} className="input" />
                      : new Date(r.data_evento).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="p-2">{r.evento}</td>
                  <td className="p-2">
                    {edicao
                      ? <input value={r.estadio} onChange={e => atualizarLinha(r.id, "estadio", e.target.value)} className="input" />
                      : r.estadio}
                  </td>
                  <td className="p-2">{gasto.toFixed(2)} €</td>
                  <td className="p-2">{ganho.toFixed(2)} €</td>
                  <td className="p-2">{(ganho - gasto).toFixed(2)} €</td>
                  <td className="p-2">
                    {edicao
                      ? <select value={r.estado} onChange={e => atualizarLinha(r.id, "estado", e.target.value)} className="input">
                          <option value="Entregue">Entregue</option>
                          <option value="Por entregar">Por entregar</option>
                          <option value="Disputa">Disputa</option>
                          <option value="Pago">Pago</option>
                        </select>
                      : r.estado}
                  </td>
                  <td className="p-2 flex gap-2">
                    {edicao ? (
                      <>
                        <button onClick={() => guardarAlteracoes(r)} className="text-green-600 hover:underline">Guardar</button>
                        <button onClick={() => setLinhaEditavel(null)} className="text-gray-600 hover:underline">Cancelar</button>
                      </>
                    ) : (
                      <button onClick={() => setLinhaEditavel(r.id)} className="text-blue-600 hover:underline">Editar</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


