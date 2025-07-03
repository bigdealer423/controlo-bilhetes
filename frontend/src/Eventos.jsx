import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useRef } from "react";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import saveAs from "file-saver";
import CirculoEstado from "./CirculoEstado";

export default function Eventos() {
  const [registos, setRegistos] = useState([]);
  const [eventosDropdown, setEventosDropdown] = useState([]);
  const [modoEdicao, setModoEdicao] = useState(null);
  const [eventoEditado, setEventoEditado] = useState({});
  const [linhaExpandida, setLinhaExpandida] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState(null);
  const location = useLocation();
  const [resumoMensal, setResumoMensal] = useState({ lucro: 0, pagamento: 0 });
  const [modoEdicaoCompra, setModoEdicaoCompra] = useState(null);
  const [compraEditada, setCompraEditada] = useState({});
  const [modoEdicaoVenda, setModoEdicaoVenda] = useState(null);
  const [vendaEditada, setVendaEditada] = useState({});
  const [tooltips, setTooltips] = useState({});
  const [clubesInfo, setClubesInfo] = useState([]);

  useEffect(() => {
      const fetchClubes = async () => {
          try {
              const res = await fetch("https://controlo-bilhetes.onrender.com/clubes");
              const data = await res.json();
              setClubesInfo(data);
          } catch (error) {
              console.error("Erro ao carregar clubes:", error);
          }
      };
      fetchClubes();
  }, []);

  

  useEffect(() => {
    const carregarDados = async () => {
      await buscarVendas();
      await buscarCompras();
    };
    carregarDados();
  }, []);

  useEffect(() => {
    if (vendas.length && compras.length) {
      buscarEventos();
    }
  }, [vendas, compras]);

  useEffect(() => {
    buscarDropdown();
  }, []);

  useEffect(() => {
    buscarResumoMensal();
  }, []);

  useEffect(() => {
    if (compras.length && vendas.length) {
      buscarResumoMensal();
    }
  }, [compras, vendas]);

  function exportarEventosParaExcel(eventos) {
    const worksheet = XLSX.utils.json_to_sheet(eventos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Eventos");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "eventos.xlsx");
  }

  const atualizarNota = async (tipo, id, nota) => {
    const url = `https://controlo-bilhetes.onrender.com/${tipo}/${id}`;
    const body = { texto_estado: nota };


    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const handleTooltipChange = (tipo, id, value) => {
    setTooltips(prev => ({ ...prev, [`${tipo}-${id}`]: value }));
    atualizarNota(tipo, id, value);
  };

  const corCirculo = (texto) => {
    if (texto === "verde") return "bg-green-500";
    if (texto === "vermelho") return "bg-red-500";
    return "bg-gray-400";
  };

  const buscarResumoMensal = async () => {
    try {
      const res = await fetch("https://controlo-bilhetes.onrender.com/resumo_mensal_eventos");
      const data = await res.json();
      setResumoMensal(data);
    } catch (err) {
      console.error("Erro ao buscar resumo mensal:", err);
    }
  };

  const ordenarEventosDropdown = (data) => {
    return [...data].sort((a, b) => {
      const nomeA = a.nome.toLowerCase();
      const nomeB = b.nome.toLowerCase();

      const prioridade = (nome) => {
        if (nome.startsWith("sl benfica")) return 0;
        if (nome.startsWith("benfica")) return 1;
        return 2;
      };

      const pA = prioridade(nomeA);
      const pB = prioridade(nomeB);

      if (pA !== pB) return pA - pB;
      return nomeA.localeCompare(nomeB);
    });
  };

  const buscarDropdown = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown");
    if (res.ok) {
      const data = await res.json();
      setEventosDropdown(ordenarEventosDropdown(data));
    }
  };

  const buscarEventos = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2");
    if (res.ok) {
      let eventos = await res.json();

      eventos = await Promise.all(eventos.map(async evento => {
        const totalGasto = compras.filter(c => c.evento === evento.evento).reduce((acc, curr) => acc + parseFloat(curr.gasto || 0), 0);
        const totalGanho = vendas.filter(v => v.evento === evento.evento).reduce((acc, curr) => acc + parseFloat(curr.ganho || 0), 0);

        await fetch(`https://controlo-bilhetes.onrender.com/eventos_completos2/${evento.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...evento, gasto: totalGasto, ganho: totalGanho })
        });

        return { ...evento, gasto: totalGasto, ganho: totalGanho };
      }));

      eventos.sort((a, b) => new Date(a.data_evento) - new Date(b.data_evento));

      setRegistos(eventos);
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

  const atualizarCampo = (id, campo, valor) => {
    setRegistos(registos =>
      registos.map(r =>
        r.id === id ? { ...r, [campo]: valor } : r
      )
    );
  };

  const guardarEvento = async (evento) => {
    const res = await fetch(`https://controlo-bilhetes.onrender.com/eventos_completos2/${evento.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evento)
    });
    if (res.ok) {
      await buscarEventos();
      await buscarResumoMensal();
      setModoEdicao(null);
    }
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
    if (res.ok) {
      await buscarEventos();
      await buscarResumoMensal();
    }
  };

  const confirmarEliminar = (id) => {
    setIdAEliminar(id);
    setMostrarModal(true);
  };

  const eliminarRegisto = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2/" + idAEliminar, {
      method: "DELETE"
    });
    if (res.ok) {
      await buscarEventos();
      await buscarResumoMensal();
      setMostrarModal(false);
      setIdAEliminar(null);
    }
  };

  const guardarCompra = async (compra) => {
    const res = await fetch(`https://controlo-bilhetes.onrender.com/compras/${compra.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(compra)
    });
    if (res.ok) {
      await buscarCompras();
      await buscarEventos();
      await buscarResumoMensal();
      setModoEdicaoCompra(null);
    }
  };

  const guardarVenda = async (venda) => {
    const res = await fetch(`https://controlo-bilhetes.onrender.com/listagem_vendas/${venda.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...venda,
        ganho: parseFloat(venda.ganho),
        id_venda: parseInt(venda.id_venda),
        data_venda: venda.data_venda?.split("T")[0]
      })
    });
    if (res.ok) {
      await buscarVendas();
      await buscarEventos();
      await buscarResumoMensal();
      setModoEdicaoVenda(null);
    }
  };

  const renderEventoComSimbolos = (eventoNome) => {
    const partes = eventoNome.split(/vs|x|-|,|\//i).map(p => p.trim());

    return partes.map((parte, idx) => {
        const clubeMatch = clubesInfo.find(clube =>
            parte.toLowerCase().includes(clube.nome.toLowerCase().slice(0, 5)) // aproximação
        );

        return (
            <span key={idx} className="inline-flex items-center gap-1 mr-2">
                {clubeMatch && clubeMatch.simbolo && (
                    <img
                        src={clubeMatch.simbolo}
                        alt={clubeMatch.nome}
                        className="w-5 h-5 object-contain inline-block"
                    />
                )}
                {parte}
                {idx !== partes.length - 1 && <span className="mx-1">vs</span>}
            </span>
        );
    });
};

return (
   <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Resumo de Eventos</h1>


      <div className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-600 dark:border-yellow-400 text-yellow-800 dark:text-yellow-200 p-4 mb-6 rounded transition-colors duration-300">

  <p className="font-semibold">Resumo Mensal</p>
  <p>📆 Lucro de {new Date().toLocaleString("pt-PT", { month: "long", year: "numeric" })}: <strong>{resumoMensal.lucro} €</strong></p>
<p>💸 A aguardar pagamento: <strong>{resumoMensal.pagamento} €</strong></p>

</div>

      <div className="flex justify-between items-center mb-4">
  <button
    onClick={adicionarLinha}
    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
  >
    Adicionar Evento
  </button>

  <button
    onClick={() => exportarEventosParaExcel(registos)}
    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition"
  >
    <FaFileExcel size={18} />
    Exportar Excel
  </button>
</div>


      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-md rounded p-4 transition-colors duration-300">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full border border-gray-300 dark:border-gray-600 text-sm transition-colors duration-300">
            <thead className="bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
               <tr>
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
                <tr
  key={r.id}
  className={`cursor-pointer ${
    linhaExpandida === r.id
      ? "bg-blue-100 dark:bg-blue-800 text-gray-900 dark:text-gray-100 font-semibold"
      : r.estado === "Pago"
      ? "bg-green-100"
      : r.estado === "Entregue"
      ? "bg-yellow-200"
      : ""
  } transition-colors duration-300`}
>
                 <td className="p-2">
  {vendas.some(v => v.evento === r.evento) || compras.some(c => c.evento === r.evento) ? (
    <button onClick={() => setLinhaExpandida(linhaExpandida === r.id ? null : r.id)}>
      {linhaExpandida === r.id ? "🔼" : "🔽"}
    </button>
  ) : (
    <span className="text-red-600">🔻</span>
  )}
</td>
                  <td className="p-2">
  {modoEdicao === r.id ? (
    <input
      type="date"
      value={r.data_evento}
      onChange={(e) => atualizarCampo(r.id, "data_evento", e.target.value)}
      className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
    />
  ) : (
    new Date(r.data_evento).toLocaleDateString("pt-PT")
  )}
</td>
                  <td className="p-2">
  {modoEdicao === r.id ? (
    <select
  value={r.evento}
  onChange={(e) => atualizarCampo(r.id, "evento", e.target.value)}
  className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
>
  <option value="">-- Selecionar Evento --</option>
  {eventosDropdown.map(e => (
    <option key={e.id} value={e.nome}>{e.nome}</option>
  ))}
</select>
  ) : (
    renderEventoComSimbolos(r.evento)
  )}
</td>
                  <td className="p-2">
                    {modoEdicao === r.id
                      ? <input value={r.estadio} onChange={(e) => atualizarCampo(r.id, "estadio", e.target.value)} className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" />
                      : r.estadio}
                  </td>
                  <td className="p-2">{r.gasto} €</td>
                  <td className="p-2">{r.ganho} €</td>
                  <td className="p-2">{(r.ganho - r.gasto)} €</td>
                  <td className="p-2">
                    {modoEdicao === r.id
                      ? (
                        <select value={r.estado} onChange={(e) => atualizarCampo(r.id, "estado", e.target.value)} className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300">
                          <option value="Entregue">Entregue</option>
                          <option value="Por entregar">Por entregar</option>
                          <option value="Disputa">Disputa</option>
                          <option value="Pago">Pago</option>
                        </select>
                      ) : r.estado}
                  </td>
                  <td className="p-2 space-x-2">
                    <button
                      onClick={() => {
                        if (modoEdicao === r.id) {
                          guardarEvento(r);
                        } else {
                          setModoEdicao(r.id);
                        }
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      {modoEdicao === r.id ? "Guardar" : "Editar"}
                    </button>

                    <button
                      onClick={() => confirmarEliminar(r.id)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>

                {linhaExpandida === r.id && (
                  <>
                    
                    
                   <tr className="bg-indigo-50 dark:bg-gray-800 text-sm border-t border-l-4 border-blue-600 transition-colors duration-300">
  <td colSpan="9" className="p-2 font-semibold">
    Vendas ({
      vendas
        .filter(v => v.evento === r.evento)
        .reduce((acc, v) => {
          const texto = v.estadio.trim();
          if (/^\d+$/.test(texto)) {
            // Só números → usar como quantidade
            return acc + parseInt(texto);
          }
          // Caso contrário, extrair número entre parêntesis
          const match = texto.match(/\((\d+)\s*Bilhetes?\)/i);
          return acc + (match ? parseInt(match[1]) : 0);
        }, 0)
    })
  </td>
</tr>
<tr className="border-l-4 border-blue-600 bg-blue-100 dark:bg-blue-800 text-xs font-semibold">
  <td className="p-2">ID Venda</td>
  <td className="p-2" colSpan="3">Bilhetes</td>
  <td className="p-2">Ganho</td>
  <td className="p-2">Estado</td>
  <td className="p-2">Nota</td>
  <td className="p-2">Ações</td>
  <td className="p-2"></td> {/* ← coluna vazia para manter 9 colunas */}
</tr>




{vendas.filter(v => v.evento === r.evento).map(v =>
  modoEdicaoVenda === v.id ? (
    <tr key={"v" + v.id} className="border-l-4 border-blue-600 bg-blue-50 dark:bg-blue-900 text-xs border-t">
      <td className="p-2">
        <input
          type="number"
          className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
          value={vendaEditada.id_venda}
          onChange={e => setVendaEditada({ ...vendaEditada, id_venda: e.target.value })}
        />
      </td>
      <td className="p-2" colSpan="2">
        <input
          className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
          value={vendaEditada.estadio}
          onChange={e => setVendaEditada({ ...vendaEditada, estadio: e.target.value })}
        />
      </td>
      <td className="p-2">
        <input
          type="number"
          className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
          value={vendaEditada.ganho}
          onChange={e => setVendaEditada({ ...vendaEditada, ganho: e.target.value })}
        />
      </td>
      <td className="p-2">
        <select
          className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
          value={vendaEditada.estado}
          onChange={e => setVendaEditada({ ...vendaEditada, estado: e.target.value })}
        >
          <option value="Entregue">Entregue</option>
          <option value="Por entregar">Por entregar</option>
          <option value="Disputa">Disputa</option>
          <option value="Pago">Pago</option>
        </select>
      </td>
      <td colSpan="4" className="p-2">
        <button className="text-green-600 mr-2" onClick={() => guardarVenda(vendaEditada)}>Guardar</button>
        <button className="text-gray-500" onClick={() => setModoEdicaoVenda(null)}>Cancelar</button>
      </td>
    </tr>
  ) : (
    <tr key={"v" + v.id} className="border-l-4 border-blue-600 bg-blue-50 dark:bg-blue-900 text-xs border-t">
      <td className="p-2">{v.id_venda}</td>
      {/* colSpan=3 para bater certo */}
      <td className="p-2" colSpan="3">{v.estadio}</td>
      <td className="p-2">{v.ganho} €</td>
      <td className="p-2 whitespace-nowrap">{v.estado}</td>
      <td className="p-2">
        <CirculoEstado
          tipo="listagem_vendas"
          id={v.id}
          texto_estado={v.circulo_estado_venda}
          nota_estado={v.nota_estado_venda}
          setVendas={setVendas}
        />
      </td>
      <td className="p-2">
        <button
          onClick={() => {
            setModoEdicaoVenda(v.id);
            setVendaEditada(v);
          }}
          className="text-blue-600 hover:underline"
        >
          Editar
        </button>
      </td>
      <td className="p-2"></td> {/* coluna extra para preencher */}
    </tr>
  )
)}


   <tr className="bg-yellow-50 dark:bg-yellow-900 text-sm border-t border-l-4 border-yellow-600">
  <td colSpan="9" className="p-2 font-semibold">
    Compras ({compras.filter(c => c.evento === r.evento).reduce((acc, c) => acc + Number(c.quantidade || 0), 0)})
  </td>
</tr>
<tr className="border-l-4 border-yellow-600 bg-yellow-100 dark:bg-yellow-800 text-xs font-semibold">
  <td className="p-2">Local</td>
  <td className="p-2">Bancada</td>
  <td className="p-2">Setor</td>
  <td className="p-2">Fila</td>
  <td className="p-2">Qt</td>
  <td className="p-2">Gasto</td>
  <td className="p-2">Nota</td>
  <td className="p-2">Ações</td>
  <td></td>
</tr>

{compras.filter(c => c.evento === r.evento).map(c => (
  <tr key={"c" + c.id} className="border-l-4 border-yellow-600 bg-yellow-50 dark:bg-yellow-900 text-xs border-t">
    {modoEdicaoCompra === c.id ? (
      <>
        <td className="p-2">
          <input className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={compraEditada.local_compras} onChange={e => setCompraEditada({ ...compraEditada, local_compras: e.target.value })} />
        </td>
        <td className="p-2">
          <input className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={compraEditada.bancada} onChange={e => setCompraEditada({ ...compraEditada, bancada: e.target.value })} />
        </td>
        <td className="p-2">
          <input className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={compraEditada.setor} onChange={e => setCompraEditada({ ...compraEditada, setor: e.target.value })} />
        </td>
        <td className="p-2">
          <input className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={compraEditada.fila} onChange={e => setCompraEditada({ ...compraEditada, fila: e.target.value })} />
        </td>
        <td className="p-2">
          <input type="number" className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={compraEditada.quantidade} onChange={e => setCompraEditada({ ...compraEditada, quantidade: e.target.value })} />
        </td>
        <td className="p-2">
          <input type="number" className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={compraEditada.gasto} onChange={e => setCompraEditada({ ...compraEditada, gasto: e.target.value })} />
        </td>
        <td className="p-2" colSpan="3">
          <button className="text-green-600 mr-2" onClick={() => guardarCompra(compraEditada)}>Guardar</button>
          <button className="text-gray-500" onClick={() => setModoEdicaoCompra(null)}>Cancelar</button>
        </td>
      </>
    ) : (
      <>
        <td className="p-2">{c.local_compras}</td>
        <td className="p-2">{c.bancada}</td>
        <td className="p-2">{c.setor}</td>
        <td className="p-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={c.fila}>
  {c.fila}
</td>
        <td className="p-2">{c.quantidade}</td>
        <td className="p-2">{c.gasto} €</td>
       <td className="p-2">
  <CirculoEstado
    tipo="compras"
    id={c.id}
    texto_estado={c.circulo_estado_compra}
    nota_estado={c.nota_estado_compra}
    setCompras={setCompras}
  />
</td>
<td className="p-2">
  <button onClick={() => { setModoEdicaoCompra(c.id); setCompraEditada(c); }} className="text-blue-600 hover:underline">
    Editar
  </button>
</td>
<td></td>

      </>
    )}
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

      {/* Modal de confirmação */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 dark:text-gray-100 p-6 rounded shadow-lg transition-colors duration-300">
            <p className="mb-4">Tem a certeza que quer eliminar este registo?</p>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setMostrarModal(false)} className="bg-gray-300 px-4 py-2 rounded">
                Cancelar
              </button>
              <button onClick={eliminarRegisto} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
