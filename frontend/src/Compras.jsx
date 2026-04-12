
import { useEffect, useState } from "react";
import { FaFileExcel } from "react-icons/fa";
import { FaEdit, FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx";
import saveAs from "file-saver";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function exportarComprasParaExcel(registosCompras) {
  const worksheet = XLSX.utils.json_to_sheet(registosCompras);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Compras");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, "compras.xlsx");
}

const ordenarEventosDropdown = (data) => {
  return [...data]
    .filter(e => e && e.evento)
    .sort((a, b) => {
      const nomeA = (a.evento || "").toLowerCase();
      const nomeB = (b.evento || "").toLowerCase();

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

const CARD_SHELL =
  "rounded-[24px] border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]";

const INPUT_BASE =
  "w-full rounded-xl border border-white/10 bg-[#1a2742] px-3 py-2 md:py-2 lg:py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30";


const LABEL_BASE = "mb-2 text-[13px] font-semibold tracking-wide text-white/80";

const BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 md:px-4 md:py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500";


const BTN_SECONDARY =
  "inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2 md:px-4 md:py-2 text-sm font-semibold text-white/90 transition hover:bg-white/15";


const BTN_SUCCESS =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 md:px-4 md:py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500";

const TABLE_HEAD =
  "bg-white/[0.08] text-white/85 text-[13px] uppercase tracking-[0.08em]";

const TABLE_CELL = "px-2.5 lg:px-3 py-2 align-middle";

const getCompraWarning = (c, eventosChaveSet) =>
  eventosChaveSet.size > 0 &&
  (!c.evento || !c.data_evento || !eventosChaveSet.has(`${(c.evento || "").trim()}|${(c.data_evento || "").split("T")[0]}`));


export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [comprasFiltradas, setComprasFiltradas] = useState([]);
  const [eventosDropdown, setEventosDropdown] = useState([]);
  const [novaCompra, setNovaCompra] = useState({
    evento: "", local_compras: "", bancada: "", setor: "", fila: "", quantidade: "", gasto: ""
  });
  const [modoEdicao, setModoEdicao] = useState(null);
  const [confirmarEliminarId, setConfirmarEliminarId] = useState(null);
  const [filtros, setFiltros] = useState({ evento: "" });
  const [datasEvento, setDatasEvento] = useState([]);
  const [eventosChaveSet, setEventosChaveSet] = useState(new Set());
  const [mostrarFormularioMobile, setMostrarFormularioMobile] = useState(false);

const adicionarCompra = () => {
  if (!novaCompra.evento || !novaCompra.data_evento || !novaCompra.quantidade || !novaCompra.gasto) {
    toast.error("Preenche os campos obrigatórios.");
    return;
  }

  fetch("https://controlo-bilhetes.onrender.com/compras", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(novaCompra)
  })
    .then(res => res.json())
    .then(dados => {
      toast.success("Compra adicionada com sucesso.");
      setCompras(prev => [...prev, dados]);
      setComprasFiltradas(prev => [...prev, dados]);
      setNovaCompra({
        evento: "",
        data_evento: "",
        local_compras: "",
        bancada: "",
        setor: "",
        fila: "",
        quantidade: "",
        gasto: ""
      });
      setMostrarFormularioMobile(false);
    })
    .catch(err => {
      console.error("❌ Erro ao adicionar compra:", err);
      toast.error("Erro ao adicionar compra.");
    });
};




  const locaisCompra = ["Benfica Viagens", "Site Benfica", "Site Clube", "Odisseias", "Continente", "Site clube adversário", "Smartfans", "Outro", "Viagogo", "Stubhub", "Facebook"];
  const bancadas = ["Emirates", "BTV", "Sagres", "Mais vantagens"];
  const setores = [...Array.from({ length: 32 }, (_, i) => "lower " + (i + 1)),
                   ...Array.from({ length: 43 }, (_, i) => "middle " + (i + 1)),
                   ...Array.from({ length: 44 }, (_, i) => "upper " + (i + 1))];

  useEffect(() => {
    buscarCompras();
    buscarEventos();
  }, []);

  const buscarCompras = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/compras");
    const data = await res.json();
    setCompras(data);
    setComprasFiltradas(data);
  };

  const buscarEventos = async () => {
  const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2?skip=0&limit=1000");
  const data = await res.json();
  setEventosDropdown(ordenarEventosDropdown(data));

  const chaves = new Set(
    data
      .filter(e => e.evento && e.data_evento)
      .map(e => `${(e.evento || "").trim()}|${(e.data_evento || "").split("T")[0]}`)
  );


  
  setEventosChaveSet(chaves);
};



  const buscarDatasEvento = async (nomeEvento) => {
  if (!nomeEvento) {
    setDatasEvento([]);
    return;
  }
  try {
    const res = await fetch(`https://controlo-bilhetes.onrender.com/datas_evento/${encodeURIComponent(nomeEvento)}`);
    const data = await res.json();
    setDatasEvento(data);
  } catch (error) {
    console.error("Erro ao carregar datas do evento:", error);
    setDatasEvento([]);
  }
};


  const handleChange = e => {
    const { name, value } = e.target;

    
    if (name === "evento") {
        buscarDatasEvento(value);
    }

    setNovaCompra(prev => ({ ...prev, [name]: value }));
};


  const handleFiltroChange = e => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const aplicarFiltros = () => {
    let resultado = [...compras];
    if (filtros.evento) resultado = resultado.filter(c => c.evento === filtros.evento);
    setComprasFiltradas(resultado);
  };

  const limparFiltros = () => {
    setFiltros({ evento: "" });
    setComprasFiltradas(compras);
  };

  const guardarCompra = async () => {
  const camposObrigatorios = {
    evento: "Evento",
    data_evento: "Data do Evento",
    gasto: "Gasto (€)",
    quantidade: "Quantidade"
  };

  for (const campo in camposObrigatorios) {
    if (!novaCompra[campo] || novaCompra[campo].toString().trim() === "") {
      toast.error(`Preencher campo ${camposObrigatorios[campo]}`, {   toastId: `erro-${campo}` });
      return;
    }
  }

  try {
    const response = await fetch("https://controlo-bilhetes.onrender.com/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novaCompra,
        quantidade: parseInt(novaCompra.quantidade),
        gasto: parseFloat(novaCompra.gasto)
      })
    });

    if (!response.ok) {
      throw new Error("Erro ao guardar compra");
    }

    toast.success("Compra guardada com sucesso!");

    // Limpa os campos APÓS guardar com sucesso
    setNovaCompra({
      evento: "", local_compras: "", bancada: "", setor: "",
      fila: "", quantidade: "", gasto: "", data_evento: ""
    });

    buscarCompras();
  } catch (error) {
    console.error(error);
    toast.error("Erro ao guardar a compra");
  }
};


  const editarCompra = (compra) => {
  setModoEdicao(compra.id);
  setNovaCompra({
    evento: compra.evento || "",
    data_evento: compra.data_evento || "",
    local_compras: compra.local_compras || "",
    bancada: compra.bancada || "",
    setor: compra.setor || "",
    fila: compra.fila || "",
    quantidade: compra.quantidade || 0,
    gasto: compra.gasto || 0
  });
};


  const atualizarCompra = async () => {
    await fetch(`https://controlo-bilhetes.onrender.com/compras/${modoEdicao}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novaCompra,
        quantidade: parseInt(novaCompra.quantidade),
        gasto: parseFloat(novaCompra.gasto)
      })
    });
    setModoEdicao(null);
    setNovaCompra({ evento:"", local_compras:"", bancada:"", setor:"", fila:"", quantidade:"", gasto:"" });
    buscarCompras();
  };

  const pedirConfirmEliminar = id => setConfirmarEliminarId(id);
  const cancelarEliminar = () => setConfirmarEliminarId(null);

  const eliminarCompra = async id => {
    await fetch(`https://controlo-bilhetes.onrender.com/compras/${id}`, { method: "DELETE" });
    setConfirmarEliminarId(null);
    buscarCompras();
  };

  const calcularExpressao = (valor) => {
    try {
      const limpo = String(valor).replace(/\s/g, "");
  
      if (!/^[0-9+\-*/.]+$/.test(limpo)) return valor;
  
      const resultado = eval(limpo);
  
      if (isNaN(resultado) || !isFinite(resultado)) return valor;
  
      return resultado;
    } catch {
      return valor;
    }
  };
  
return (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_40%),linear-gradient(180deg,#06101f_0%,#081427_50%,#0b1730_100%)] text-white">
    <ToastContainer />

    <div className="max-w-[1180px] xl:max-w-7xl mx-auto px-3 md:px-4 xl:px-4 py-4 md:py-5 xl:py-6">
      {/* FILTROS + EXPORTAR */}
      <div className={`${CARD_SHELL} p-3 md:p-4 xl:p-4 mb-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            <select
              name="evento"
              value={filtros.evento}
              onChange={handleFiltroChange}
              className={`${INPUT_BASE} min-w-[260px] appearance-none [color-scheme:dark]`}
            >
              <option value="" className="bg-[#0f172a] text-white">
                -- Filtrar por Evento --
              </option>
              {eventosDropdown.map((e) => (
                <option
                  key={e.id}
                  value={e.evento}
                  className="bg-[#0f172a] text-white"
                >
                  {e.evento}
                </option>
              ))}
            </select>

            <button onClick={aplicarFiltros} className={BTN_PRIMARY}>
              Aplicar Filtro
            </button>

            <button onClick={limparFiltros} className={BTN_SECONDARY}>
              Limpar
            </button>
          </div>

          <button
            onClick={() => exportarComprasParaExcel(comprasFiltradas)}
            className={BTN_SUCCESS}
          >
            <FaFileExcel size={18} />
            Exportar Excel
          </button>
        </div>
      </div>

{/* FORM DESKTOP */}
<div className={`hidden md:block ${CARD_SHELL} p-4 xl:p-5 2xl:p-6 mb-6`}>
  <h2 className="text-lg xl:text-xl font-bold mb-4">
    {modoEdicao ? "Editar Compra" : "Nova Compra"}
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
    <div className="flex min-w-0 flex-col">
      <label className={LABEL_BASE}>Evento</label>
      <select
        name="evento"
        value={novaCompra.evento}
        onChange={handleChange}
        className={`${INPUT_BASE} min-w-0 appearance-none [color-scheme:dark]`}
      >
        <option value="" className="bg-[#0f172a] text-white">
          -- Evento --
        </option>
        {eventosDropdown.map((e) => (
          <option
            key={e.id}
            value={e.evento}
            className="bg-[#0f172a] text-white"
          >
            {e.evento}
          </option>
        ))}
      </select>
    </div>

    <div className="flex min-w-0 flex-col">
      <label className={LABEL_BASE}>Data do Evento</label>
      <input
        type="date"
        name="data_evento"
        value={novaCompra.data_evento || ""}
        onChange={handleChange}
        className={`${INPUT_BASE} w-full min-w-0`}
      />
      {datasEvento.length > 0 && (
        <div className="mt-2 text-xs text-white/70">
          Datas existentes (clique para preencher):
          <ul className="list-disc list-inside mt-1 space-y-1">
            {datasEvento.map((d, idx) => {
              const dataFormatada = new Date(d).toISOString().split("T")[0];
              return (
                <li
                  key={idx}
                  onClick={() =>
                    setNovaCompra((prev) => ({
                      ...prev,
                      data_evento: dataFormatada,
                    }))
                  }
                  className="cursor-pointer text-blue-300 hover:underline"
                >
                  {new Date(d).toLocaleDateString("pt-PT")}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>

    <div className="flex min-w-0 flex-col">
      <label className={LABEL_BASE}>Local da Compra</label>
      <select
        name="local_compras"
        value={novaCompra.local_compras}
        onChange={handleChange}
        className={`${INPUT_BASE} min-w-0 appearance-none [color-scheme:dark]`}
      >
        <option value="" className="bg-[#0f172a] text-white">
          -- Local da Compra --
        </option>
        {locaisCompra.map((local) => (
          <option
            key={local}
            value={local}
            className="bg-[#0f172a] text-white"
          >
            {local}
          </option>
        ))}
      </select>
    </div>

    <div className="flex min-w-0 flex-col">
      <label className={LABEL_BASE}>Bancada</label>
      <input
        list="bancadas"
        name="bancada"
        placeholder="Bancada"
        value={novaCompra.bancada}
        onChange={handleChange}
        className={INPUT_BASE}
      />
      <datalist id="bancadas">
        {bancadas.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
    </div>

    <div className="flex min-w-0 flex-col">
      <label className={LABEL_BASE}>Setor</label>
      <input
        list="setores"
        name="setor"
        placeholder="Setor"
        value={novaCompra.setor}
        onChange={handleChange}
        className={INPUT_BASE}
      />
      <datalist id="setores">
        {setores.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>

    <div className="flex min-w-0 flex-col">
      <label className={LABEL_BASE}>Fila</label>
      <input
        name="fila"
        placeholder="Fila"
        value={novaCompra.fila}
        onChange={handleChange}
        className={INPUT_BASE}
      />
    </div>

    <div className="flex min-w-0 flex-col">
      <label className={LABEL_BASE}>Quantidade</label>
      <input
        name="quantidade"
        type="number"
        placeholder="Quantidade"
        value={novaCompra.quantidade}
        onChange={handleChange}
        className={INPUT_BASE}
      />
    </div>

    <div className="flex min-w-0 flex-col">
      <label className={LABEL_BASE}>Gasto (€)</label>
      <input
        name="gasto"
        type="text"
        placeholder="Gasto (€)"
        value={novaCompra.gasto}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const resultado = calcularExpressao(e.target.value);
            setNovaCompra((prev) => ({
              ...prev,
              gasto: String(resultado),
            }));
          }
        }}
        className={INPUT_BASE}
      />
    </div>
  </div>

  <button
    type="button"
    onClick={modoEdicao ? atualizarCompra : guardarCompra}
    className={`mt-5 ${BTN_PRIMARY}`}
  >
    {modoEdicao ? "Atualizar" : "Guardar"}
  </button>
</div>

      {/* TABELA DESKTOP */}
      <div className={`${CARD_SHELL} p-3 lg:p-4 mb-6 hidden md:block`}>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-sm text-left text-white/85">
            <thead className="sticky top-0 z-10 backdrop-blur-xl">
              <tr className={TABLE_HEAD}>
                <th className={TABLE_CELL}>Evento</th>
                <th className={TABLE_CELL}>Data Evento</th>
                <th className={TABLE_CELL}>Local Compra</th>
                <th className={TABLE_CELL}>Bancada</th>
                <th className={TABLE_CELL}>Setor</th>
                <th className={TABLE_CELL}>Fila</th>
                <th className={TABLE_CELL}>Qt.</th>
                <th className={TABLE_CELL}>Gasto (€)</th>
                <th className={TABLE_CELL}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {[...comprasFiltradas]
                .sort((a, b) => a.evento.localeCompare(b.evento))
                .map((c) => (
                  <tr
                    key={"c" + c.id}
                    className="border-t border-white/10 hover:bg-white/[0.04] transition"
                  >
                    {modoEdicao === c.id ? (
                      <>
                        <td className={TABLE_CELL}>
                          <select
                            name="evento"
                            className={`${INPUT_BASE} !py-2 !px-3 appearance-none [color-scheme:dark]`}
                            value={novaCompra.evento}
                            onChange={(e) => {
                              const eventoSelecionado = e.target.value;
                              const eventoCompleto = eventosDropdown.find(
                                (ev) => ev.evento === eventoSelecionado
                              );
                              setNovaCompra((prev) => ({
                                ...prev,
                                evento: eventoCompleto?.evento || eventoSelecionado,
                                data_evento:
                                  eventoCompleto?.data_evento?.split("T")[0] || "",
                              }));
                            }}
                          >
                            <option value="" className="bg-[#0f172a] text-white">
                              -- Evento --
                            </option>
                            {eventosDropdown.map((e) => (
                              <option
                                key={e.id}
                                value={e.evento}
                                className="bg-[#0f172a] text-white"
                              >
                                {e.evento}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className={TABLE_CELL}>
                          <input
                            type="date"
                            name="data_evento"
                            className={`${INPUT_BASE} !py-2 !px-3`}
                            value={novaCompra.data_evento || ""}
                            onChange={handleChange}
                          />
                        </td>

                        <td className={TABLE_CELL}>
                          <input
                            name="local_compras"
                            className={`${INPUT_BASE} !py-2 !px-3`}
                            value={novaCompra.local_compras}
                            onChange={handleChange}
                          />
                        </td>

                        <td className={TABLE_CELL}>
                          <input
                            name="bancada"
                            className={`${INPUT_BASE} !py-2 !px-3`}
                            value={novaCompra.bancada}
                            onChange={handleChange}
                          />
                        </td>

                        <td className={TABLE_CELL}>
                          <input
                            name="setor"
                            className={`${INPUT_BASE} !py-2 !px-3`}
                            value={novaCompra.setor}
                            onChange={handleChange}
                          />
                        </td>

                        <td className={TABLE_CELL}>
                          <input
                            name="fila"
                            className={`${INPUT_BASE} !py-2 !px-3`}
                            value={novaCompra.fila}
                            onChange={handleChange}
                          />
                        </td>

                        <td className={TABLE_CELL}>
                          <input
                            type="number"
                            name="quantidade"
                            className={`${INPUT_BASE} !py-2 !px-3`}
                            value={novaCompra.quantidade}
                            onChange={handleChange}
                          />
                        </td>

                        <td className={TABLE_CELL}>
                          <input
                            type="text"
                            name="gasto"
                            className={`${INPUT_BASE} !py-2 !px-3`}
                            value={novaCompra.gasto}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const resultado = calcularExpressao(e.target.value);
                                setNovaCompra((prev) => ({
                                  ...prev,
                                  gasto: String(resultado),
                                }));
                              }
                            }}
                          />
                        </td>

                        <td className={TABLE_CELL}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={atualizarCompra}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setModoEdicao(null)}
                              className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 hover:bg-white/15 transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={TABLE_CELL}>{c.evento}</td>
                        <td className={TABLE_CELL}>
                          {c.data_evento
                            ? new Date(c.data_evento).toLocaleDateString("pt-PT")
                            : "-"}
                        </td>
                        <td className={TABLE_CELL}>{c.local_compras}</td>
                        <td className={TABLE_CELL}>{c.bancada}</td>
                        <td className={TABLE_CELL}>{c.setor}</td>
                        <td className={TABLE_CELL}>{c.fila}</td>
                        <td className={TABLE_CELL}>{c.quantidade}</td>
                        <td className={`${TABLE_CELL} text-red-400 font-semibold`}>
                          -{c.gasto} €
                        </td>
                        <td className={TABLE_CELL}>
                          <div className="flex items-center gap-2">
                            {getCompraWarning(c, eventosChaveSet) && (
                              <span
                                className="text-yellow-400 text-lg"
                                title="Compra não associada a evento"
                              >
                                ⚠️
                              </span>
                            )}

                            <button
                              onClick={() => editarCompra(c)}
                              className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 transition"
                            >
                              Editar
                            </button>

                            <button
                              onClick={() => pedirConfirmEliminar(c.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 transition"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE */}
      <div className="md:hidden">
        {/* FILTRO MOBILE */}
        <div className={`${CARD_SHELL} p-4 mb-4`}>
          <label className={`${LABEL_BASE} block`}>Filtrar por Evento</label>
          <select
            name="evento"
            className={`${INPUT_BASE} appearance-none [color-scheme:dark]`}
            value={filtros.evento}
            onChange={(e) => {
              const eventoSelecionado = e.target.value;
              setFiltros((prev) => ({ ...prev, evento: eventoSelecionado }));
              const resultado = eventoSelecionado
                ? compras.filter((c) => c.evento === eventoSelecionado)
                : compras;
              setComprasFiltradas(resultado);
            }}
          >
            <option value="" className="bg-[#0f172a] text-white">
              -- Selecionar Evento --
            </option>
            {eventosDropdown.map((e) => (
              <option
                key={e.id}
                value={e.evento}
                className="bg-[#0f172a] text-white"
              >
                {e.evento}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setFiltros({ evento: "" });
              setComprasFiltradas(compras);
            }}
            className={`mt-3 w-full ${BTN_SECONDARY}`}
          >
            Limpar
          </button>
        </div>

        {/* BOTÃO ADICIONAR MOBILE */}
        <button
          onClick={() => setMostrarFormularioMobile(!mostrarFormularioMobile)}
          className={`mb-4 w-full ${BTN_PRIMARY}`}
        >
          {mostrarFormularioMobile ? "Fechar" : "+ Adicionar Compra"}
        </button>

        {/* FORM MOBILE */}
        {mostrarFormularioMobile && (
          <div className={`${CARD_SHELL} p-4 mb-6 space-y-3`}>
            <select
              name="evento"
              className={`${INPUT_BASE} appearance-none [color-scheme:dark]`}
              value={novaCompra.evento}
              onChange={handleChange}
            >
              <option value="" className="bg-[#0f172a] text-white">
                -- Selecionar Evento --
              </option>
              {eventosDropdown.map((e) => (
                <option
                  key={e.id}
                  value={e.evento}
                  className="bg-[#0f172a] text-white"
                >
                  {e.evento}
                </option>
              ))}
            </select>

            <input
              type="date"
              name="data_evento"
              className={INPUT_BASE}
              value={novaCompra.data_evento}
              onChange={handleChange}
              placeholder="Data Evento"
            />

            <select
              name="local_compras"
              className={`${INPUT_BASE} appearance-none [color-scheme:dark]`}
              value={novaCompra.local_compras}
              onChange={handleChange}
            >
              <option value="" className="bg-[#0f172a] text-white">
                -- Local da Compra --
              </option>
              {locaisCompra.map((local) => (
                <option
                  key={local}
                  value={local}
                  className="bg-[#0f172a] text-white"
                >
                  {local}
                </option>
              ))}
            </select>

            <input
              list="bancadas-mobile"
              name="bancada"
              placeholder="Bancada"
              className={INPUT_BASE}
              value={novaCompra.bancada}
              onChange={handleChange}
            />
            <datalist id="bancadas-mobile">
              {bancadas.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>

            <input
              list="setores-mobile"
              name="setor"
              placeholder="Setor"
              className={INPUT_BASE}
              value={novaCompra.setor}
              onChange={handleChange}
            />
            <datalist id="setores-mobile">
              {setores.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>

            <input
              name="fila"
              placeholder="Fila"
              className={INPUT_BASE}
              value={novaCompra.fila}
              onChange={handleChange}
            />

            <input
              name="quantidade"
              type="number"
              placeholder="Quantidade"
              className={INPUT_BASE}
              value={novaCompra.quantidade}
              onChange={handleChange}
            />

            <input
              name="gasto"
              type="text"
              placeholder="Gasto (€)"
              className={INPUT_BASE}
              value={novaCompra.gasto}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const resultado = calcularExpressao(e.target.value);
                  setNovaCompra((prev) => ({
                    ...prev,
                    gasto: String(resultado),
                  }));
                }
              }}
            />

            <button onClick={adicionarCompra} className={`w-full ${BTN_SUCCESS}`}>
              Guardar Compra
            </button>
          </div>
        )}

        {/* DATAS SUGERIDAS MOBILE */}
        {modoEdicao === null && datasEvento.length > 0 && novaCompra.evento && (
          <div className="mt-2 text-xs text-white/70 px-2 mb-4">
            Datas existentes (clique para preencher):
            <ul className="list-disc list-inside mt-1">
              {datasEvento.map((d, idx) => {
                const dataFormatada = new Date(d).toISOString().split("T")[0];
                return (
                  <li
                    key={idx}
                    onClick={() =>
                      setNovaCompra((prev) => ({ ...prev, data_evento: dataFormatada }))
                    }
                    className="cursor-pointer text-amber-300 hover:underline"
                  >
                    {new Date(d).toLocaleDateString("pt-PT")}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* CARDS MOBILE */}
        <div className="space-y-5 px-2">
          {comprasFiltradas.map((c) => {
            const emEdicao = modoEdicao === c.id;

            return (
              <div
                key={c.id}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#101a2f] to-[#0b1220] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.35)]"
              >
                {emEdicao ? (
                  <>
                    <select
                      name="evento"
                      value={novaCompra.evento}
                      onChange={(e) => {
                        const eventoSelecionado = e.target.value;
                        setNovaCompra((prev) => ({ ...prev, evento: eventoSelecionado }));

                        const datasEncontradas = eventosDropdown
                          .filter((ev) => ev.evento === eventoSelecionado)
                          .map((ev) => ev.data_evento);

                        setDatasEvento(datasEncontradas);
                      }}
                      className={`${INPUT_BASE} mb-2 appearance-none [color-scheme:dark]`}
                    >
                      <option value="" className="bg-[#0f172a] text-white">
                        -- Selecionar Evento --
                      </option>
                      {eventosDropdown
                        .sort((a, b) => a.evento.localeCompare(b.evento))
                        .map((e) => (
                          <option
                            key={e.id}
                            value={e.evento}
                            className="bg-[#0f172a] text-white"
                          >
                            {e.evento}
                          </option>
                        ))}
                    </select>

                    <div className="flex flex-col mb-2">
                      <input
                        type="date"
                        name="data_evento"
                        value={novaCompra.data_evento || ""}
                        onChange={handleChange}
                        className={INPUT_BASE}
                        placeholder="Data Evento"
                      />

                      {datasEvento.length > 0 && (
                        <div className="mt-2 text-xs text-white/70">
                          Datas existentes (clique para preencher):
                          <ul className="list-disc list-inside mt-1">
                            {datasEvento.map((d, idx) => {
                              const dataFormatada = new Date(d).toISOString().split("T")[0];
                              return (
                                <li
                                  key={idx}
                                  onClick={() =>
                                    setNovaCompra((prev) => ({
                                      ...prev,
                                      data_evento: dataFormatada,
                                    }))
                                  }
                                  className="cursor-pointer text-amber-300 hover:underline"
                                >
                                  {new Date(d).toLocaleDateString("pt-PT")}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-bold mb-1 text-amber-400">{c.evento}</div>
                    <div className="text-sm italic text-white/55">
                      {c.data_evento
                        ? new Date(c.data_evento).toLocaleDateString("pt-PT")
                        : "-"}
                    </div>
                  </>
                )}

                <div className="text-sm mb-2 space-y-2 mt-3">
                  {emEdicao ? (
                    <>
                      <input
                        type="text"
                        value={novaCompra.local_compras}
                        onChange={(e) =>
                          setNovaCompra({ ...novaCompra, local_compras: e.target.value })
                        }
                        className={INPUT_BASE}
                        placeholder="Local da Compra"
                      />

                      <input
                        list="bancadas-card"
                        value={novaCompra.bancada}
                        onChange={(e) =>
                          setNovaCompra({ ...novaCompra, bancada: e.target.value })
                        }
                        className={INPUT_BASE}
                        placeholder="Bancada"
                      />
                      <datalist id="bancadas-card">
                        {bancadas.map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>

                      <input
                        list="setores-card"
                        value={novaCompra.setor}
                        onChange={(e) =>
                          setNovaCompra({ ...novaCompra, setor: e.target.value })
                        }
                        className={INPUT_BASE}
                        placeholder="Setor"
                      />
                      <datalist id="setores-card">
                        {setores.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>

                      <input
                        type="text"
                        value={novaCompra.fila}
                        onChange={(e) => setNovaCompra({ ...novaCompra, fila: e.target.value })}
                        className={INPUT_BASE}
                        placeholder="Fila"
                      />

                      <input
                        type="number"
                        value={novaCompra.quantidade}
                        onChange={(e) =>
                          setNovaCompra({ ...novaCompra, quantidade: e.target.value })
                        }
                        className={INPUT_BASE}
                        placeholder="Quantidade"
                      />
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-white/45">Local:</span> {c.local_compras}
                      </div>
                      <div>
                        <span className="text-white/45">Bancada:</span> {c.bancada}
                      </div>
                      <div>
                        <span className="text-white/45">Setor:</span> {c.setor}
                      </div>
                      <div>
                        <span className="text-white/45">Fila:</span> {c.fila}
                      </div>
                      <div>
                        <span className="text-white/45">Quantidade:</span> {c.quantidade}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4">
                  {emEdicao ? (
                    <span className="text-red-400 font-bold text-xl">
                      <input
                        type="text"
                        value={novaCompra.gasto}
                        onChange={(e) =>
                          setNovaCompra({ ...novaCompra, gasto: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const resultado = calcularExpressao(e.target.value);
                            setNovaCompra((prev) => ({
                              ...prev,
                              gasto: String(resultado),
                            }));
                          }
                        }}
                        className="w-28 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right text-red-400 outline-none"
                        placeholder="Gasto (€)"
                      />
                    </span>
                  ) : (
                    <span className="text-red-400 font-bold text-xl">-{c.gasto} €</span>
                  )}

                  <div className="flex items-center gap-4 text-lg">
                    {getCompraWarning(c, eventosChaveSet) && (
                      <span
                        className="text-yellow-400"
                        title="Compra não associada a evento"
                      >
                        ⚠️
                      </span>
                    )}

                    {emEdicao ? (
                      <>
                        <button
                          onClick={atualizarCompra}
                          className="text-emerald-300 hover:text-emerald-200"
                          title="Guardar"
                        >
                          💾
                        </button>
                        <button
                          onClick={() => setModoEdicao(null)}
                          className="text-white/60 hover:text-white/90"
                          title="Cancelar"
                        >
                          ✖️
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => editarCompra(c)} title="Editar">
                          <FaEdit className="text-blue-300 hover:text-blue-200" />
                        </button>
                        <button onClick={() => pedirConfirmEliminar(c.id)} title="Eliminar">
                          <FaTrash className="text-red-300 hover:text-red-200" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL ELIMINAR */}
      {confirmarEliminarId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className={`${CARD_SHELL} w-full max-w-md p-6`}>
            <p className="text-white text-base">
              Tem a certeza que deseja eliminar esta compra?
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => eliminarCompra(confirmarEliminarId)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500 transition"
              >
                Sim, eliminar
              </button>

              <button
                onClick={cancelarEliminar}
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}          
