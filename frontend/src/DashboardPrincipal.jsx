import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';

export default function DashboardPrincipal() {
  const [resumo, setResumo] = useState({ ganhos: 0, gastos: 0, lucro: 0, entregasPendentes: 0 });
  const [ultimosEventos, setUltimosEventos] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const navigate = useNavigate();
  const [clubes, setClubes] = useState([]);
  const obterSimboloClube = (nomeEvento) => {
  const clube = clubes.find(c => nomeEvento.toLowerCase().includes(c.nome.toLowerCase()));
  return clube && clube.simbolo ? clube.simbolo : null;
};


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
      <h1 className="text-xl font-semibold mb-4">Dashboard de Bilhetes</h1>

      <Calendar
  onChange={setDataSelecionada}
  value={dataSelecionada}
  className="mb-4 rounded shadow"
  tileClassName={({ date, view }) => {
    if (view === "month") {
      const existeEvento = ultimosEventos.some(evento => {
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
  tileContent={({ date, view }) => {
  if (view === "month") {
    const eventosDoDia = ultimosEventos.filter(evento => {
      const [dia, mes, ano] = evento.data_evento.split("/");
      return (
        parseInt(dia) === date.getDate() &&
        parseInt(mes) === date.getMonth() + 1 &&
        parseInt(ano) === date.getFullYear()
      );
    });

    if (eventosDoDia.length > 0) {
      const simbolo = obterSimboloClube(eventosDoDia[0].nome_evento);
      return (
        <div
          title={eventosDoDia.map(e => e.nome_evento).join(", ")}
          className="flex justify-center items-center"
        >
          {simbolo ? (
            <img src={simbolo} alt="Simbolo" className="w-4 h-4 rounded-full object-contain" />
          ) : (
            <span className="text-xs text-blue-600 dark:text-blue-300">🎟️</span>
          )}
        </div>
      );
    }
  }
  return null;
}}
/>



      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded shadow">
          <h2 className="text-lg font-medium">Ganhos</h2>
          <p className="text-2xl font-bold">€ {resumo.ganhos ? resumo.ganhos.toFixed(2) : "0.00"}</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded shadow">
          <h2 className="text-lg font-medium">Gastos</h2>
          <p className="text-2xl font-bold">€ {resumo.gastos ? resumo.gastos.toFixed(2) : "0.00"}</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded shadow">
          <h2 className="text-lg font-medium">Lucro Líquido</h2>
          <p className="text-2xl font-bold">€ {resumo.lucro ? resumo.lucro.toFixed(2) : "0.00"}</p>
        </div>
      </div>

      <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded shadow mb-4">
        <p className="font-medium">⚠️ {resumo.entregasPendentes} entregas pendentes</p>
      </div>

      <h2 className="text-lg font-semibold mb-2">Últimos eventos / vendas</h2>
      <div className="space-y-2">
        {ultimosEventos.map((evento) => (
          <div
            key={evento.id}
            className="bg-white dark:bg-gray-800 p-3 rounded shadow flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => navigate(`/listagem-vendas?id=${evento.id}`)}
          >
            <div>
              <p className="font-medium">{evento.nome_evento}</p>
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
