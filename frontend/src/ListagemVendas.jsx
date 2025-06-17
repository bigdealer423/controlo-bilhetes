import { useEffect, useState } from "react";

export default function ListagemVendas(props) {
  const [registos, setRegistos] = useState([]);
  const [eventosDropdown, setEventosDropdown] = useState([]);
  const [novoRegisto, setNovoRegisto] = useState({
    id_venda: "",
    data_venda: "",
    data_evento: "",
    evento: "",
    estadio: "",
    ganho: "",
    estado: "Por entregar"
  });

  const [respostaAtualizacao, setRespostaAtualizacao] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensagemModal, setMensagemModal] = useState("");

   const forcarAtualizacaoEmail = async () => {
    setMensagemModal("⏳ A processar leitura de e-mails...");
    setMostrarModal(true);
  
    try {
      const res = await fetch("https://controlo-bilhetes.onrender.com/forcar_leitura_email", {
        method: "POST"
      });
  
      if (!res.ok) {
        throw new Error("Falha na resposta");
      }
  
      const data = await res.json();
      setMensagemModal(`✅ ${data.mensagem}`);
      buscarRegistos();
      buscarResumoDiario();
    } catch (err) {
      setMensagemModal("❌ Erro ao tentar iniciar a leitura dos e-mails.");
    }
  
    // Fechar o modal depois de 6 segundos
    setTimeout(() => {
      setMostrarModal(false);
      setMensagemModal("");
    }, 6000);
  };


  const forcarLeituraEmail = () => {
  fetch("https://controlo-bilhetes.onrender.com/forcar_leitura_email", {
    method: "POST"
  })
    .then(res => res.json())
    .then(data => alert(data.detail || "Ação enviada."))
    .catch(err => alert("Erro ao tentar disparar leitura de e-mails."));
};


  const [modoEdicao, setModoEdicao] = useState(null);
  const [registoEditado, setRegistoEditado] = useState({});
  const [resumoDiario, setResumoDiario] = useState({ total: 0, ganho: 0 });

  useEffect(() => {
    buscarRegistos();
    buscarEventosDropdown();
    buscarResumoDiario(); // ✅ adiciona isto
  }, []);

  useEffect(() => {
    if (props.atualizarEventos) {
      buscarEventosDropdown();
    }
  }, [props.atualizarEventos]);
  
  const [erroIDExistente, setErroIDExistente] = useState(false);
  const buscarRegistos = () => {
  fetch("https://controlo-bilhetes.onrender.com/listagem_vendas")
    .then(res => res.json())
    .then(data => {
      const ordenado = ordenarRegistos(data, colunaOrdenacao, ordemAscendente);
      setRegistos(ordenado);
    })
    .catch(err => console.error("Erro ao buscar registos:", err));
};
  const buscarResumoDiario = () => {
    fetch("https://controlo-bilhetes.onrender.com/resumo_diario")
      .then(res => res.json())
      .then(data => setResumoDiario(data))
      .catch(err => console.error("Erro ao buscar resumo diário:", err));
  };

  const buscarEventosDropdown = () => {
    fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown")
      .then(res => res.json())
      .then(data => setEventosDropdown(data))
      .catch(err => console.error("Erro ao buscar eventos:", err));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setNovoRegisto(prev => ({ ...prev, [name]: value }));
  };

  const adicionarRegisto = () => {
  fetch("https://controlo-bilhetes.onrender.com/listagem_vendas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...novoRegisto,
      id_venda: parseInt(novoRegisto.id_venda),
      ganho: Math.ceil(parseFloat(novoRegisto.ganho)),  // Arredondado para cima
      data_venda: novoRegisto.data_venda?.split("T")[0] // 🔴 Adicione isto se ainda não estiver
    })
  })
    .then(res => {
      if (res.status === 409) {
        setErroIDExistente(true);  // Mostra modal
        return null;
      }
      return res.json();
    })
    .then(data => {
      if (data) {
        buscarRegistos();
        setNovoRegisto({
          id_venda: "",
          data_venda: "",
          data_evento: "",
          evento: "",
          bilhetes: "",
          ganho: "",
          estado: "Por entregar"
        });
      }
    })
    .catch(err => {
      console.error("Erro ao adicionar registo:", err);
    });
};

  const ativarEdicao = (id, registo) => {
    setModoEdicao(id);
    setRegistoEditado({ ...registo });
  };

  const atualizarRegisto = () => {
    fetch(`https://controlo-bilhetes.onrender.com/listagem_vendas/${modoEdicao}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...registoEditado,
        id_venda: parseInt(registoEditado.id_venda),
        ganho: parseFloat(registoEditado.ganho),
        data_venda: registoEditado.data_venda?.split("T")[0]
      })
    })
      .then(() => {
        setModoEdicao(null);
        buscarRegistos();
        buscarResumoDiario();
      });
  };
  const handleOrdenarPor = (coluna) => {
  if (coluna === colunaOrdenacao) {
    setOrdemAscendente(!ordemAscendente);
    setRegistos(ordenarRegistos(registos, coluna, !ordemAscendente));
  } else {
    setColunaOrdenacao(coluna);
    setOrdemAscendente(true);
    setRegistos(ordenarRegistos(registos, coluna, true));
  }
};
  const [idsAEliminar, setIdsAEliminar] = useState([]);
  const pedirConfirmEliminar = (ids) => setIdsAEliminar(ids);
const cancelarEliminar = () => setIdsAEliminar([]);

const eliminarConfirmado = async () => {
  await Promise.all(
    idsAEliminar.map(id =>
      fetch(`https://controlo-bilhetes.onrender.com/listagem_vendas/${id}`, {
        method: "DELETE"
      })
    )
  );
  setIdsAEliminar([]);
  buscarRegistos();
  buscarResumoDiario();  // 🔴 Esta linha garante atualização do resumo
};
  const [colunaOrdenacao, setColunaOrdenacao] = useState("data_venda");
