

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FaFileExcel,
  FaEdit,
  FaTrash,
  FaCalendarCheck,
  FaCoins,
  FaChartBar,
  FaSearch,
  FaFilter,
  FaPlus,
  FaSyncAlt,
  FaHashtag,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useMemo } from "react";


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
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [datasEventoVendas, setDatasEventoVendas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensagemModal, setMensagemModal] = useState("");
  const [filtroEvento, setFiltroEvento] = useState("");
  const [mostrarFormularioMobile, setMostrarFormularioMobile] = useState(false);
  const [eventosChaveSet, setEventosChaveSet] = useState(new Set());
  const [eventosChaveCarregado, setEventosChaveCarregado] = useState(false);
  const [dadosSincronizados, setDadosSincronizados] = useState(false);
  const [startY, setStartY] = useState(null);
  const formatarDataPesquisa = (data) => {
  if (!data) return "";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-PT");
};

  // Novo estado: filtro de exclamação
  const [filtroExclamacao, setFiltroExclamacao] = useState(false);
  
  // Helper: determina se a linha tem o aviso ⚠️ (a mesma lógica usada para renderizar o ícone)
  const temAviso = (r) => {
    if (!dadosSincronizados) return false;
    const evento = r.evento?.trim() || "";
    const dataEvento = r.data_evento?.split("T")[0] || "";
    const chave = `${evento}|${dataEvento}`;
    return !evento || !dataEvento || !eventosChaveSet.has(chave);
  };

  const buscarDatasEventoVendas = async (nomeEvento) => {
    if (!nomeEvento) {
      setDatasEventoVendas([]);
      return;
    }
    try {
      const res = await fetch(`https://controlo-bilhetes.onrender.com/datas_evento/${encodeURIComponent(nomeEvento)}`);
      const data = await res.json();
      setDatasEventoVendas(data || []);
    } catch (error) {
      console.error("Erro ao carregar datas do evento (Vendas):", error);
      setDatasEventoVendas([]);
    }
  };


  const idsExistentes = useMemo(
    () => new Set(registos.map(r => String(r.id_venda ?? ""))),
    [registos]
  );
  const [idEmUso, setIdEmUso] = useState(false);
  const [idEmVerificacao, setIdEmVerificacao] = useState(false);
  
  useEffect(() => {
    const valor = String(novoRegisto.id_venda ?? "").trim();
    if (!valor) {             // vazio: não valida
      setIdEmUso(false);
      setIdEmVerificacao(false);
      return;
    }
    setIdEmVerificacao(true);
    const t = setTimeout(() => {
      setIdEmUso(idsExistentes.has(valor));
      setIdEmVerificacao(false);
    }, 300); // debounce 300ms
    return () => clearTimeout(t);
  }, [novoRegisto.id_venda, idsExistentes]);



  


useEffect(() => {
  setDadosSincronizados(false); // ⛔ Reset ao entrar na aba

  // Carregar eventos
  fetch("https://controlo-bilhetes.onrender.com/eventos_completos2?skip=0&limit=1000")
    .then((res) => res.json())
    .then((dados) => {
      const chaves = dados.map((evento) => {
        const eventoNome = (evento.evento || "").trim();
        const dataFormatada = (evento.data_evento || "").split("T")[0];
        return `${eventoNome}|${dataFormatada}`;
      });
      setEventosChaveSet(new Set(chaves));
      setEventosChaveCarregado(true);
    })
    .catch((err) => console.error("❌ Erro ao carregar eventos:", err));

  // Carregar registos e resumo
  buscarRegistos();
  buscarEventosDropdown();
  buscarResumoDiario();
}, []);

