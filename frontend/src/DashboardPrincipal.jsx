import { getEquipaCasaCanonica, getResumoMatchingInteligente } from "@/utils/resumoEventos";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import BarraClubes from "./BarraClubes";

export default function DashboardPrincipal() {
  console.log("DASHBOARD RENDER");
  const [resumoFaltas, setResumoFaltas] = useState([]);
  const [registosCompras, setRegistosCompras] = useState([]);
  const [registosVendas, setRegistosVendas] = useState([]);
  const [resumo, setResumo] = useState({ ganhos: 0, gastos: 0, lucro: 0, entregasPendentes: 0 });
  const [ultimosEventos, setUltimosEventos] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [clubes, setClubes] = useState([]);
  const navigate = useNavigate();

  const irParaEventoExpandido = (nomeEvento) => {
    navigate(`/eventos?expandir=${encodeURIComponent(nomeEvento)}`);
  };

  const [eventosCalendario, setEventosCalendario] = useState([]);
  const [entregasPendentesDetalhadas, setEntregasPendentesDetalhadas] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const fetchEventosCalendario = async () => {
      try {
        const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_calendario");
        const data = await res.json();
        setEventosCalendario(data);
      } catch (error) {
        console.error("Erro ao carregar eventos do calendário:", error);
      }
    };
    fetchEventosCalendario();
  }, []);

  useEffect(() => {
    const fetchClubes = async () => {
      try {
        const res = await fetch("https://controlo-bilhetes.onrender.com/clubes");
        const data = await res.json();
        setClubes(data);
      } catch (error) {
        console.error("Erro ao carregar clubes:", error);
      }
    };
    fetchClubes();
  }, []);

  useEffect(() => {
    const fetchResumo = async () => {
      try {
        const res = await fetch("https://controlo-bilhetes.onrender.com/resumo_dashboard");
        const data = await res.json();
        setResumo(data);
        setUltimosEventos(data.ultimos_eventos);
      } catch (error) {
        console.error("Erro ao carregar resumo do dashboard:", error);
      }
    };
    fetchResumo();
  }, []);

  useEffect(() => {
    const fetchEntregasPendentes = async () => {
      try {
        const res = await fetch("https://controlo-bilhetes.onrender.com/entregas_pendentes_proximos_15_dias");
        const data = await res.json();
        setEntregasPendentesDetalhadas(data);
      } catch (error) {
        console.error("Erro ao carregar entregas pendentes:", error);
      }
    };
    fetchEntregasPendentes();
  }, []);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const [comprasRes, vendasRes] = await Promise.all([
          fetch("https://controlo-bilhetes.onrender.com/compras"),
          fetch("https://controlo-bilhetes.onrender.com/listagem_vendas"),
        ]);

        const compras = await comprasRes.json();
        const vendas = await vendasRes.json();

        setRegistosCompras(compras);
        setRegistosVendas(vendas);
      } catch (err) {
        console.error("Erro ao carregar compras/vendas:", err);
      }
    };

    fetchDados();
  }, []);

  const parseDataSegura = (valor) => {
    if (!valor || typeof valor !== "string") return null;

    const texto = valor.trim();
    if (!texto) return null;

    if (texto.includes("/")) {
      const partes = texto.split("/");
      if (partes.length !== 3) return null;

      const [d, m, y] = partes.map(Number);
      if (!d || !m || !y) return null;

      const data = new Date(y, m - 1, d);
      return isNaN(data.getTime()) ? null : data;
    }

    const data = new Date(texto);
    return isNaN(data.getTime()) ? null : data;
  };

  const formatarDataSegura = (valor) => {
    const data = parseDataSegura(valor);
    return data ? data.toLocaleDateString("pt-PT") : "Data inválida";
  };

  const eventoAindaNaoPassou = (dataStr) => {
    const dataEvento = parseDataSegura(dataStr);
    if (!dataEvento) return false;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return dataEvento >= hoje;
  };

  useEffect(() => {
    const mapaEventos = new Map();

    const mesAtual = dataSelecionada.getMonth();
    const anoAtual = dataSelecionada.getFullYear();

    const dentroDoMes = (dataStr) => {
      const d = parseDataSegura(dataStr);
      if (!d) return false;
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    };

    registosCompras.forEach((c) => {
      if (!dentroDoMes(c.data_evento)) return;
      if (!eventoAindaNaoPassou(c.data_evento)) return;

      const chave = `${c.evento}|${c.data_evento}`;
      if (!mapaEventos.has(chave)) {
        mapaEventos.set(chave, {
          evento: c.evento,
          data_evento: c.data_evento,
        });
      }
    });

    registosVendas.forEach((v) => {
      if (!dentroDoMes(v.data_evento)) return;
      if (!eventoAindaNaoPassou(v.data_evento)) return;

      const chave = `${v.evento}|${v.data_evento}`;
      if (!mapaEventos.has(chave)) {
        mapaEventos.set(chave, {
          evento: v.evento,
          data_evento: v.data_evento,
        });
      }
    });

    const resultado = Array.from(mapaEventos.values())
      .map((ev) => {
        try {
          const chaveRegra = getEquipaCasaCanonica(ev.evento);

          const resumo = getResumoMatchingInteligente(
            ev.evento,
            ev.data_evento,
            chaveRegra,
            registosCompras,
            registosVendas
          );

          return {
            ...ev,
            porComprarTxt: resumo?.porComprarTxt || "",
            porVenderTxt: resumo?.porVenderTxt || "",
          };
        } catch (e) {
          console.error("Erro no resumo do evento:", ev, e);
          return {
            ...ev,
            porComprarTxt: "",
            porVenderTxt: "",
          };
        }
      })
      .filter((ev) => ev.porComprarTxt || ev.porVenderTxt)
      .sort((a, b) => {
        const dataA = parseDataSegura(a.data_evento);
        const dataB = parseDataSegura(b.data_evento);

        if (!dataA && !dataB) return 0;
        if (!dataA) return 1;
        if (!dataB) return -1;

        return dataA - dataB;
      });

    setResumoFaltas(resultado);
  }, [registosCompras, registosVendas, dataSelecionada]);

  const getEstadoBadgeClass = (estado) => {
    if (estado === "Pago") {
      return "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30";
    }
    if (estado === "Disputa") {
      return "bg-red-500/20 text-red-200 ring-1 ring-red-400/30";
    }
    return "bg-white/10 text-white/80 ring-1 ring-white/10";
  };

  return (
    <div className="min-h-screen bg-[#081120] text-white">
      <BarraClubes />

      <div className="mx-auto max-w-[1180px] px-4 py-5">
        <h1 className="mb-5 text-[28px] font-extrabold tracking-tight text-white">
          Dashboard
        </h1>

        <TooltipProvider>
          <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-5">
            {/* CALENDÁRIO */}
            <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,rgba(17,25,40,0.96),rgba(10,17,30,0.96))] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />

              <Calendar
                onChange={setDataSelecionada}
                value={dataSelecionada}
                className="dashboard-calendar-premium"
                tileClassName={({ date, view }) => {
                  if (view === "month") {
                    const eventosDoDia = eventosCalendario.filter((evento) => {
                      const [dia, mes, ano] = String(evento.data_evento || "").split("/");
                      return (
                        parseInt(dia) === date.getDate() &&
                        parseInt(mes) === date.getMonth() + 1 &&
                        parseInt(ano) === date.getFullYear()
                      );
                    });

                    if (eventosDoDia.length > 0) {
                      const todosPagos = eventosDoDia.every((e) => e.estado === "Pago");
                      const algumEmDisputa = eventosDoDia.some((e) => e.estado === "Disputa");

                      if (algumEmDisputa && !todosPagos) {
                        return "!bg-red-500/90 !text-white font-semibold !rounded-full shadow-[0_0_18px_rgba(239,68,68,0.50)]";
                      }

                      if (todosPagos) {
                        return "!bg-emerald-500/90 !text-white font-semibold !rounded-full shadow-[0_0_18px_rgba(16,185,129,0.50)]";
                      }

                      return "!bg-blue-500/85 !text-white font-semibold !rounded-full shadow-[0_0_18px_rgba(59,130,246,0.45)]";
                    }
                  }
                  return null;
                }}
                tileContent={({ date, view }) => {
                  if (view === "month") {
                    const eventosDoDia = eventosCalendario.filter((evento) => {
                      const [dia, mes, ano] = String(evento.data_evento || "").split("/");
                      return (
                        parseInt(dia) === date.getDate() &&
                        parseInt(mes) === date.getMonth() + 1 &&
                        parseInt(ano) === date.getFullYear()
                      );
                    });

                    if (eventosDoDia.length > 0) {
                      return (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="w-full h-full cursor-pointer bg-transparent border-none p-0 m-0" />
                          </PopoverTrigger>
                          <PopoverContent className="max-w-xs border-white/10 bg-[#0f172a] text-white shadow-2xl">
                            <div className="flex flex-col gap-2">
                              {eventosDoDia.map((evento, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                >
                                  {evento.nome_evento}
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }
                  }
                  return null;
                }}
              />
            </div>

            {/* FALTA COMPRAR / VENDER */}
            <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.07),transparent_35%),linear-gradient(180deg,rgba(14,22,38,0.96),rgba(9,15,27,0.96))] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              <h2 className="mb-4 text-[24px] font-bold tracking-tight text-white">
                Falta Comprar / Vender
              </h2>

              {resumoFaltas.length === 0 ? (
                <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  ✅ Tudo equilibrado neste mês
                </p>
              ) : (
                <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1 custom-dark-scroll">
                  {resumoFaltas.map((ev, i) => (
                    <div
                      key={i}
                      onClick={() => irParaEventoExpandido(ev.evento)}
                      className="group cursor-pointer rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:border-white/20 hover:bg-white/[0.09] hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                    >
                      <div className="text-[15px] font-bold text-white group-hover:text-white">
                        {ev.evento}
                      </div>

                      <div className="mb-2 mt-1 text-xs text-white/55">
                        {formatarDataSegura(ev.data_evento)}
                      </div>

                      {ev.porComprarTxt ? (
                        <div className="text-[15px] font-semibold text-red-400">
                          Por comprar: {ev.porComprarTxt}
                        </div>
                      ) : null}

                      {ev.porVenderTxt ? (
                        <div className="mt-1 text-[15px] font-semibold text-emerald-400">
                          Por vender: {ev.porVenderTxt}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TooltipProvider>

        {/* RESUMO */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-[18px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(20,83,45,0.95),rgba(16,185,129,0.20))] p-5 shadow-[0_12px_35px_rgba(16,185,129,0.18)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_38%)]" />
            <h2 className="text-[15px] font-semibold text-white/85">Ganhos</h2>
            <p className="mt-2 text-[20px] font-extrabold tracking-tight text-white">
              € {resumo.ganhos ? Math.round(resumo.ganhos) : "0"}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[18px] border border-red-400/20 bg-[linear-gradient(135deg,rgba(127,29,29,0.95),rgba(239,68,68,0.18))] p-5 shadow-[0_12px_35px_rgba(239,68,68,0.18)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_38%)]" />
            <h2 className="text-[15px] font-semibold text-white/85">Gastos</h2>
            <p className="mt-2 text-[20px] font-extrabold tracking-tight text-white">
              € {resumo.gastos ? Math.round(resumo.gastos) : "0"}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[18px] border border-blue-400/20 bg-[linear-gradient(135deg,rgba(30,58,138,0.95),rgba(59,130,246,0.18))] p-5 shadow-[0_12px_35px_rgba(59,130,246,0.18)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_38%)]" />
            <h2 className="text-[15px] font-semibold text-white/85">Lucro Líquido</h2>
            <p className="mt-2 text-[20px] font-extrabold tracking-tight text-white">
              € {resumo.lucro ? Math.round(resumo.lucro) : "0"}
            </p>
          </div>
        </div>

        {/* ENTREGAS PENDENTES */}
        <div className="relative mt-5 overflow-hidden rounded-[20px] border border-amber-400/20 bg-[linear-gradient(135deg,rgba(120,53,15,0.92),rgba(146,64,14,0.82),rgba(10,17,30,0.94))] p-5 shadow-[0_15px_40px_rgba(180,83,9,0.18)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(255,255,255,0.08),transparent_34%)]" />

          <p className="mb-3 text-[18px] font-bold text-amber-100">
            ⚠️ Entregas pendentes nos próximos 15 dias
          </p>

          {entregasPendentesDetalhadas.length === 0 ? (
            <p className="text-amber-50/95">
              ✅ Sem entregas pendentes neste período.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {entregasPendentesDetalhadas.map((e, idx) => (
                <div
                  key={idx}
                  onClick={() => irParaEventoExpandido(e.evento)}
                  className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white/95 transition hover:bg-white/[0.08]"
                >
                  {e.bilhetes} {e.bilhetes === 1 ? "Entrega pendente" : "Entregas pendentes"} –{" "}
                  {e.evento} ({formatarDataSegura(e.data_evento)})
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ÚLTIMOS EVENTOS */}
        <div className="mt-6">
          <h2 className="mb-3 text-[22px] font-bold tracking-tight text-white">
            Últimos eventos / vendas
          </h2>

          <div className="space-y-3">
            {ultimosEventos.map((evento) => (
              <div
                key={evento.id}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:border-white/20 hover:bg-white/[0.08]"
                onClick={() => navigate(`/listagem-vendas?id=${evento.id}`)}
              >
                <div>
                  <p className="font-semibold text-white">{evento.nome_evento}</p>
                  <p className="mt-1 text-sm text-white/60">{evento.data_evento}</p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getEstadoBadgeClass(
                    evento.estado
                  )}`}
                >
                  {evento.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