const [ordemAscendente, setOrdemAscendente] = useState(false);
  const ordenarRegistos = (dados, coluna, ascendente) => {
  return [...dados].sort((a, b) => {
    const valA = a[coluna] ?? "";
    const valB = b[coluna] ?? "";

    if (coluna === "ganho" || coluna === "id_venda") {
      return ascendente ? valA - valB : valB - valA;
    }

    return ascendente
      ? valA.toString().localeCompare(valB.toString())
      : valB.toString().localeCompare(valA.toString());
  });
};
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Listagem de Vendas</h1>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
  <p className="font-semibold">Resumo Diário</p>
  <p>📅 Vendas de hoje: {resumoDiario.total}</p>
  <p>💰 Ganho de hoje: {resumoDiario.ganho} €</p>
</div>


      <div className="bg-white shadow-md rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Adicionar Registo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input name="id_venda" type="number" className="input" placeholder="ID Venda" value={novoRegisto.id_venda} onChange={handleChange} />
          <div className="flex flex-col">
  <label htmlFor="data_venda" className="text-sm font-medium text-gray-700">Data Venda</label>
  <input name="data_venda" type="date" className="input" value={novoRegisto.data_venda} onChange={handleChange} />
</div>

<div className="flex flex-col">
  <label htmlFor="data_evento" className="text-sm font-medium text-gray-700">Data Evento</label>
  <input name="data_evento" type="date" className="input" value={novoRegisto.data_evento} onChange={handleChange} />
</div>
          <select name="evento" className="input" value={novoRegisto.evento} onChange={handleChange}>
            <option value="">-- Selecionar Evento --</option>
            {eventosDropdown.map(e => (
              <option key={e.id} value={e.nome}>{e.nome}</option>
            ))}
          </select>
          
          <input name="estadio" className="input" placeholder="Bilhete" value={novoRegisto.estadio} onChange={handleChange} />
          <input name="ganho" type="number" className="input" placeholder="Ganho (€)" value={novoRegisto.ganho} onChange={handleChange} />
          <select name="estado" className="input" value={novoRegisto.estado} onChange={handleChange}>
            <option value="Entregue">Entregue</option>
            <option value="Por entregar">Por entregar</option>
            <option value="Disputa">Disputa</option>
            <option value="Pago">Pago</option>
          </select>
        </div>
        <button onClick={adicionarRegisto} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Guardar Registo
        </button>
      </div>

      <div className="bg-white shadow-md rounded p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Vendas</h2>
          <div className="flex gap-2">
            <button
  onClick={forcarAtualizacaoEmail}
  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
>
  🔄 Verificar E-mails
</button>

            
          </div>
        </div>
        <table className="min-w-full border text-sm text-left text-gray-600">
         <thead>
  <tr className="bg-gray-100">
    <th className="p-2 cursor-pointer" onClick={() => handleOrdenarPor("id_venda")}>
      ID Venda {colunaOrdenacao === "id_venda" && (ordemAscendente ? "▲" : "▼")}
    </th>
    <th className="p-2 cursor-pointer" onClick={() => handleOrdenarPor("data_venda")}>
  Data Venda {colunaOrdenacao === "data_venda" && (ordemAscendente ? "▲" : "▼")}
