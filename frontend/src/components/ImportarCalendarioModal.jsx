import { useMemo, useState } from "react";
import { FaCalendarAlt, FaTimes, FaUpload } from "react-icons/fa";
import { toast } from "react-toastify";

const API_BASE = "https://controlo-bilhetes.onrender.com";

const limpar = (s = "") =>
  String(s)
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizarData = (valor = "") => {
  const s = String(valor || "").trim();

  // Aceita YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // Aceita DD-MM-YYYY ou DD/MM/YYYY
  const pt = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (pt) {
    const [, dd, mm, yyyy] = pt;
    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }

  return "";
};

const removerDuplicados = (eventos = []) => {
  const vistos = new Set();

  return eventos.filter((item) => {
    const data_evento = normalizarData(item.data_evento);
    const evento = limpar(item.evento);

    if (!data_evento || !evento) return false;

    const chave = `${data_evento}|${evento}`.toLowerCase();

    if (vistos.has(chave)) return false;

    vistos.add(chave);
    return true;
  });
};

const parseCalendarioImportado = (texto) => {
  const raw = String(texto || "").trim();

  if (!raw) {
    throw new Error("Não colaste nenhum calendário.");
  }

  // Formato JSON:
  // [
  //   {"data_evento":"2025-08-10","evento":"SL Benfica vs Rio Ave"}
  // ]
  if (raw.startsWith("[")) {
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("O JSON não está válido.");
    }

    if (!Array.isArray(parsed)) {
      throw new Error("O JSON tem de ser uma lista de eventos.");
    }

    const eventos = parsed.map((item) => ({
      data_evento: normalizarData(item.data_evento),
      evento: limpar(item.evento),
    }));

    return removerDuplicados(eventos);
  }

  // Formato CSV:
  // data_evento;evento
  // 2025-08-10;SL Benfica vs Rio Ave
  // 10-08-2025;SL Benfica vs Rio Ave
  const linhas = raw
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  const eventos = [];

  for (const linha of linhas) {
    if (/^data_evento\s*;/i.test(linha)) continue;
    if (/^data\s*;/i.test(linha)) continue;

    const partes = linha.split(";");

    if (partes.length < 2) continue;

    const data_evento = normalizarData(partes[0]);
    const evento = limpar(partes.slice(1).join(";"));

    if (data_evento && evento) {
      eventos.push({
        data_evento,
        evento,
      });
    }
  }

  return removerDuplicados(eventos);
};

