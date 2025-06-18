import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function Eventos() {
  const [registos, setRegistos] = useState([]);
  const [eventosDropdown, setEventosDropdown] = useState([]);
  const [modoEdicao, setModoEdicao] = useState(null);
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
    console.log("🔽 Dados dropdown:", data);
    setEventosDropdown(ordenarEventosDropdown(data)); // <- aplicação da ordenação aqui
  } else {
    console.error("Erro ao carregar dropdown.");
  }
};


  const buscarTudo = async () => {
    await Promise.all([buscarDropdown(), buscarVendas(), buscarCompras()]);
    await buscarEventos();
  };

  const buscarEventos = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2");
    if (res.ok) {
      let eventos = await res.json();

      eventos = await Promise.all(eventos.map(async evento => {
        const totalGasto = compras
          .filter(c => c.evento === evento.evento)
          .reduce((acc, curr) => acc + parseFloat(curr.gasto || 0), 0);

        const totalGanho = vendas
          .filter(v => v.evento === evento.evento)
          .reduce((acc, curr) => acc + parseFloat(curr.ganho || 0), 0);

        // Atualiza o evento no backend
        await fetch(`https://controlo-bilhetes.onrender.com/eventos_completos2/${evento.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...evento,
            gasto: totalGasto,
            ganho: totalGanho
          })
        });
         // Atualiza o evento localmente
        return {
        ...evento,
        gasto: totalGasto,
        ganho: totalGanho,
      };
    }));

      // Ordenação por data (mais antiga primeiro)
      eventos.sort((a, b) => new Date(a.data_evento) - new Date(b.data_evento));

      setRegistos(eventos);
    } else {
      console.error("Erro ao carregar eventos.");
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
    if (res.ok) {
      await buscarEventos();
      await buscarResumoMensal(); // ✅ só corre se a atualização for bem-sucedida
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
      await buscarEventos();         // ⏳ Esperar que os eventos sejam atualizados
      await buscarResumoMensal();    // ✅ Só depois atualizar o resumo mensal
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
    await buscarEventos();         // ⏳ Correção crítica
    await buscarResumoMensal();    // ✅ Atualização correta do resumo
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

return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Resumo de Eventos</h1>

      <div className="bg-yellow-100 border-l-4 border-yellow-600 text-yellow-800 p-4 mb-6 rounded">
  <p className="font-semibold">Resumo Mensal</p>
  <p>📆 Lucro de {new Date().toLocaleString("pt-PT", { month: "long", year: "numeric" })}: <strong>{resumoMensal.lucro} €</strong></p>
<p>💸 A aguardar pagamento: <strong>{resumoMensal.pagamento} €</strong></p>

</div>

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
                <tr key={r.id} className={`cursor-pointer ${linhaExpandida === r.id ? "bg-blue-100 text-black font-semibold" : r.estado === "Pago" ? "bg-green-100" : ""}`}>
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
      className="input"
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
  className="input"
>
  <option value="">-- Selecionar Evento --</option>
  {eventosDropdown.map(e => (
    <option key={e.id} value={e.nome}>{e.nome}</option>
  ))}
</select>
  ) : (
    r.evento
  )}
</td>
                  <td className="p-2">
                    {modoEdicao === r.id
                      ? <input value={r.estadio} onChange={(e) => atualizarCampo(r.id, "estadio", e.target.value)} className="input" />
                      : r.estadio}
                  </td>
                  <td className="p-2">{r.gasto} €</td>
                  <td className="p-2">{r.ganho} €</td>
                  <td className="p-2">{(r.ganho - r.gasto)} €</td>
                  <td className="p-2">
                    {modoEdicao === r.id
                      ? (
                        <select value={r.estado} onChange={(e) => atualizarCampo(r.id, "estado", e.target.value)} className="input">
                          <option value="Entregue">Entregue</option>
                          <option value="Por entregar">Por entregar</option>
                          <option value="Disputa">Disputa</option>
                          <option value="Pago">Pago</option>
                        </select>
                      ) : r.estado}
                  </td>
                  <td className="p-2 space-x-2">
                    <button
                      onClick={() => setModoEdicao(modoEdicao === r.id ? null : r.id)}
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
                    
                    
                   <tr className="bg-indigo-50 text-sm border-t border-l-4 border-blue-600">
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
<tr className="border-l-4 border-blue-600 bg-blue-100 text-xs font-semibold">
  <td className="p-2">ID Venda</td>
  <td className="p-2" colSpan="2">Bilhetes</td>
  <td className="p-2">Ganho</td>
  <td className="p-2">Estado</td>
  <td colSpan="5"></td>
</tr>
{vendas.filter(v => v.evento === r.evento).map(v => (
  <tr key={"v" + v.id} className="border-l-4 border-blue-600 bg-blue-50 text-xs border-t">
    {modoEdicaoVenda === v.id ? (
      <>
        <td className="p-2">
          <input
            type="number"
            className="input"
            value={vendaEditada.id_venda}
            onChange={e => setVendaEditada({ ...vendaEditada, id_venda: e.target.value })}
          />
        </td>
        <td className="p-2" colSpan="2">
          <input
            className="input"
            value={vendaEditada.estadio}
            onChange={e => setVendaEditada({ ...vendaEditada, estadio: e.target.value })}
          />
        </td>
        <td className="p-2">
          <input
            type="number"
            className="input"
            value={vendaEditada.ganho}
            onChange={e => setVendaEditada({ ...vendaEditada, ganho: e.target.value })}
          />
        </td>
        <td className="p-2">
          <select
            className="input"
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
      </>
    ) : (
      <>
        <td className="p-2">{v.id_venda}</td>
        <td className="p-2" colSpan="2">{v.estadio}</td>
        <td className="p-2">{v.ganho} €</td>
        <td className="p-2">{v.estado}</td>
        <td className="p-2" colSpan="4">
          <button onClick={() => { setModoEdicaoVenda(v.id); setVendaEditada(v); }} className="text-blue-600 hover:underline">
            Editar
          </button>
        </td>
      </>
    )}
  </tr>
))}

   <tr className="bg-yellow-50 text-sm border-t border-l-4 border-yellow-600">
  <td colSpan="9" className="p-2 font-semibold">
    Compras ({compras.filter(c => c.evento === r.evento).reduce((acc, c) => acc + Number(c.quantidade || 0), 0)})
  </td>
</tr>
<tr className="border-l-4 border-yellow-600 bg-yellow-100 text-xs font-semibold">
  <td className="p-2">Local</td>
  <td className="p-2">Bancada</td>
  <td className="p-2">Setor</td>
  <td className="p-2">Fila</td>
  <td className="p-2">Qt</td>
  <td className="p-2">Gasto</td>
  <td colSpan="3"></td>
</tr>
{compras.filter(c => c.evento === r.evento).map(c => (
  <tr key={"c" + c.id} className="border-l-4 border-yellow-600 bg-yellow-50 text-xs border-t">
    {modoEdicaoCompra === c.id ? (
      <>
        <td className="p-2">
          <input className="input" value={compraEditada.local_compras} onChange={e => setCompraEditada({ ...compraEditada, local_compras: e.target.value })} />
        </td>
        <td className="p-2">
          <input className="input" value={compraEditada.bancada} onChange={e => setCompraEditada({ ...compraEditada, bancada: e.target.value })} />
        </td>
        <td className="p-2">
          <input className="input" value={compraEditada.setor} onChange={e => setCompraEditada({ ...compraEditada, setor: e.target.value })} />
        </td>
        <td className="p-2">
          <input className="input" value={compraEditada.fila} onChange={e => setCompraEditada({ ...compraEditada, fila: e.target.value })} />
        </td>
        <td className="p-2">
          <input type="number" className="input" value={compraEditada.quantidade} onChange={e => setCompraEditada({ ...compraEditada, quantidade: e.target.value })} />
        </td>
        <td className="p-2">
          <input type="number" className="input" value={compraEditada.gasto} onChange={e => setCompraEditada({ ...compraEditada, gasto: e.target.value })} />
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
        <td className="p-2">{c.fila}</td>
        <td className="p-2">{c.quantidade}</td>
        <td className="p-2">{c.gasto} €</td>
        <td className="p-2" colSpan="3">
          <button onClick={() => { setModoEdicaoCompra(c.id); setCompraEditada(c); }} className="text-blue-600 hover:underline">
            Editar
          </button>
        </td>
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

      {/* Modal de confirmação */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg">
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