</th>

    <th className="p-2 cursor-pointer" onClick={() => handleOrdenarPor("data_evento")}>
      Data Evento {colunaOrdenacao === "data_evento" && (ordemAscendente ? "▲" : "▼")}
    </th>
    <th className="p-2 cursor-pointer" onClick={() => handleOrdenarPor("evento")}>
      Evento {colunaOrdenacao === "evento" && (ordemAscendente ? "▲" : "▼")}
    </th>
    <th className="p-2">Bilhete</th>
    <th className="p-2 cursor-pointer" onClick={() => handleOrdenarPor("ganho")}>
      Ganho (€) {colunaOrdenacao === "ganho" && (ordemAscendente ? "▲" : "▼")}
    </th>
    <th className="p-2 cursor-pointer" onClick={() => handleOrdenarPor("estado")}>
      Estado {colunaOrdenacao === "estado" && (ordemAscendente ? "▲" : "▼")}
    </th>
    <th className="p-2">Ações</th>
  </tr>
</thead>
          <tbody>
            {registos.map(r => (
              <tr key={r.id} className="border-t">
                {modoEdicao === r.id ? (
                  <>
                    <td className="p-2"><input type="number" className="input" value={registoEditado.id_venda} onChange={e => setRegistoEditado({ ...registoEditado, id_venda: e.target.value })} /></td>
                    <td className="p-2">
  <input
    type="date"
    className="input"
    value={registoEditado.data_venda || ""}
    onChange={e => setRegistoEditado({ ...registoEditado, data_venda: e.target.value })}
/>
</td>
                    <td className="p-2"><input type="date" className="input" value={registoEditado.data_evento} onChange={e => setRegistoEditado({ ...registoEditado, data_evento: e.target.value })} /></td>
                    <td className="p-2">
                      <select className="input" value={registoEditado.evento} onChange={e => setRegistoEditado({ ...registoEditado, evento: e.target.value })}>
                        <option value="">-- Evento --</option>
                        {eventosDropdown.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                      </select>
                    </td>
                    <td className="p-2"><input className="input" value={registoEditado.estadio} onChange={e => setRegistoEditado({ ...registoEditado, estadio: e.target.value })} /></td>
                    <td className="p-2"><input type="number" className="input" value={registoEditado.ganho} onChange={e => setRegistoEditado({ ...registoEditado, ganho: e.target.value })} /></td>
                    <td className="p-2">
                      <select className="input" value={registoEditado.estado} onChange={e => setRegistoEditado({ ...registoEditado, estado: e.target.value })}>
                        <option value="Entregue">Entregue</option>
                        <option value="Por entregar">Por entregar</option>
                        <option value="Disputa">Disputa</option>
                        <option value="Pago">Pago</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <button onClick={atualizarRegisto} className="text-green-600 hover:underline mr-2">Guardar</button>
                    </td>
                  </>
                ) : (
                  <>
                     <td className="p-2">{r.id_venda}</td>
  <td className="p-2">
    {r.data_venda ? new Date(r.data_venda).toLocaleDateString("pt-PT") : ""}
  </td>
  <td className="p-2">
    {r.data_evento ? new Date(r.data_evento).toLocaleDateString("pt-PT") : ""}
  </td>
  <td className="p-2">{r.evento}</td>
  <td className="p-2">{r.estadio}</td>
  <td className="p-2">{r.ganho} €</td>
  <td className="p-2">{r.estado}</td>
  <td className="p-2">
    <button onClick={() => ativarEdicao(r.id, r)} className="text-blue-600 hover:underline mr-2">Editar</button>
    <button onClick={() => pedirConfirmEliminar([r.id])} className="text-red-600 hover:underline">Eliminar</button>
  </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div> {/* Fecha o contentor da tabela */}

      {/* Modal de confirmação */}
      {idsAEliminar.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded p-6 shadow-lg">
            <p>Tem a certeza que deseja eliminar esta venda?</p>
            <div className="mt-4 flex justify-end gap-4">
              <button
                onClick={eliminarConfirmado}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Sim, eliminar
              </button>
              <button
                onClick={cancelarEliminar}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {erroIDExistente && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded shadow-lg p-6">
      <p className="mb-4">⚠️ Já existe um registo com este ID de venda.</p>
      <div className="flex justify-end">
        <button onClick={() => setErroIDExistente(false)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Fechar
        </button>
      </div>
    </div>
  </div>
)}
      {mostrarModal && (
  <div className="fixed top-4 right-4 bg-white border border-blue-200 shadow-xl px-4 py-3 rounded-lg z-50">
    <p className="text-sm text-gray-700">{mensagemModal}</p>
  </div>
)}

    </div> // Fecha o container principal da página
  );
}
