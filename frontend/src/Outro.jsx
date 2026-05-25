import React, { useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaCheck,
  FaThumbtack,
  FaRegStickyNote,
} from "react-icons/fa";

export default function Outro() {
  const [notas, setNotas] = useState([]);

useEffect(() => {
  carregarNotas();
}, []);

const carregarNotas = async () => {
  try {
    const res = await fetch("/notas");
    const data = await res.json();
    setNotas(data);
  } catch (err) {
    console.error("Erro ao carregar notas:", err);
  }
};
  const [pesquisa, setPesquisa] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [notaEditando, setNotaEditando] = useState(null);

  const notaVazia = {
    titulo: "",
    descricao: "",
    categoria: "Geral",
    prioridade: "Média",
    estado: "Pendente",
    data_limite: "",
    fixada: false,
  };

  const [form, setForm] = useState(notaVazia);

  const abrirNovaNota = () => {
    setNotaEditando(null);
    setForm(notaVazia);
    setModalAberto(true);
  };

  const abrirEditar = (nota) => {
    setNotaEditando(nota.id);
    setForm(nota);
    setModalAberto(true);
  };

  const guardarNota = async () => {
  if (!form.titulo.trim()) return;

  try {
    const url = notaEditando ? `/notas/${notaEditando}` : "/notas";
    const method = notaEditando ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      throw new Error("Erro ao guardar nota");
    }

    await carregarNotas();
    setModalAberto(false);
  } catch (err) {
    console.error("Erro ao guardar nota:", err);
  }
};

  const eliminarNota = async (id) => {
  if (!window.confirm("Eliminar esta nota?")) return;

  try {
    const res = await fetch(`/notas/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Erro ao eliminar nota");
    }

    await carregarNotas();
  } catch (err) {
    console.error("Erro ao eliminar nota:", err);
  }
};

  const concluirNota = async (id) => {
  const nota = notas.find((n) => n.id === id);
  if (!nota) return;

  try {
    await fetch(`/notas/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...nota,
        estado: "Concluído",
      }),
    });

    await carregarNotas();
  } catch (err) {
    console.error("Erro ao concluir nota:", err);
  }
};

  const alternarFixada = async (id) => {
  const nota = notas.find((n) => n.id === id);
  if (!nota) return;

  try {
    await fetch(`/notas/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...nota,
        fixada: !nota.fixada,
      }),
    });

    await carregarNotas();
  } catch (err) {
    console.error("Erro ao fixar nota:", err);
  }
};

  const notasFiltradas = useMemo(() => {
    return notas
      .filter((n) => {
        const texto = `${n.titulo} ${n.descricao} ${n.categoria}`.toLowerCase();
        const passaPesquisa = texto.includes(pesquisa.toLowerCase());
        const passaEstado =
          filtroEstado === "Todos" || n.estado === filtroEstado;

        return passaPesquisa && passaEstado;
      })
      .sort((a, b) => {
        if (a.fixada !== b.fixada) return b.fixada - a.fixada;
        return new Date(b.criado_em || 0) - new Date(a.criado_em || 0);
      });
  }, [notas, pesquisa, filtroEstado]);

  const getPrioridadeClass = (prioridade) => {
    if (prioridade === "Alta") return "bg-red-500/15 text-red-300 border-red-400/30";
    if (prioridade === "Média") return "bg-yellow-500/15 text-yellow-300 border-yellow-400/30";
    return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
  };

  const getEstadoClass = (estado) => {
    if (estado === "Concluído") return "bg-emerald-500/15 text-emerald-300";
    if (estado === "Em curso") return "bg-blue-500/15 text-blue-300";
    return "bg-slate-500/20 text-slate-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FaRegStickyNote className="text-blue-400" />
              Notas e Tarefas
            </h1>
            <p className="text-slate-400 mt-1">
              Organiza lembretes, tarefas pendentes e assuntos importantes.
            </p>
          </div>

          <button
            onClick={abrirNovaNota}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-blue-900/30 transition"
          >
            <FaPlus />
            Nova Nota
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Pesquisar por título, descrição ou categoria..."
                className="w-full bg-slate-950/70 border border-white/10 rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-blue-400"
              />
            </div>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-slate-950/70 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-blue-400"
            >
              <option>Todos</option>
              <option>Pendente</option>
              <option>Em curso</option>
              <option>Concluído</option>
            </select>
          </div>
        </div>

        {notasFiltradas.length === 0 ? (
          <div className="border border-dashed border-white/15 rounded-3xl p-10 text-center bg-white/5">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-xl font-semibold">Ainda não tens notas</h2>
            <p className="text-slate-400 mt-2">
              Cria a primeira nota para começares a organizar tarefas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {notasFiltradas.map((nota) => (
              <div
                key={nota.id}
                className="bg-white/7 border border-white/10 rounded-3xl p-5 shadow-xl hover:border-blue-400/40 transition"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full border ${getPrioridadeClass(nota.prioridade)}`}>
                      {nota.prioridade}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full ${getEstadoClass(nota.estado)}`}>
                      {nota.estado}
                    </span>
                  </div>

                  <button
                    onClick={() => alternarFixada(nota.id)}
                    className={`p-2 rounded-xl ${
                      nota.fixada
                        ? "text-yellow-300 bg-yellow-500/10"
                        : "text-slate-500 hover:text-yellow-300"
                    }`}
                  >
                    <FaThumbtack />
                  </button>
                </div>

                <h3 className="text-xl font-bold mt-4">{nota.titulo}</h3>

                <p className="text-slate-300 mt-3 whitespace-pre-wrap min-h-[70px]">
                  {nota.descricao || "Sem descrição."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-400">
                  <span className="bg-slate-950/60 px-3 py-1 rounded-full">
                    {nota.categoria}
                  </span>

                  {nota.data_limite && (
                    <span className="bg-slate-950/60 px-3 py-1 rounded-full">
                      Até {nota.data_limite}
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-white/10">
                  {nota.estado !== "Concluído" && (
                    <button
                      onClick={() => concluirNota(nota.id)}
                      className="p-3 rounded-xl bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                      title="Concluir"
                    >
                      <FaCheck />
                    </button>
                  )}

                  <button
                    onClick={() => abrirEditar(nota)}
                    className="p-3 rounded-xl bg-blue-500/15 text-blue-300 hover:bg-blue-500/25"
                    title="Editar"
                  >
                    <FaEdit />
                  </button>

                  <button
                    onClick={() => eliminarNota(nota.id)}
                    className="p-3 rounded-xl bg-red-500/15 text-red-300 hover:bg-red-500/25"
                    title="Eliminar"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl p-6 space-y-4">
            <h2 className="text-2xl font-bold">
              {notaEditando ? "Editar Nota" : "Nova Nota"}
            </h2>

            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Título"
              className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-blue-400"
            />

            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Descrição / detalhes da tarefa..."
              rows={5}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-blue-400 resize-none"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3"
              >
                <option>Geral</option>
                <option>Vendas</option>
                <option>Compras</option>
                <option>Viagogo</option>
                <option>StubHub</option>
                <option>Urgente</option>
              </select>

              <select
                value={form.prioridade}
                onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
                className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3"
              >
                <option>Baixa</option>
                <option>Média</option>
                <option>Alta</option>
              </select>

              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3"
              >
                <option>Pendente</option>
                <option>Em curso</option>
                <option>Concluído</option>
              </select>
            </div>

            <input
              type="date"
              value={form.data_limite}
              onChange={(e) => setForm({ ...form, data_limite: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3"
            />

            <label className="flex items-center gap-3 text-slate-300">
              <input
                type="checkbox"
                checked={form.fixada}
                onChange={(e) => setForm({ ...form, fixada: e.target.checked })}
              />
              Fixar nota no topo
            </label>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setModalAberto(false)}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700"
              >
                Cancelar
              </button>

              <button
                onClick={guardarNota}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 font-semibold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