export default function ImportarCalendarioModal({
  aberto,
  onFechar,
  onImportado,
}) {
  const [texto, setTexto] = useState("");
  const [aImportar, setAImportar] = useState(false);
  const [resultado, setResultado] = useState(null);

  const eventosPreview = useMemo(() => {
    try {
      return parseCalendarioImportado(texto);
    } catch {
      return [];
    }
  }, [texto]);

  if (!aberto) return null;

  const fecharModal = () => {
    if (aImportar) return;
    setTexto("");
    setResultado(null);
    onFechar?.();
  };

  const importarCalendario = async () => {
    let eventosParaImportar = [];

    try {
      eventosParaImportar = parseCalendarioImportado(texto);
    } catch (error) {
      toast.error(error.message || "Erro ao ler calendário.");
      return;
    }

    if (!eventosParaImportar.length) {
      toast.error("Não foram encontrados eventos válidos.");
      return;
    }

    setAImportar(true);
    setResultado(null);

    try {
      const res = await fetch(`${API_BASE}/importar_calendario_eventos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventosParaImportar),
      });

      if (!res.ok) {
        const detalhe = await res.text().catch(() => "");
        console.error("Erro ao importar calendário:", res.status, detalhe);
        throw new Error("Erro ao importar calendário.");
      }

      const data = await res.json();

      setResultado(data);

      toast.success("Calendário importado com sucesso.");

      if (onImportado) {
        await onImportado(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao importar calendário.");
    } finally {
      setAImportar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0f172a] text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-300">
              <FaCalendarAlt />
            </div>

            <div>
              <h2 className="text-xl font-bold md:text-2xl">
                Importar Calendário
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                Cola aqui a lista preparada em CSV ou JSON. O sistema cria primeiro
                o nome no Gerir Eventos, se ainda não existir, e depois cria o
                evento com a data.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fecharModal}
            disabled={aImportar}
            className="rounded-xl bg-white/10 p-3 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            title="Fechar"
          >
            <FaTimes />
          </button>
        </div>

        <div className="grid gap-5 p-5 md:p-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">
              Lista de eventos
            </label>

            <textarea
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setResultado(null);
              }}
              rows={16}
              className="w-full resize-none rounded-2xl border border-white/10 bg-[#020617] p-4 font-mono text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/20"
              placeholder={`data_evento;evento
2025-08-10;Casa Pia vs Sporting
2025-08-10;SL Benfica vs Rio Ave
2025-08-10;FC Porto vs Vitória SC
2026-01-18;Sporting CP vs Casa Pia
2026-01-18;Rio Ave vs SL Benfica
2026-01-18;Vitória SC vs FC Porto`}
            />

            <p className="mt-2 text-xs text-slate-400">
              Formatos aceites: <b>YYYY-MM-DD;Evento</b>, <b>DD-MM-YYYY;Evento</b> ou JSON.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-100">
                  Pré-visualização
                </p>

                <span className="rounded-full bg-purple-600/20 px-3 py-1 text-sm font-semibold text-purple-200">
                  {eventosPreview.length} evento{eventosPreview.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-white/10">
                {eventosPreview.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400">
                    Ainda não foram encontrados eventos válidos.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-[#111827] text-slate-300">
                      <tr>
                        <th className="px-3 py-2">Data</th>
                        <th className="px-3 py-2">Evento</th>
                      </tr>
                    </thead>

                    <tbody>
                      {eventosPreview.slice(0, 80).map((item, index) => (
                        <tr
                          key={`${item.data_evento}-${item.evento}-${index}`}
                          className="border-t border-white/10"
                        >
                          <td className="whitespace-nowrap px-3 py-2 text-slate-300">
                            {item.data_evento}
                          </td>
                          <td className="px-3 py-2 text-white">
                            {item.evento}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {eventosPreview.length > 80 && (
                <p className="mt-2 text-xs text-slate-400">
                  A mostrar apenas os primeiros 80 eventos na pré-visualização.
                </p>
              )}
            </div>

            {resultado && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <p className="font-semibold text-emerald-200">
                  Resumo da importação
                </p>

                <div className="mt-3 space-y-2 text-sm text-slate-100">
                  <div className="flex justify-between gap-4">
                    <span>Nomes criados no Gerir Eventos</span>
                    <b>{resultado.nomes_criados_gerir_eventos || 0}</b>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Nomes já existentes no Gerir Eventos</span>
                    <b>{resultado.nomes_existentes_gerir_eventos || 0}</b>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Eventos criados com data</span>
                    <b>{resultado.eventos_criados_com_data || 0}</b>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Eventos já existentes com data</span>
                    <b>{resultado.eventos_ja_existentes_com_data || 0}</b>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
              <b>Regra usada:</b> primeiro valida/cria o nome do evento no Gerir Eventos. Só depois cria o evento na tabela principal com a respetiva data, evitando duplicados por <b>data_evento + evento</b>.
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-white/10 p-5 md:flex-row md:p-6">
          <button
            type="button"
            onClick={fecharModal}
            disabled={aImportar}
            className="rounded-2xl bg-slate-700 px-5 py-3 font-semibold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={importarCalendario}
            disabled={aImportar || eventosPreview.length === 0}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold text-white transition ${
              aImportar || eventosPreview.length === 0
                ? "cursor-not-allowed bg-slate-600 opacity-60"
                : "bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-[0_12px_30px_rgba(168,85,247,0.24)] hover:scale-[1.01] hover:from-purple-500 hover:to-fuchsia-400"
            }`}
          >
            <FaUpload />
            {aImportar ? "A importar..." : "Importar calendário"}
          </button>
        </div>
      </div>
    </div>
  );
}
