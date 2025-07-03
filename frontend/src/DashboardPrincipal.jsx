import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { Popover, PopoverContent } from "@/components/ui/popover";

export default function DashboardPrincipal() {
  const [resumo, setResumo] = useState({ ganhos: 0, gastos: 0, lucro: 0, entregasPendentes: 0 });
  const [ultimosEventos, setUltimosEventos] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [clubes, setClubes] = useState([]);
  const [eventosCalendario, setEventosCalendario] = useState([]);
  const [dataPopover, setDataPopover] = useState(null);
  const navigate = useNavigate();

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

  const handleDiaClicado = (date) => {
    const eventosDoDia = eventosCalendario.filter(evento => {
      const [dia, mes, ano] = evento.data_evento.split("/");
      return (
        parseInt(dia) === date.getDate() &&
        parseInt(mes) === date.getMonth() + 1 &&
        parseInt(ano) === date.getFullYear()
      );
    });
    setDataPopover({ date, eventos: eventosDoDia });
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Dashboard</h1>

      <div className="w-full md:w-[600px] mx-auto">
        <Calendar
          onChange={setDataSelecionada}
          value={dataSelecionada}
          onClickDay={handleDiaClicado}
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
              return existeEvento ? "bg-blue-200 dark:bg-blue-700 rounded-full" : null;
            }
          }}
        />
      </div>

      {dataPopover && (
        <Popover open={true} onOpenChange={() => setDataPopover(null)}>
          <PopoverContent className="max-w-xs">
            {dataPopover.eventos.length > 0 ? (
              dataPopover.eventos.map((evento, idx) => {
                const partes = evento.nome_evento.split(" vs ");
                return (
                  <div key={idx} className="flex items-center gap-2 flex-wrap">
                    {partes.map((nomeClube, idx2) => {
                      const clube = clubes.find(c => nomeClube.toLowerCase().includes(c.nome.toLowerCase()));
                      return (
                        <div key={idx2} className="flex items-center gap-1">
                          {clube?.simbolo && (
                            <img src={clube.simbolo} alt={nomeClube} className="w-5 h-5 rounded-full object-contain" />
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
              })
            ) : (
              <div className="text-gray-900 dark:text-gray-100">Sem eventos neste dia.</div>
            )}
          </PopoverContent>
        </Popover>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded shadow">
          <h2 className="text-lg font-medium">Ganhos</h2>
          <p className="text-2xl font-bold">€ {resumo.ganhos ? Math.round(resumo.ganhos) : "0"}</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded shadow">
          <h2 className="text-lg font-medium">Gastos</h2>
          <p className="text-2xl font-bold">€ {resumo.gastos ? Math.round(resumo.gastos) : "0"}</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded shadow">
          <h2 className="text-lg font-medium">Lucro Líquido</h2>
          <p className="text-2xl font-bold">€ {resumo.lucro ? Math.round(resumo.lucro) : "0"}</p>
        </div>
      </div>

      <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded shadow mb-4">
        <p className="font-medium">⚠️ {resumo.entregasPendentes} entregas pendentes</p>
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
