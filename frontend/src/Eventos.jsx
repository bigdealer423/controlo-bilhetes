import { useEffect, useState } from "react";More actions
import { useLocation } from "react-router-dom";

export default function Eventos() {
  const [registos, setRegistos] = useState([]);
  const [eventosDropdown, setEventosDropdown] = useState([]);
  const [modoEdicao, setModoEdicao] = useState(null);
  const [linhaExpandida, setLinhaExpandida] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [compras, setCompras] = useState([]);
  const location = useLocation();

  useEffect(() => {
  // Carrega tudo em sequência, garantindo ordem
  const carregarDados = async () => {
    await buscarVendas();
    await buscarCompras();
  };

  carregarDados();
}, []);

useEffect(() => {
  // Quando vendas e compras estiverem prontos, carregar eventos e calcular valores
  if (vendas.length && compras.length) {
    buscarEventos();
  }
}, [vendas, compras]);

  const buscarTudo = async () => {
    await Promise.all([buscarDropdown(), buscarVendas(), buscarCompras()]);
    await buscarEventos();
  };

  const buscarEventos = async () => {
  const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2");
  if (res.ok) {
    let eventos = await res.json();

    // Calcula gasto/ganho com base em compras/vendas para cada evento
    eventos = eventos.map(evento => {
  const totalGasto = compras
    .filter(c => c.evento === evento.evento)
    .reduce((acc, curr) => acc + parseFloat(curr.gasto || 0), 0);

  const totalGanho = vendas
    .filter(v => v.evento === evento.evento)
    .reduce((acc, curr) => acc + parseFloat(curr.ganho || 0), 0);

  return {
    ...evento,
    gasto: totalGasto,
    ganho: totalGanho,
  };
});

    setRegistos(eventos);
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
    if (res.ok) setVendas(await res.json());
  };

  const buscarCompras = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/compras");
    if (res.ok) setCompras(await res.json());
  };

  const atualizarCampo = async (id, campo, valor) => {
    const registo = registos.find(r => r.id === id);
    if (!registo) return;

    const atualizado = { ...registo, [campo]: valor };
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(atualizado)
    });
    if (res.ok) buscarEventos();
  };

  const adicionarLinha = async () => {
    const novo = {
      data_evento: new Date().toISOString().split("T")[0],
      evento: "",
      estadio: "",
      gasto: 0,
      ganho: 0,
      estado: "Por entregar"
    };
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novo)
    });
    if (res.ok) buscarEventos();
  };

  const eliminarRegisto = async (id) => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2/" + id, {
      method: "DELETE"
    });
    if (res.ok) buscarEventos();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Resumo de Eventos</h1>

      <button onClick={adicionarLinha} className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Adicionar Evento
      </button>

      <div className="bg-white shadow-md rounded p-4">
        <table className="min-w-full border text-sm text-left text-gray-600">
          <thead>
            <tr className="bg-gray-100">
              <th></th>
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
            {registos.map(r => (
              <>
                <tr key={r.id}>
                <tr
                    key={r.id}className={`cursor-pointer ${r.estado === "Pago" ? "bg-green-100" : ""}`}>
                  <td className="p-2">
                    <button onClick={() => setLinhaExpandida(linhaExpandida === r.id ? null : r.id)}>
                      {linhaExpandida === r.id ? "🔼" : "🔽"}
                    </button>
                  </td>
                  <td className="p-2"><input type="date" value={r.data_evento} onChange={(e) => atualizarCampo(r.id, "data_evento", e.target.value)} className="input" /></td>
                  <td className="p-2"><input value={r.evento} onChange={(e) => atualizarCampo(r.id, "evento", e.target.value)} className="input" /></td>
                  <td className="p-2"><input value={r.estadio} onChange={(e) => atualizarCampo(r.id, "estadio", e.target.value)} className="input" /></td>
                  <td className="p-2">{r.gasto} €</td>
                  <td className="p-2">{r.ganho} €</td>
                  <td className="p-2">{(r.ganho - r.gasto)} €</td>
                  <td className="p-2">
                    <select value={r.estado} onChange={(e) => atualizarCampo(r.id, "estado", e.target.value)} className="input">
                      <option value="Entregue">Entregue</option>
                      <option value="Por entregar">Por entregar</option>
                      <option value="Disputa">Disputa</option>
                      <option value="Pago">Pago</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button onClick={() => eliminarRegisto(r.id)} className="text-red-600 hover:underline">Eliminar</button>
                  </td>
                </tr>
                {linhaExpandida === r.id && (
                  <>
                    <tr className="bg-gray-50">
                      <td colSpan="9" className="p-2 font-semibold">Vendas</td>
                    </tr>
                    {vendas.filter(v => v.evento === r.evento).map(v => (
                      <tr key={"v" + v.id} className="text-xs bg-white border-t">
                        <td className="p-2" colSpan="2">ID Venda: {v.id_venda}</td>
                        <td className="p-2" colSpan="2">Bilhetes: {v.estadio}</td>
                        <td className="p-2" colSpan="2">Ganho: {v.ganho} €</td>
                        <td className="p-2" colSpan="2">Estado: {v.estado}</td>
                        <td></td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan="9" className="p-2 font-semibold">Compras</td>
                    </tr>
                    {compras.filter(c => c.evento === r.evento).map(c => (
                      <tr key={"c" + c.id} className="text-xs bg-white border-t">
                        <td className="p-2" colSpan="2">Local: {c.local_compras}</td>
                        <td className="p-2">Bancada: {c.bancada}</td>
                        <td className="p-2">Setor: {c.setor}</td>
                        <td className="p-2">Fila: {c.fila}</td>
                        <td className="p-2">Qt: {c.quantidade}</td>
                        <td className="p-2" colSpan="2">Gasto: {c.gasto} €</td>
                        <td></td>
                      </tr>
                    ))}
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



~