useEffect(() => {
  if (eventosChaveCarregado && registos.length > 0) {
    console.log("✅ Dados sincronizados — eventos e registos carregados.");
    setDadosSincronizados(true);
  }
}, [eventosChaveCarregado, registos]);

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
    return; // evita correr o setTimeout se falhar
  }

  // ⏳ Após 60 segundos, buscar o resultado da leitura
  setTimeout(async () => {
    try {
      const res = await fetch("https://controlo-bilhetes.onrender.com/resultado_leitura_email");
      const json = await res.json();

      if (json.sucesso !== undefined) {
        const entregues = json.entregues || 0;
        const pagos = json.pagos || 0;
        const disputas = json.disputas ? json.disputas.length : 0;

        const mensagem = `✅ Concluído: ${json.sucesso} novos, ${json.existentes} existentes, ${json.falhas} falhados, ${entregues} entregues, ${pagos} pagos, ${disputas} disputas.`;
        setMensagemModal(mensagem);
        toast.success(mensagem);
      } else {
        setMensagemModal("⚠️ Concluído, mas sem dados detalhados.");
        toast.warning("⚠️ Concluído, mas sem dados detalhados.");
      }
    } catch (error) {
      setMensagemModal("⚠️ Concluído, mas não foi possível obter o resumo.");
      toast.error("⚠️ Concluído, mas falhou ao obter o resumo.");
    }

    setTimeout(() => {
      setMostrarModal(false);
      setMensagemModal("");
    }, 8000);
  }, 60000);
};




