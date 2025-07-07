import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import BarraClubes from "./BarraClubes";


export default function DashboardPrincipal() {
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


  return (
  <div>
    <BarraClubes />
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Dashboard</h1>

      <TooltipProvider>
        <div className="bg-white dark:bg-gray-900 p-4 rounded shadow transition-colors duration-300">
          <Calendar
            onChange={setDataSelecionada}
            value={dataSelecionada}
            className="mb-4 rounded shadow"
            tileClassName={({ date, view }) => {
              if (view === "month") {
                const existeEvento = eventosCalendario.some(evento => {
                  const [dia, mes, ano] = evento.data_evento.split("/");
                  return (
                    parseInt(dia) === date.getDate() &&
                    parseInt(mes) === date.getMonth() + 1 &&
                    parseInt(ano) === date.getFullYear()
                  );
                });
                return existeEvento
                  ? "bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100 font-semibold rounded-full hover:bg-blue-300 dark:hover:bg-blue-600 transition-colors duration-200"
                  : null;
              }
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
                          {eventosDoDia.map((evento, idx) => {
                            const partes = evento.nome_evento.split(/\s+vs\s+/i).map(p => p.trim());
                            return (
                              <div key={`${evento.id}-${idx}`} className="flex items-center gap-2 flex-wrap">
                                {partes.map((nomeClube, idx2) => {
                                  const clube = clubes.find(c => {
                                    const nomeClubeLower = nomeClube.toLowerCase();
                                    const nomeDbLower = c.nome.toLowerCase();
                                    return nomeClubeLower.includes(nomeDbLower) || nomeDbLower.includes(nomeClubeLower);
                                  });
                                  return (
                                    <div key={`${evento.id}-${idx}-${idx2}`} className="flex items-center gap-1">
                                      {clube?.simbolo && (
                                        <img
                                          src={clube.simbolo}
                                          alt={clube.nome}
                                          className="w-5 h-5 rounded-full object-contain"
                                        />
                                      )}
                                      <span className="text-sm text-gray-900 dark:text-gray-100">{nomeClube}</span>
                                      {idx2 === 0 && partes.length > 1 && (
                                        <span className="mx-1 text-gray-900 dark:text-gray-100">vs</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
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
      </TooltipProvider>

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
        {entregasPendentesDetalhadas.length === 0 ? (
          <p className="font-medium text-gray-900 dark:text-gray-100">✅ Sem entregas pendentes nos próximos 15 dias.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {entregasPendentesDetalhadas.map((e, idx) => (
              <div
                key={idx}
                onClick={() => irParaEventoExpandido(e.evento)}
                className="cursor-pointer hover:underline text-gray-900 dark:text-gray-100"
              >
                {e.bilhetes} {e.bilhetes > 1 ? "Entregas pendentes" : "Entrega pendente"} – {e.evento} ({new Date(e.data_evento).toLocaleDateString("pt-PT")})
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
  
