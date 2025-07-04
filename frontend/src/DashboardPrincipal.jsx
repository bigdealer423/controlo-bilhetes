import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

export default function DashboardPrincipal() {
  const [resumo, setResumo] = useState({ ganhos: 0, gastos: 0, lucro: 0, entregasPendentes: 0 });
  const [ultimosEventos, setUltimosEventos] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [clubes, setClubes] = useState([]);
  const navigate = useNavigate();
  const [eventosCalendario, setEventosCalendario] = useState([]);
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

  return (
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
                            const partes = evento.nome_evento.split(" vs ");
                            return (
                              <div key={idx} className="flex items-center gap-2 flex-wrap">
                                {partes.map((nomeClube, idx2) => {
                                  const clube = clubes.find(c => nomeClube.toLowerCase().includes(c.nome.toLowerCase()));
                                  return (
                                    <div key={idx2} className="flex items-center gap-1">
                                      {clube?.simbolo && (
                                        <img
                                          src={clube.simbolo}
                                          alt={nomeClube}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
        <p className="font-medium text-gray-900 dark:text-gray-100">⚠️ {resumo.entregasPendentes} entregas pendentes</p>
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
            <span className={`text-xs px-2 py-1 rounded ${evento.estado === "Pago" ? "bg-green-200 dark:bg-green-700" : evento.estado === "Disputa" ? "bg-red-200 dark:bg-red-700" : "bg-gray-200 dark:bg-gray-700"}`}>
              {evento.estado}
            </span>
          </div>
        ))}
      </div>
     </div>  
  );
}