function exportarParaExcel(registos) {
  const worksheet = XLSX.utils.json_to_sheet(registos);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Listagem");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, "listagem_vendas.xlsx");
}





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
    if (props.atualizarEventos) {
      buscarEventosDropdown();
    }
  }, [props.atualizarEventos]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("🔄 Voltou à aba Listagem Vendas, a atualizar...");
        buscarRegistos();
        buscarResumoDiario();
      }
    };
  
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);


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
    .then(data => {
      const ordenados = ordenarEventosDropdown(data);
      setEventosDropdown(ordenados);

      // 🔧 Cria um Set com as chaves únicas: evento + data_evento
      const chaves = new Set(
        data.map(e => `${e.nome}|${(e.data_evento || "").split("T")[0]}`)
      );

      
    })
    .catch(err => console.error("Erro ao buscar eventos:", err));
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen text-gray-100 transition-colors duration-300">
     <div className="relative mb-5 overflow-hidden rounded-[26px] border border-white/12 bg-gradient-to-r from-[#151c2f] via-[#1a2748] to-[#2d2463] shadow-[0_16px_45px_rgba(0,0,0,0.30)]">
  <div className="pointer-events-none absolute -left-14 top-0 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />
  <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl" />
  <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

  <div className="relative grid grid-cols-1 gap-4 px-4 py-4 md:px-5 md:py-5 lg:grid-cols-[minmax(220px,1.1fr)_minmax(165px,0.78fr)_minmax(165px,0.78fr)] lg:items-stretch">
    {/* bloco esquerdo */}
    <div className="flex items-center gap-3.5">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-amber-400/10 shadow-[0_0_28px_rgba(251,191,36,0.16)]">
        <FaChartBar className="text-[24px] text-amber-300" />
      </div>

      <div className="min-w-0">
        <h2 className="text-[22px] md:text-[24px] font-extrabold leading-none tracking-tight text-white">
          Resumo Diário
        </h2>
        <p className="mt-1 text-[13px] md:text-[14px] font-semibold text-white/85">
          {new Date().toLocaleDateString("pt-PT", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-xs text-white/70 backdrop-blur-sm">
          <span>📅</span>
          <span>Atualização diária</span>
        </div>
      </div>
    </div>

    {/* card vendas */}
    <div className="rounded-[20px] border border-white/14 bg-white/[0.04] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400/12">
        <FaCalendarCheck className="text-[18px] text-cyan-300" />
      </div>

      <p className="text-xs font-medium text-white/65">Vendas de hoje</p>
      <p className="mt-2 text-[34px] md:text-[38px] font-extrabold leading-none tracking-tight text-white">
        {resumoDiario.total ?? 0}
      </p>
      <p className="mt-2 text-xs text-white/50">Registos do dia</p>
    </div>

    {/* card ganho */}
    <div className="rounded-[20px] border border-white/14 bg-white/[0.04] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400/12">
        <FaCoins className="text-[18px] text-emerald-300" />
      </div>

      <p className="text-xs font-medium text-white/65">Ganho de hoje</p>
      <p className="mt-2 text-[34px] md:text-[38px] font-extrabold leading-none tracking-tight text-emerald-300">
        {resumoDiario.ganho ?? 0} €
      </p>
      <p className="mt-2 text-xs text-white/50">Total diário</p>
    </div>
  </div>
</div>

{mostrarFormulario && (
  <>
    {/* Formulário de adicionar registo */}
    <div className="bg-white dark:bg-gray-800 shadow-md rounded p-4 mb-6 transition-colors duration-300">
      <h2 className="text-lg font-semibold mb-2">Adicionar Registo</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
       {/* ID Venda */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">ID Venda</label>
          <input
            name="id_venda"
            type="number"
            inputMode="numeric"
            placeholder="ID Venda"
            className={`h-10 w-full border rounded p-2 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
              ${idEmUso
                ? "border-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                : "border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"}`}
            value={novoRegisto.id_venda}
            onChange={handleChange}
            aria-invalid={idEmUso}
            aria-describedby="id-venda-erro"
          />
          <div id="id-venda-erro" className="mt-1 text-xs min-h-5">
            {idEmVerificacao && <span className="text-gray-500 dark:text-gray-400">A verificar…</span>}
            {!idEmVerificacao && idEmUso && <span className="text-red-600">⚠️ Este ID já existe.</span>}
            {!idEmVerificacao && !idEmUso && novoRegisto.id_venda && (
              <span className="text-green-600">✅ ID disponível.</span>
            )}
          </div>
        </div>

        

        {/* Data Venda */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Data Venda</label>
          <input
            name="data_venda"
            type="date"
            className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
            value={novoRegisto.data_venda}
            onChange={handleChange}
          />
        </div>

        {/* Data Evento */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Data Evento</label>
          <input
            name="data_evento"
            type="date"
            className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
            value={novoRegisto.data_evento}
            onChange={handleChange}
          />
          {datasEventoVendas.length > 0 && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              Datas existentes (clique para preencher):
              <ul className="list-disc list-inside">
                {datasEventoVendas.map((d, idx) => {
                  const yyyyMMdd = new Date(d).toISOString().split("T")[0]; // yyyy-mm-dd
                  return (
                    <li
                      key={idx}
                      onClick={() =>
                        setNovoRegisto((prev) => ({ ...prev, data_evento: yyyyMMdd }))
                      }
                      className="cursor-pointer text-blue-600 hover:underline"
                    >
                      {new Date(d).toLocaleDateString("pt-PT")}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Evento */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Evento</label>
          <select
            name="evento"
            className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={novoRegisto.evento}
            onChange={async (e) => {
              const eventoSel = e.target.value;
              // limpa data para forçar nova escolha coerente
              setNovoRegisto(prev => ({ ...prev, evento: eventoSel, data_evento: "" }));
              // carrega datas sugeridas
              await buscarDatasEventoVendas(eventoSel);
            }}
          >
            <option value="">-- Selecionar Evento --</option>
            {eventosDropdown.map(e => (
              <option key={e.id} value={e.nome}>{e.nome}</option>
            ))}
          </select>
        </div>

        {/* Bilhete */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Bilhete</label>
          <input
            name="estadio"
            placeholder="Bilhete"
            className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={novoRegisto.estadio}
            onChange={handleChange}
          />
        </div>

        {/* Ganho */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Ganho (€)</label>
          <input
            name="ganho"
            type="number"
            placeholder="Ganho (€)"
            className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={novoRegisto.ganho}
            onChange={handleChange}
          />
        </div>

        {/* Estado */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Estado</label>
          <select
            name="estado"
            className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={novoRegisto.estado}
            onChange={handleChange}
          >
            <option value="Entregue">Entregue</option>
            <option value="Por entregar">Por entregar</option>
            <option value="Disputa">Disputa</option>
            <option value="Pago">Pago</option>
          </select>
        </div>
      </div>

      <button
        onClick={adicionarRegisto}
        disabled={idEmUso || !novoRegisto.id_venda}
        className={`mt-4 px-4 py-2 rounded transition-colors duration-300 text-white
          ${idEmUso || !novoRegisto.id_venda
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"}`}
      >
        Guardar Registo
      </button>
    </div>
  </>
)}



 <div className="mb-5 overflow-x-auto rounded-[22px] border border-white/12 bg-[#111a2e]/90 shadow-[0_12px_34px_rgba(0,0,0,0.26)] backdrop-blur-sm">
  <div className="flex min-w-max items-center gap-3 px-3 py-3 md:px-4">
    <div className="relative">
  <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-white/45" />
  <input
    type="text"
    placeholder="Pesquisar equipa, ID venda ou data"
    value={filtroPesquisa}
    onChange={(e) => setFiltroPesquisa(e.target.value)}
    className="h-11 w-[320px] md:w-[380px] rounded-xl border border-white/14 bg-white/[0.04] pl-11 pr-10 text-[15px] text-white placeholder:text-white/42 outline-none transition focus:border-blue-400/70 focus:bg-white/[0.06]"
  />
  {filtroPesquisa && (
    <button
      onClick={() => setFiltroPesquisa("")}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/45 transition hover:text-red-400"
      title="Limpar"
    >
      ✕
    </button>
  )}
</div>

    {/* Filtro aviso */}
    <button
      onClick={() => setFiltroExclamacao((v) => !v)}
      title="Mostrar apenas linhas com aviso"
      className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 font-semibold transition
        ${
          filtroExclamacao
            ? "border-yellow-400/70 bg-yellow-400 text-[#1b1607] shadow-[0_0_20px_rgba(250,204,21,0.16)]"
            : "border-yellow-500/60 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/16"
        }`}
    >
      <FaFilter className="text-[14px]" />
      <span>{filtroExclamacao ? "Só com aviso" : "Filtrar"}</span>
    </button>

    {/* espaçador */}
    <div className="w-2 md:w-4" />
    <div className="h-8 w-px bg-white/10" />
    <div className="flex-1" />

    {/* Botão adicionar */}
    <button
      onClick={() => setMostrarFormulario((v) => !v)}
      className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)] transition hover:brightness-110"
    >
      <FaPlus className="text-[14px]" />
      <span>{mostrarFormulario ? "Fechar formulário" : "Adicionar registo"}</span>
    </button>

    {/* Botão verificar emails */}
    <button
      onClick={forcarAtualizacaoEmail}
      className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 px-5 font-semibold text-white shadow-[0_10px_24px_rgba(16,185,129,0.24)] transition hover:brightness-110"
    >
      <FaSyncAlt className="text-[14px]" />
      <span>Verificar E-mails</span>
    </button>

    {/* Botão excel */}
    <button
      onClick={() => exportarParaExcel(registos)}
      className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-5 font-semibold text-white shadow-[0_10px_24px_rgba(34,197,94,0.24)] transition hover:brightness-110"
    >
      <FaFileExcel className="text-[16px]" />
      <span>Exportar Excel</span>
    </button>
  </div>
</div>





      
  
      <div className="hidden xl:block overflow-x-auto w-full rounded-[22px] border border-white/10 bg-[#0f1729]/70 shadow-[0_14px_36px_rgba(0,0,0,0.24)]">
  <table className="min-w-full text-sm text-left text-white transition-colors duration-300">
         <thead className="bg-white/[0.04] backdrop-blur-sm transition-colors duration-300">
  <tr className="border-b border-white/10">
    <th
      className="px-4 py-4 cursor-pointer text-[15px] font-bold text-white/70 hover:text-white transition"
      onClick={() => handleOrdenarPor("id_venda")}
    >
      ID Venda {colunaOrdenacao === "id_venda" && (ordemAscendente ? "▲" : "▼")}
    </th>

    <th
      className="px-4 py-4 cursor-pointer text-[15px] font-bold text-white/70 hover:text-white transition"
      onClick={() => handleOrdenarPor("data_venda")}
    >
      Data Venda {colunaOrdenacao === "data_venda" && (ordemAscendente ? "▲" : "▼")}
    </th>

    <th
      className="px-4 py-4 cursor-pointer text-[15px] font-bold text-white/70 hover:text-white transition"
      onClick={() => handleOrdenarPor("data_evento")}
    >
      Data Evento {colunaOrdenacao === "data_evento" && (ordemAscendente ? "▲" : "▼")}
    </th>

    <th
      className="px-4 py-4 cursor-pointer text-[15px] font-bold text-white/70 hover:text-white transition"
      onClick={() => handleOrdenarPor("evento")}
    >
      Evento {colunaOrdenacao === "evento" && (ordemAscendente ? "▲" : "▼")}
    </th>

    <th className="px-4 py-4 text-[15px] font-bold text-white/70">
      Bilhete
    </th>

    <th
      className="px-4 py-4 cursor-pointer text-[15px] font-bold text-white/70 hover:text-white transition"
      onClick={() => handleOrdenarPor("ganho")}
    >
      Ganho (€) {colunaOrdenacao === "ganho" && (ordemAscendente ? "▲" : "▼")}
    </th>

    <th
      className="px-4 py-4 cursor-pointer text-[15px] font-bold text-white/70 hover:text-white transition"
      onClick={() => handleOrdenarPor("estado")}
    >
      Estado {colunaOrdenacao === "estado" && (ordemAscendente ? "▲" : "▼")}
    </th>

    <th className="px-4 py-4 text-[15px] font-bold text-white/70">
      Ações
    </th>
  </tr>
</thead>
          <tbody>
            {registos
              .filter(v => {
                const termo = filtroPesquisa.trim().toLowerCase();

                const dataEventoPT = formatarDataPesquisa(v.data_evento).toLowerCase();
                const dataVendaPT = formatarDataPesquisa(v.data_venda).toLowerCase();
                const dataEventoISO = (v.data_evento || "").split("T")[0].toLowerCase();
                const dataVendaISO = (v.data_venda || "").split("T")[0].toLowerCase();
                const idVenda = String(v.id_venda || "").toLowerCase();
                const evento = String(v.evento || "").toLowerCase();
                const bilhete = String(v.estadio || "").toLowerCase();
                const estado = String(v.estado || "").toLowerCase();
                
                const correspondePesquisa =
                  termo === "" ||
                  idVenda.includes(termo) ||
                  evento.includes(termo) ||
                  bilhete.includes(termo) ||
                  estado.includes(termo) ||
                  dataEventoPT.includes(termo) ||
                  dataVendaPT.includes(termo) ||
                  dataEventoISO.includes(termo) ||
                  dataVendaISO.includes(termo);
                
                const correspondeExclamacao = !filtroExclamacao || temAviso(v);
                
                return correspondePesquisa && correspondeExclamacao;
              })
              .map(r => (

              <tr key={r.id} className={`border-t ${
    modoEdicao === r.id ? 'bg-blue-50 dark:bg-blue-900' : 'bg-white dark:bg-gray-900'
  } text-gray-900 dark:text-gray-100 transition-colors duration-300`}
>
                {modoEdicao === r.id ? (
                  <>
                    <td className="p-2"><input type="number" className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={registoEditado.id_venda} onChange={e => setRegistoEditado({ ...registoEditado, id_venda: e.target.value })} /></td>
                    <td className="p-2">
  <input
    type="date"
    className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300
  dark:[color-scheme:dark]"
    value={registoEditado.data_venda || ""}
    onChange={e => setRegistoEditado({ ...registoEditado, data_venda: e.target.value })}
/>
</td>
                    <td className="p-2"><input type="date" className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300
  dark:[color-scheme:dark]" value={registoEditado.data_evento} onChange={e => setRegistoEditado({ ...registoEditado, data_evento: e.target.value })} /></td>
                    <td className="p-2">
                      <select className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={registoEditado.evento} onChange={e => setRegistoEditado({ ...registoEditado, evento: e.target.value })}>
                        <option value="">-- Evento --</option>
                        {eventosDropdown.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                      </select>
                    </td>
                    <td className="p-2"><input className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={registoEditado.estadio} onChange={e => setRegistoEditado({ ...registoEditado, estadio: e.target.value })} /></td>
                    <td className="p-2"><input type="number" className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={registoEditado.ganho} onChange={e => setRegistoEditado({ ...registoEditado, ganho: e.target.value })} /></td>
                    <td className="p-2">
                      <select className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={registoEditado.estado} onChange={e => setRegistoEditado({ ...registoEditado, estado: e.target.value })}>
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
  <td className="p-2">
  <span className={`px-2 py-1 rounded text-xs font-semibold
    ${r.estado === "Pago" ? "bg-green-600 text-white dark:bg-green-700" :
     r.estado === "Disputa" ? "bg-red-500 text-white dark:bg-red-600" :
     r.estado === "Entregue" ? "bg-blue-500 text-white dark:bg-blue-600" :
     "bg-yellow-400 text-black dark:bg-yellow-600 dark:text-white"}
  `}>
    {r.estado}
  </span>
</td>

  <td className="p-2 flex items-center gap-2">
  {
    dadosSincronizados && (() => {
      const evento = r.evento?.trim() || "";
      const dataEvento = r.data_evento?.split("T")[0] || "";
      const chave = `${evento}|${dataEvento}`;
      const invalido = !evento || !dataEvento || !eventosChaveSet.has(chave);
  
      return invalido && (
        <span
          className={`text-yellow-500 ${filtroExclamacao ? "animate-pulse" : ""}`}
          title="Venda não associada a evento"
        >
          ⚠️
        </span>
      );
    })()
  }






  <button onClick={() => ativarEdicao(r.id, r)} className="text-blue-600 hover:underline">Editar</button>
  <button onClick={() => pedirConfirmEliminar([r.id])} className="text-red-600 hover:underline">Eliminar</button>
</td>


                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      

      <div
        className="space-y-5 xl:hidden px-2"
        onTouchStart={(e) => setStartY(e.touches[0].clientY)}
        onTouchMove={(e) => {
          const deslocamento = e.touches[0].clientY - startY;
          const noTopo = window.scrollY === 0;
        
          if (startY !== null && deslocamento > 50 && noTopo) {
            setStartY(null); // impede múltiplas execuções
            toast.info("🔄 A atualizar dados...");
            buscarRegistos();
          }
        }}
        onTouchEnd={() => setStartY(null)}
      >
        {eventosChaveCarregado && registos
          .filter(v => {
            const termo = filtroPesquisa.trim().toLowerCase();

            const dataEventoPT = formatarDataPesquisa(v.data_evento).toLowerCase();
            const dataVendaPT = formatarDataPesquisa(v.data_venda).toLowerCase();
            const dataEventoISO = (v.data_evento || "").split("T")[0].toLowerCase();
            const dataVendaISO = (v.data_venda || "").split("T")[0].toLowerCase();
            const idVenda = String(v.id_venda || "").toLowerCase();
            const evento = String(v.evento || "").toLowerCase();
            const bilhete = String(v.estadio || "").toLowerCase();
            const estado = String(v.estado || "").toLowerCase();
            
            const correspondePesquisa =
              termo === "" ||
              idVenda.includes(termo) ||
              evento.includes(termo) ||
              bilhete.includes(termo) ||
              estado.includes(termo) ||
              dataEventoPT.includes(termo) ||
              dataVendaPT.includes(termo) ||
              dataEventoISO.includes(termo) ||
              dataVendaISO.includes(termo);
            
            const correspondeExclamacao = !filtroExclamacao || temAviso(v);
            
            return correspondePesquisa && correspondeExclamacao;
          })
          .map((r) => {
          const emEdicao = modoEdicao === r.id;
          return (
            <div
              key={r.id}
              className="rounded-xl border border-gray-700 bg-gradient-to-br from-zinc-900 to-gray-800 p-4 shadow-xl text-white"
            >
              {/* Topo: ID + Estado */}
              <div className="flex justify-between items-center text-sm mb-2">
                <div className="text-gray-400">
                  ID:{" "}
                  <span className="font-semibold">
                    {emEdicao ? (
                      <input
                        type="number"
                        value={registoEditado.id_venda}
                        onChange={(e) =>
                          setRegistoEditado({ ...registoEditado, id_venda: e.target.value })
                        }
                        className="w-20 bg-gray-900 border border-gray-500 p-1 rounded text-white"
                      />
                    ) : (
                      r.id_venda
                    )}
                  </span>
                </div>
                {emEdicao ? (
                  <select
                    value={registoEditado.estado}
                    onChange={(e) =>
                      setRegistoEditado({ ...registoEditado, estado: e.target.value })
                    }
                    className={`px-3 py-1 rounded-full text-xs font-bold appearance-none ${
                      registoEditado.estado === "Pago"
                        ? "bg-green-500 text-white"
                        : registoEditado.estado === "Entregue"
                        ? "bg-blue-500 text-white"
                        : "bg-yellow-400 text-black"
                    }`}
                  >
                    <option value="Entregue">Entregue</option>
                    <option value="Por entregar">Por entregar</option>
                    <option value="Disputa">Disputa</option>
                    <option value="Pago">Pago</option>
                  </select>
                ) : (
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      r.estado === "Pago"
                        ? "bg-green-500 text-white"
                        : r.estado === "Entregue"
                        ? "bg-blue-500 text-white"
                        : "bg-yellow-400 text-black"
                    }`}
                  >
                    {r.estado}
                  </div>
                )}

              </div>
      
              {/* Evento + Bilhete */}
              {emEdicao ? (
                <>
                  <select
                    value={registoEditado.evento}
                    onChange={(e) => setRegistoEditado({ ...registoEditado, evento: e.target.value })}
                    className="w-full mb-2 bg-gray-900 border border-gray-500 p-2 rounded text-white"
                  >
                    <option value="">-- Selecionar Evento --</option>
                    {eventosDropdown.map((ev) => (
                      <option key={ev.id} value={ev.nome}>
                        {ev.nome}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={registoEditado.estadio}
                    onChange={(e) =>
                      setRegistoEditado({ ...registoEditado, estadio: e.target.value })
                    }
                    className="w-full mb-2 bg-gray-900 border border-gray-500 p-2 rounded text-white"
                  />
                </>
              ) : (
                <>
                  <div className="text-lg font-bold mb-1 text-amber-400">{r.evento}</div>
                  <div className="text-sm italic text-gray-300">{r.estadio}</div>
                </>
              )}
      
              {/* Datas */}
              <div className="flex justify-between text-sm text-gray-400 mt-3 gap-2">
                <div>
                  📅 Venda:{" "}
                  {emEdicao ? (
                    <input
                      type="date"
                      value={registoEditado.data_venda}
                      onChange={(e) =>
                        setRegistoEditado({ ...registoEditado, data_venda: e.target.value })
                      }
                      className="bg-gray-900 border border-gray-500 p-1 rounded text-white"
                    />
                  ) : (
                    <strong>{r.data_venda ? new Date(r.data_venda).toLocaleDateString("pt-PT") : ""}</strong>
                  )}
                </div>
                <div>
                  🎫 Evento:{" "}
                  {emEdicao ? (
                    <input
                      type="date"
                      value={registoEditado.data_evento}
                      onChange={(e) =>
                        setRegistoEditado({ ...registoEditado, data_evento: e.target.value })
                      }
                      className="bg-gray-900 border border-gray-500 p-1 rounded text-white"
                    />
                  ) : (
                    <strong>{r.data_evento ? new Date(r.data_evento).toLocaleDateString("pt-PT") : ""}</strong>
                  )}
                </div>
              </div>
      
              {/* Linha final com ganho + ações */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-2xl font-extrabold text-green-400">
                  {emEdicao ? (
                    <input
                      type="number"
                      value={registoEditado.ganho}
                      onChange={(e) =>
                        setRegistoEditado({ ...registoEditado, ganho: e.target.value })
                      }
                      className="w-24 bg-gray-900 border border-gray-500 p-1 rounded text-green-400 text-right"
                    />
                  ) : (
                    <span className="flash-ganho-verde text-2xl font-extrabold">+ {r.ganho} €</span>
                  )}
                </div>

                
                <div className="flex gap-4 text-xl items-center">
                 {
                  eventosChaveCarregado &&
                  r.evento && r.data_evento &&
                  !eventosChaveSet.has(`${r.evento}|${r.data_evento.split("T")[0]}`) && (
                    <span title="Venda não associada a evento" className="text-yellow-500 text-lg">⚠️</span>
                  )
                }





                  {emEdicao ? (
                    <button
                      onClick={atualizarRegisto}
                      className="text-green-400 hover:text-green-300"
                      title="Guardar"
                    >
                      💾
                    </button>
                  ) : (
                    <button
                      onClick={() => ativarEdicao(r.id, r)}
                      className="text-blue-400 hover:text-blue-300"
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                  )}
                  <button
                    onClick={() => pedirConfirmEliminar([r.id])}
                    className="text-red-400 hover:text-red-300"
                    title="Eliminar"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          );
       })}
    </div>






      {/* Modal de confirmação */}
      {idsAEliminar.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 dark:text-gray-100 rounded p-6 shadow-lg transition-colors duration-300">
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
                className="bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors duration-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {erroIDExistente && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 dark:text-gray-100 p-6 rounded shadow-lg max-w-md w-full transition-colors duration-300">
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
  <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 shadow-xl px-4 py-3 rounded-lg z-50 transition-colors duration-300">
    <p className="text-sm text-gray-700 dark:text-gray-100">{mensagemModal}</p>
  </div>

)}

    </div> 
  );
}
