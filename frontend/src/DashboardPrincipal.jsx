
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
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
  window.matchMedia('(prefers-color-scheme: dark)').matches
);

useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (e) => setIsDarkMode(e.matches);
  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
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
          fetch("https://controlo-bilhetes.onrender.com/listagem_vendas")
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

  // formato dd/mm/yyyy
  if (texto.includes("/")) {
    const partes = texto.split("/");
    if (partes.length !== 3) return null;

    const [d, m, y] = partes.map(Number);
    if (!d || !m || !y) return null;

    const data = new Date(y, m - 1, d);
    return isNaN(data.getTime()) ? null : data;
  }

  // formato yyyy-mm-dd ou ISO
  const data = new Date(texto);
  return isNaN(data.getTime()) ? null : data;
};

const formatarDataSegura = (valor) => {
  const data = parseDataSegura(valor);
  return data ? data.toLocaleDateString("pt-PT") : "Data inválida";
};


useEffect(() => {
  const mapa = {};

  const mesAtual = dataSelecionada.getMonth();
  const anoAtual = dataSelecionada.getFullYear();

  const dentroDoMes = (dataStr) => {
    const d = parseDataSegura(dataStr);
    if (!d) return false;

    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  };

  registosCompras.forEach((c) => {
    if (!dentroDoMes(c.data_evento)) return;

    const chave = `${c.evento}|${c.data_evento}`;

    if (!mapa[chave]) {
      mapa[chave] = {
        evento: c.evento,
        data_evento: c.data_evento,
        comprados: 0,
        vendidos: 0,
      };
    }

    mapa[chave].comprados += Number(c.bilhetes || c.quantidade || 0);
  });

  registosVendas.forEach((v) => {
    if (!dentroDoMes(v.data_evento)) return;

    const chave = `${v.evento}|${v.data_evento}`;

    if (!mapa[chave]) {
      mapa[chave] = {
        evento: v.evento,
        data_evento: v.data_evento,
        comprados: 0,
        vendidos: 0,
      };
    }

    mapa[chave].vendidos += Number(v.bilhetes || v.quantidade || 0);
  });

  const resultado = Object.values(mapa)
    .map((ev) => {
      const diff = ev.vendidos - ev.comprados;

      return {
        ...ev,
        faltaComprar: diff > 0 ? diff : 0,
        faltaVender: diff < 0 ? Math.abs(diff) : 0,
      };
    })
    .filter((ev) => ev.faltaComprar > 0 || ev.faltaVender > 0)
    .sort((a, b) => {
      const dataA = parseDataSegura(a.data_evento);
      const dataB = parseDataSegura(b.data_evento);

      if (!dataA && !dataB) return 0;
      if (!dataA) return 1;
      if (!dataB) return -1;

      return dataA - dataB;
    });

  console.log("RESULTADO FINAL:", resultado);
  setResumoFaltas(resultado);
}, [registosCompras, registosVendas, dataSelecionada]);  
  return (
  <div>
    <BarraClubes />
    <div className="p-4 w-full">
      <h1 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Dashboard</h1>

      <TooltipProvider>
<div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4">

  {/* CALENDÁRIO */}
  <div className="bg-white dark:bg-gray-900 p-4 rounded shadow transition-colors duration-300">
    <Calendar
      onChange={setDataSelecionada}
      value={dataSelecionada}
      className="mb-4 rounded shadow"
      tileClassName={({ date, view }) => {
        if (view === "month") {
          const eventosDoDia = eventosCalendario.filter(evento => {
            const [dia, mes, ano] = evento.data_evento.split("/");
            return (
              parseInt(dia) === date.getDate() &&
              parseInt(mes) === date.getMonth() + 1 &&
              parseInt(ano) === date.getFullYear()
            );
          });

          if (eventosDoDia.length > 0) {
            const todosPagos = eventosDoDia.every(e => e.estado === "Pago");
            const algumEmDisputa = eventosDoDia.some(e => e.estado === "Disputa");

            if (algumEmDisputa && !todosPagos) {
              return "!bg-red-300 !text-white dark:!bg-red-700 dark:!text-white font-semibold rounded-full";
            }

            if (todosPagos) {
              return "!bg-green-300 !text-white dark:!bg-green-700 dark:!text-white font-semibold rounded-full";
            }

            return "!bg-blue-200 !text-blue-900 dark:!bg-blue-700 dark:!text-blue-100 font-semibold rounded-full";
          }
        }
        return null;
      }}

      tileContent={({ date, view }) => {
        if (view === "month") {
          const eventosDoDia = eventosCalendario.filter(evento => {
            const [dia, mes, ano] = evento.data_evento.split("/");
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
                  <button className="w-full h-full cursor-pointer bg-transparent border-none p-0 m-0"></button>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs">
                  <div className="flex flex-col gap-1">
                    {eventosDoDia.map((evento, idx) => (
                      <div key={idx} className="text-sm text-gray-900 dark:text-gray-100">
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

  {/* 👉 RESUMO AO LADO */}
  <div className="bg-white dark:bg-gray-900 p-4 rounded shadow max-h-[420px] overflow-y-auto">
    <h2 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100">
      Falta Comprar / Vender
    </h2>

    {resumoFaltas.length === 0 ? (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        ✅ Tudo equilibrado neste mês
      </p>
    ) : (
      <div className="space-y-2">
        {resumoFaltas.map((ev, i) => (
          <div
            key={i}
            onClick={() => irParaEventoExpandido(ev.evento)}
            className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {ev.evento}
            </div>

           <div className="text-xs text-gray-500 dark:text-gray-400">
  {formatarDataSegura(ev.data_evento)}
</div>

            <div className="flex justify-between mt-2">
              <span className={ev.faltaComprar > 0 ? "text-red-500 font-medium" : "text-gray-400"}>
                Comprar: {ev.faltaComprar}
              </span>

              <span className={ev.faltaVender > 0 ? "text-yellow-600 font-medium" : "text-gray-400"}>
                Vender: {ev.faltaVender}
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
</TooltipProvider> {/* 👈 ESTA LINHA FALTAVA */}

      {/* ✅ BLOCO QUE ESTAVA FORA, AGORA INSERIDO CORRETAMENTE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 mt-4">
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Ganhos</h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">€ {resumo.ganhos ? Math.round(resumo.ganhos) : "0"}</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Gastos</h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">€ {resumo.gastos ? Math.round(resumo.gastos) : "0"}</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Lucro Líquido</h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">€ {resumo.lucro ? Math.round(resumo.lucro) : "0"}</p>
        </div>
      </div>

      <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded shadow mb-4">
        <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
          ⚠️ Entregas pendentes nos próximos 15 dias:
        </p>
      
        {entregasPendentesDetalhadas.length === 0 ? (
          <p className="text-gray-900 dark:text-gray-100">
            ✅ Sem entregas pendentes neste período.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {entregasPendentesDetalhadas.map((e, idx) => (
              <div
                key={idx}
                onClick={() => irParaEventoExpandido(e.evento)}
                className="cursor-pointer hover:underline text-gray-900 dark:text-gray-100"
              >
                {e.bilhetes} {e.bilhetes === 1 ? "Entrega pendente" : "Entregas pendentes"} – {e.evento} ({formatarDataSegura(e.data_evento)})
              </div>
            ))}
          </div>
        )}
      </div>



      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Últimos eventos / vendas</h2>
      <div className="space-y-2">
        {ultimosEventos.map((evento) => (
          <div
            key={evento.id}
            className="bg-white dark:bg-gray-800 p-3 rounded shadow flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => navigate(`/listagem-vendas?id=${evento.id}`)}
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{evento.nome_evento}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{evento.data_evento}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              evento.estado === "Pago"
                ? "bg-green-200 dark:bg-green-700"
                : evento.estado === "Disputa"
                  ? "bg-red-200 dark:bg-red-700"
                  : "bg-gray-200 dark:bg-gray-700"
            }`}>
              {evento.estado}
            </span>
          </div>
        ))}
      </div>
      {/* ✅ FIM DO BLOCO INSERIDO */}
    </div>
  </div>
);
}
  
