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
      setRegistos(await res.json());
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

  const handleCampoDireto = (id, campo, valor) => {
    const atualizados = registos.map(reg =>
      reg.id === id ? { ...reg, [campo]: valor } : reg
    );
    setRegistos(atualizados);
  };

  const guardarAtualizacao = async (id, dados) => {
    const res = await fetch(`https://controlo-bilhetes.onrender.com/eventos_completos2/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!res.ok) console.error("Erro ao atualizar.");
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
            {registos.map((r) => {
              const vendasDoEvento = vendas.filter((v) => v.evento === r.evento);
              const comprasDoEvento = compras.filter((c) => c.evento === r.evento);
              const gastoTotal = comprasDoEvento.reduce((s, c) => s + c.gasto, 0);
              const ganhoTotal = vendasDoEvento.reduce((s, v) => s + v.ganho, 0);

              return (
                <>
                  <tr key={r.id} onClick={() => setLinhaExpandida(linhaExpandida === r.id ? null : r.id)} className="border-t cursor-pointer">
                    <td className="p-2"><input type="date" className="input" value={r.data_evento} onChange={e => handleCampoDireto(r.id, "data_evento", e.target.value)} onBlur={() => guardarAtualizacao(r.id, r)} /></td>
                    <td className="p-2"><input value={r.evento} onChange={e => handleCampoDireto(r.id, "evento", e.target.value)} onBlur={() => guardarAtualizacao(r.id, r)} /></td>
                    <td className="p-2"><input value={r.estadio} onChange={e => handleCampoDireto(r.id, "estadio", e.target.value)} onBlur={() => guardarAtualizacao(r.id, r)} /></td>
                    <td className="p-2">{gastoTotal.toFixed(2)} €</td>
                    <td className="p-2">{ganhoTotal.toFixed(2)} €</td>
                    <td className="p-2">{(ganhoTotal - gastoTotal).toFixed(2)} €</td>
                    <td className="p-2"><input value={r.estado} onChange={e => handleCampoDireto(r.id, "estado", e.target.value)} onBlur={() => guardarAtualizacao(r.id, r)} /></td>
                    <td className="p-2"><button className="text-red-600 hover:underline" onClick={() => eliminarRegisto(r.id)}>Eliminar</button></td>
                  </tr>
                  {linhaExpandida === r.id && (
                    <>
                      <tr><td colSpan="8" className="font-bold p-2">Vendas</td></tr>
                      <tr className="bg-gray-100 text-xs font-bold">
                        <td className="p-2">ID Venda</td>
                        <td className="p-2">Bilhetes</td>
                        <td className="p-2">Ganho</td>
                        <td className="p-2">Estado</td>
                        <td colSpan="4"></td>
                      </tr>
                      {vendasDoEvento.map((v) => (
                        <tr key={"v" + v.id} className="text-xs border-t">
                          <td className="p-2">{v.id_venda}</td>
                          <td className="p-2">{v.estadio}</td>
                          <td className="p-2">{v.ganho} €</td>
                          <td className="p-2">{v.estado}</td>
                          <td colSpan="4"></td>
                        </tr>
                      ))}
                      <tr><td colSpan="8" className="font-bold p-2">Compras</td></tr>
                      <tr className="bg-gray-100 text-xs font-bold">
                        <td className="p-2">Local</td>
                        <td className="p-2">Bancada</td>
                        <td className="p-2">Setor</td>
                        <td className="p-2">Fila</td>
                        <td className="p-2">Qt</td>
                        <td className="p-2">Gasto</td>
                        <td colSpan="2"></td>
                      </tr>
                      {comprasDoEvento.map((c) => (
                        <tr key={"c" + c.id} className="text-xs border-t">
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}



