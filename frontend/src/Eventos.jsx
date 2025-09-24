









import { useState, useEffect, useMemo, useRef } from "react";
import { FaTrash, FaPrint } from "react-icons/fa"; // <- adicionar
import { toast } from "react-toastify";            // se ainda não estiver
import { useLocation } from "react-router-dom";
import { FaFileExcel, FaEdit } from "react-icons/fa";
import * as XLSX from "xlsx";
import saveAs from "file-saver";
import CirculoEstado from "./CirculoEstado";

// ——— Normalização leve (acentos, espaços, invisíveis) ———
const limpar = (s = "") =>
  String(s)
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();



// ——— Canonicaliza família/prefixo (PT ↔ EN) ———
const canonFamilia = (w = "") => {
  const x = String(w).toLowerCase().normalize("NFKC").trim();

  // pisos / níveis
  if (x === "lower" || x === "piso 0" || x === "piso zero" || x === "p0") return "Lower";
  if (x === "middle" || x === "piso 1" || x === "piso um" || x === "piso primeiro" || x === "p1") return "Middle";
  if (x === "upper" || x === "piso 3" || x === "piso tres" || x === "piso três" || x === "p3") return "Upper";

  // setores/seções
  if (x === "sector" || x === "setor" || x === "section" || x === "secao" || x === "seção" || x === "secção")
    return "Setor";

  // restantes
  if (x === "block" || x === "bloco") return "Block";
  if (x === "stand" || x === "bancada") return "Stand";
  if (x === "tribuna") return "Tribuna";
  if (x === "ring" || x === "anel") return "Ring";
  if (x === "tier" || x === "nivel" || x === "nível" || x === "level") return "Level";
  if (x === "nascente") return "Nascente";
  if (x === "poente")   return "Poente";
  if (x === "norte")    return "Norte";
  if (x === "sul")      return "Sul";

  return w; // mantém se não reconhecido
};


// ——— Extrai o “setor exato” (NÃO agrupa números) ———
// Regras: pega só a parte principal antes de vírgula/parênteses/“Fila/Row/Gate/Porta/Entrada”.
// Mantém pares tipo "Lower 32", "Block 112A", "Setor L", "Setor Nascente".
// ——— Normaliza texto PT/EN e extrai "família + resto" sem juntar números/letras ———
// ——— Normaliza PT/EN e extrai "família + resto" sem juntar números/letras ———
const setorExato = (txt = "") => {
  let s = limpar(txt);

  // remove sufixos tipo "(3 Bilhetes)" e corta em separadores comuns
  s = s.replace(/\([^)]*\)\s*$/g, "").trim();
  s = s.split(",")[0].split(" - ")[0].split(";")[0].trim();

  // remove partes não pertencentes ao identificador
  s = s.replace(/\b(Fila|Row|Gate|Porta|Entrada|Door|Seat|Lugar)\b.*$/i, "").trim();

  // ——— PRÉ-NORMALIZAÇÕES (sobre a string toda) ———
  // pisos → palavras canónicas
  s = s.replace(/\b(piso\s*zero|piso\s*0|p0)\b/gi, "Lower");
  s = s.replace(/\b(middle|piso\s*1|piso\s*um|piso\s*primeiro|p1)\b/gi, "Middle");
  s = s.replace(/\b(upper|piso\s*3|piso\s*tr[eê]s|p3)\b/gi, "Upper");

  // section/sector/etc → Setor
  s = s.replace(/\b(section|sect(?:ion)?|sec(?:ção|cao|cç?ao)?|sector|setor)\b/gi, "Setor");

  // colapsa "Setor Lower/Middle/Upper ..." → "Lower/Middle/Upper ..."
  s = s.replace(/\bSetor\s+(Lower|Middle|Upper)\b/gi, "$1");

  // família + resto
  const m = s.match(/^([A-Za-zÀ-ÿ]+)(?:\s+(.*))?$/);
  if (m) {
    const fam = canonFamilia(m[1]);            // usa o teu canonFamilia atualizado
    let resto = (m[2] || "").trim();

    // normaliza números com zeros à esquerda: "01" → "1"
    resto = resto.replace(/\b0+(\d+)\b/g, "$1");

    s = resto ? `${fam} ${resto}` : fam;
  }

  if (/^devolu/i.test(s)) return "Devolução";
  return s || "Outros";
};


// ——— Chave canónica para COMPRAS (mesmo parser das vendas) ———
const compraChave = (c = {}) => {
  // junta campos úteis numa frase e normaliza com o mesmo parser
  const partes = [c.local_compras, c.bancada, c.setor, c.fila].filter(Boolean).join(" ");
  let key = setorExato(partes);
  key = key.replace(/^Setor\s+/i, "").trim();  // se quiseres sem o prefixo "Setor" no comparador
  return key || "Outro";
};


// ——— Nº de bilhetes (fallback 1) ———
const qtdBilhetes = (txt = "") => {
  const s = String(txt).trim();
  // caso "2"
  if (/^\d+$/.test(s)) return Number(s);
  // caso "... (4 bilhetes)" / "(1 Bilhete)"
  const m = s.match(/\((\d+)\s*Bilhetes?\)/i);
  return m ? Number(m[1]) : 0;   // fallback 0 (não inventa 1)
};



const formatarNumero = (valor) => {
  if (valor == null) return "";
  return Number(valor).toLocaleString("pt-PT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true
  });
};


function parseDataPt(ddmmyyyy) {
  if (!ddmmyyyy) return null;
  const s = String(ddmmyyyy).trim().replaceAll("/", "-"); // 👈 aceita "/"
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const [dd, mm, yyyy] = s.split("-").map(Number);
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}


function formatarDataPt(dstr) {
  const d = parseDataPt(dstr);
  return d ? d.toLocaleDateString("pt-PT") : dstr || "";
}

function toInputDate(dstr) {
  const d = parseDataPt(dstr);
  if (!d) return ""; // vazio para não quebrar o input
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Eventos() {
  const [registos, setRegistos] = useState([]);
  const [mostrarNotaEventoId, setMostrarNotaEventoId] = useState(null);
  const [notaEventoTmp, setNotaEventoTmp] = useState("");
  const [eventosDropdown, setEventosDropdown] = useState([]);
  const [modoEdicao, setModoEdicao] = useState(null);
  const [eventoEditado, setEventoEditado] = useState({});
  const [linhaExpandida, setLinhaExpandida] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef();
  const limit = 15;
  const location = useLocation();
  const [mostrarResumoDetalhado, setMostrarResumoDetalhado] = useState(false);
  const [lucrosMensais, setLucrosMensais] = useState([]);
  const linhaRefs = useRef({});
  const [vendasNaoAssociadasSet, setVendasNaoAssociadasSet] = useState(new Set());
  const [comprasNaoAssociadasSet, setComprasNaoAssociadasSet] = useState(new Set());
  const isCompact = window.matchMedia("(max-width: 1024px)").matches;
  const [ocultarPagos, setOcultarPagos] = useState(() => {
  const v = localStorage.getItem("eventos_ocultar_pagos");
    return v ? JSON.parse(v) : true; // ocultar por defeito
  });
  
  useEffect(() => {
    localStorage.setItem("eventos_ocultar_pagos", JSON.stringify(ocultarPagos));
  }, [ocultarPagos]);


  



useEffect(() => {
  if (!vendas.length || !compras.length || !registos.length) return;

  const eventosChave = new Set(registos.map(e => `${e.evento}|${e.data_evento}`));

  const vendasSemEvento = new Set(
    vendas
      .filter(v => !eventosChave.has(`${v.evento}|${v.data_evento}`))
      .map(v => v.id)
  );

  const comprasSemEvento = new Set(
    compras
      .filter(c => !eventosChave.has(`${c.evento}|${c.data_evento}`))
      .map(c => c.id)
  );

  setVendasNaoAssociadasSet(vendasSemEvento);
  setComprasNaoAssociadasSet(comprasSemEvento);
}, [vendas, compras, registos]);


useEffect(() => {
    const params = new URLSearchParams(location.search);
    const eventoAExpandir = params.get("expandir");

    if (eventoAExpandir && registos.length > 0) {
        const registoEncontrado = registos.find(r => r.evento === eventoAExpandir);
        if (registoEncontrado) {
            setLinhaExpandida(registoEncontrado.id);
        }
    }
}, [location.search, registos]);


  const [resumoMensal, setResumoMensal] = useState({ lucro: 0, pagamento: 0, bilhetes_epoca: 0 });
  const [modoEdicaoCompra, setModoEdicaoCompra] = useState(null);
  const [compraEditada, setCompraEditada] = useState({});
  const [modoEdicaoVenda, setModoEdicaoVenda] = useState(null);
  const [vendaEditada, setVendaEditada] = useState({});
  const [tooltips, setTooltips] = useState({});
  const [clubesInfo, setClubesInfo] = useState([]);
  const [filtroPesquisa, setFiltroPesquisa] = useState("");
  


  useEffect(() => {
      const fetchClubes = async () => {
          try {
              const res = await fetch("https://controlo-bilhetes.onrender.com/clubes");
              const data = await res.json();
              setClubesInfo(data);
          } catch (error) {
              console.error("Erro ao carregar clubes:", error);
          }
      };
      fetchClubes();
  }, []);

  

  useEffect(() => {
    const carregarDados = async () => {
      await buscarVendas();
      await buscarCompras();
    };
    carregarDados();
  }, []);

  useEffect(() => {
    if (vendas.length && compras.length) {
      buscarEventos();
    }
  }, [vendas, compras]);

  useEffect(() => {
    buscarDropdown();
  }, []);

  useEffect(() => {
    buscarResumoMensal();
  }, []);

  useEffect(() => {
    if (compras.length && vendas.length) {
      buscarResumoMensal();
    }
  }, [compras, vendas]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const alvo = entries[0];
        if (alvo.isIntersecting && hasMore && !isLoading) {
          setSkip(prev => prev + limit);  // único local onde avançamos skip
        }
      },
      {
        threshold: 0.1,      // aciona um pouco antes
        rootMargin: "200px", // carrega já antes de chegares ao fundo
      }
    );
  
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, limit]);



  useEffect(() => {
    if (skip === 0 && registos.length > 0) return; // Evita recarregar no load inicial
    buscarEventos();
  }, [skip]);

  // ===================== Resumo + Ordenação de VENDAS por evento =====================

// Índice: (evento|data_evento) -> array de vendas
const idxVendasPorEvento = useMemo(() => {
  
  const map = new Map();
  for (const v of vendas ?? []) {
    const k = `${v.evento}|${v.data_evento}`;
    const arr = map.get(k) || [];
    arr.push(v);
    map.set(k, arr);
  }
  return map;
}, [vendas]);

// --- mapas por setor, usando o state atual ---
const mapVendasPorSetor = (evento, data_evento) => {
  const arr = idxVendasPorEvento.get(`${evento}|${data_evento}`) || [];
  const map = new Map();
  for (const v of arr) {
    const setor = setorExato(v.estadio);
    if (setor === "Devolução") continue;
    const key = setor.replace(/^Setor\s+/i, "").trim();
    const qtd = qtdBilhetes(v.estadio) || 0;
    map.set(key, (map.get(key) || 0) + qtd);
  }
  return map;
};

const mapComprasPorSetor = (evento, data_evento) => {
  const arr = compras.filter(c => c.evento === evento && c.data_evento === data_evento);
  const map = new Map();
  for (const c of arr) {
    const key = compraChave(c);
    const qtd = Number(c.quantidade || 0);
    if (!qtd) continue;
    map.set(key, (map.get(key) || 0) + qtd);
  }
  return map;
};

// --- resumos para o título ---
const getResumoPorVender = (evento, data_evento) => {
  const mv = mapVendasPorSetor(evento, data_evento);
  const mc = mapComprasPorSetor(evento, data_evento);
  const faltas = [];
  for (const [k, qC] of mc.entries()) {
    const qV = mv.get(k) || 0;
    const diff = qC - qV;
    if (diff > 0) faltas.push(`${k} (${diff})`);
  }
  return faltas.sort((a,b)=>a.localeCompare(b,"pt",{numeric:true,sensitivity:"base"})).join(" • ");
};

const getResumoPorComprar = (evento, data_evento) => {
  const mv = mapVendasPorSetor(evento, data_evento);
  const mc = mapComprasPorSetor(evento, data_evento);
  const faltas = [];
  for (const [k, qV] of mv.entries()) {
    const qC = mc.get(k) || 0;
    const diff = qV - qC;
    if (diff > 0) faltas.push(`${k} (${diff})`);
  }
  return faltas.sort((a,b)=>a.localeCompare(b,"pt",{numeric:true,sensitivity:"base"})).join(" • ");
};


// Título-resumo: "Setor X (N) • Lower 32 (M) ..."
const getResumoTituloVendas = (evento, data_evento) => {
  const arr = idxVendasPorEvento.get(`${evento}|${data_evento}`) || [];
  if (!arr.length) return "";

  const mapa = new Map();
  for (const v of arr) {
    const chave = setorExato(v.estadio);      // 👈 usa v.estadio
    if (chave === "Devolução") continue;
    const qtd = qtdBilhetes(v.estadio);       // 👈 idem
    const cur = mapa.get(chave) || { linhas: 0, bilhetes: 0 };
    cur.linhas += 1;
    cur.bilhetes += qtd;
    mapa.set(chave, cur);
  }

  return [...mapa.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "pt", { sensitivity: "base", numeric: true }))
    // mostra nº de linhas; troca para vals.bilhetes se quiseres total de bilhetes
    .map(([setor, vals]) => `${setor.replace(/^Setor\s+/i, "")} (${vals.bilhetes})`)
    .join(" • ");
};

// Lista ordenada de vendas do evento (por setor exato; depois pelo texto completo)
const getVendasOrdenadas = (evento, data_evento) => {
  const arr = [...(idxVendasPorEvento.get(`${evento}|${data_evento}`) || [])];
  return arr.sort((a, b) => {
    const ka = setorExato(a.estadio);
    const kb = setorExato(b.estadio);
    const p = ka.localeCompare(kb, "pt", { sensitivity: "base", numeric: true });
    if (p !== 0) return p;
    return (limpar(a.estadio)).localeCompare(limpar(b.estadio), "pt", {
      sensitivity: "base",
      numeric: true,
    });
  });
};

// Total de bilhetes desse evento (lê de v.estadio "(X Bilhetes)" ou número isolado)
const getTotalBilhetesVendas = (evento, data_evento) => {
  const arr = idxVendasPorEvento.get(`${evento}|${data_evento}`) || [];
  return arr.reduce((acc, v) => {
    if (setorExato(v.estadio) === "Devolução") return acc; // opcional: ignora devoluções
    return acc + (qtdBilhetes(v.estadio) || 0);
  }, 0);
};





  function exportarEventosParaExcel(eventos) {
    const worksheet = XLSX.utils.json_to_sheet(eventos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Eventos");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "eventos.xlsx");
  }

  const atualizarNota = async (tipo, id, nota) => {
    const url = `https://controlo-bilhetes.onrender.com/${tipo}/${id}`;
    const body = { texto_estado: nota };


    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const handleTooltipChange = (tipo, id, value) => {
    setTooltips(prev => ({ ...prev, [`${tipo}-${id}`]: value }));
    atualizarNota(tipo, id, value);
  };

  const corCirculo = (texto) => {
    if (texto === "verde") return "bg-green-500";
    if (texto === "vermelho") return "bg-red-500";
    return "bg-gray-400";
  };

  const buscarResumoMensal = async () => {
    try {
      const res = await fetch("https://controlo-bilhetes.onrender.com/resumo_mensal_eventos");
      const data = await res.json();
      setResumoMensal(data);
    } catch (err) {
      console.error("Erro ao buscar resumo mensal:", err);
    }
  };

  const buscarLucrosMensais = async () => {
    try {
      const res = await fetch("https://controlo-bilhetes.onrender.com/lucro_por_mes");
      const data = await res.json();
      console.log("📊 Dados recebidos:", data);
      setLucrosMensais(data.map(d => ({ ...d, lucro: Number(d.lucro) })));
      setMostrarResumoDetalhado(true); // 👈 abre o modal
    } catch (err) {
      console.error("Erro ao buscar lucros mensais:", err);
    }
  };
  
  // ✅ Função auxiliar para saber se o mês já acabou
  function isMesPassado(mesStr) {
    try {
      const [mesNomeRaw, anoStr] = mesStr.trim().toLowerCase().split(" ");
      const mesesIngles = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
      ];
  
      const mesIndex = mesesIngles.indexOf(mesNomeRaw);
      const ano = parseInt(anoStr, 10);
  
      if (mesIndex === -1 || isNaN(ano)) return false;
  
      const dataItem = new Date(ano, mesIndex + 1, 0); // último dia do mês
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
  
      return dataItem < hoje;
    } catch {
      return false;
    }
  }

  function traduzirMesParaPt(mesStr) {
    const [mesNomeRaw, anoStr] = mesStr.trim().toLowerCase().split(" ");
  
    const meses = {
      january: "Janeiro", february: "Fevereiro", march: "Março",
      april: "Abril", may: "Maio", june: "Junho",
      july: "Julho", august: "Agosto", september: "Setembro",
      october: "Outubro", november: "Novembro", december: "Dezembro"
    };
  
    const mesTraduzido = meses[mesNomeRaw] || mesNomeRaw;
    return `${mesTraduzido} ${anoStr}`;
  }

// === IMPRIMIR VENDAS COM BOLA VERMELHA (por evento) ===
const isVermelho = (val) => typeof val === "string" && /vermelho|red/i.test(val.trim());

const imprimirVendasComNotaVermelha = (vendasDoEvento, tituloEvento = "Vendas com Nota (bola vermelha)") => {
  if (!Array.isArray(vendasDoEvento)) vendasDoEvento = [];

  // ⚠️ agora só filtra por bola vermelha (nota pode estar vazia)
  const selecionadas = vendasDoEvento.filter(v => isVermelho(v?.circulo_estado_venda));

  if (selecionadas.length === 0) {
    toast.info("Não há vendas com nota (bola vermelha) para imprimir.");
    return;
  }

  const linhas = selecionadas.map(v => `
    <tr>
      <td>${v.id_venda ?? v.id ?? ""}</td>
      <td>${(v.data_evento ?? "").toString().slice(0,10)}</td>
      <td>${v.evento ?? ""}</td>
      <td>${v.estadio ?? ""}</td>
      <td>${v.ganho ?? ""}</td>
      <td>${v.estado ?? ""}</td>
      <td>${String(v.nota_estado_venda ?? "").replace(/</g,"&lt;")}</td>
    </tr>
  `).join("");

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${tituloEvento}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          h1 { font-size: 18px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; }
          th { background: #f3f3f3; text-align: left; }
          @media print { @page { margin: 12mm; } }
        </style>
      </head>
      <body>
        <h1>${tituloEvento}</h1>
        <table>
          <thead>
            <tr>
              <th>ID Venda</th>
              <th>Data Evento</th>
              <th>Evento</th>
              <th>Bilhetes</th>
              <th>Ganho (€)</th>
              <th>Estado</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            ${linhas}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) { toast.error("Popup bloqueado. Permite popups para imprimir."); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  // w.close(); // opcional
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

  const buscarDropdown = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown");
    if (res.ok) {
      const data = await res.json();
      setEventosDropdown(ordenarEventosDropdown(data));
    }
  };

  const buscarEventos = async () => {
    if (isLoading || !hasMore) return;        // 🔧 guarda adicional de segurança
    setIsLoading(true);
  
    try {
      const pageLimit = isCompact ? 1000 : limit;  // tablets também levam 1000
  
      const res = await fetch(`https://controlo-bilhetes.onrender.com/eventos_completos2?skip=${skip}&limit=${pageLimit}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
  
      const eventos = await res.json();
  
      // 🔧 se veio menos do que o pedido, acabou a lista
      if (eventos.length < pageLimit) {
        setHasMore(false);
      }
  
      // 🔧 evitar duplicados se houver chamadas em paralelo
      setRegistos(prev => {
        const vistos = new Set(prev.map(e => e.id));
        const novos = eventos.filter(e => !vistos.has(e.id));
        return [...prev, ...novos];
      });
  
      // 🔧 NÃO avançar skip aqui! (fica só no IntersectionObserver)
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    } finally {
      setIsLoading(false);
    }
  };





  const buscarVendas = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/listagem_vendas");
    if (res.ok) setVendas(await res.json());
  };

  const buscarCompras = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/compras");
    if (res.ok) setCompras(await res.json());
  };

  const atualizarCampo = (id, campo, valor) => {
    setRegistos(registos =>
      registos.map(r =>
        r.id === id ? { ...r, [campo]: valor } : r
      )
    );
  };

  const guardarEvento = async (evento) => {
    const res = await fetch(`https://controlo-bilhetes.onrender.com/eventos_completos2/${evento.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evento)
    });
    if (res.ok) {
      await buscarEventos();
      await buscarResumoMensal();
      setModoEdicao(null);
    }
  };

  const ativarEdicao = (id, registo) => {
    setModoEdicao(id);
    setEventoEditado({ ...registo });
  };


  const adicionarLinha = async () => {
    const novo = {
        data_evento: new Date().toISOString().split("T")[0],
        evento: "",
        estadio: "",
        gasto: 0,
        ganho: 0,
        estado: "Por entregar"
    };
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novo)
    });
    if (res.ok) {
        // Recarregar tudo corretamente após adicionar
        setRegistos([]);
        setSkip(0);
        setHasMore(true);
    }
};


  const confirmarEliminar = (id) => {
    setIdAEliminar(id);
    setMostrarModal(true);
  };

  const eliminarRegisto = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2/" + idAEliminar, {
      method: "DELETE"
    });
    if (res.ok) {
    setMostrarModal(false);
    setIdAEliminar(null);
    setRegistos([]);
    setSkip(0);
    setHasMore(true);
    }
  };

  const guardarCompra = async (compra) => {
    const res = await fetch(`https://controlo-bilhetes.onrender.com/compras/${compra.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(compra)
    });
    if (res.ok) {
      await buscarCompras();
      await buscarEventos();
      await buscarResumoMensal();
      setModoEdicaoCompra(null);
    }
  };

  const guardarVenda = async (venda) => {
    const res = await fetch(`https://controlo-bilhetes.onrender.com/listagem_vendas/${venda.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...venda,
        ganho: parseFloat(venda.ganho),
        id_venda: parseInt(venda.id_venda),
        data_venda: venda.data_venda?.split("T")[0]
      })
    });
    if (res.ok) {
      await buscarVendas();
      await buscarEventos();
      await buscarResumoMensal();
      setModoEdicaoVenda(null);
    }
  };

  const renderEventoComSimbolos = (eventoNome) => {
  // Limpa "vs vs", "vs  vs", etc.
  const nomeLimpo = eventoNome.replace(/\b(vs\s*){2,}/gi, "vs");

  // Divide apenas por "vs" como palavra isolada
  const partes = nomeLimpo.split(/\bvs\b/i)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return partes.map((parte, idx) => {
    const clubeMatch = clubesInfo.find(clube =>
      parte.toLowerCase().includes(clube.nome.toLowerCase().slice(0, 5))
    );

    return (
      <span key={idx} className="inline-flex items-center gap-1 mr-2">
        {clubeMatch && clubeMatch.simbolo && (
          <img
            src={clubeMatch.simbolo}
            alt={clubeMatch.nome}
            className="w-5 h-5 object-contain inline-block"
          />
        )}
        {parte}
        {/* Só adiciona "vs" entre os dois clubes */}
        {idx === 0 && partes.length > 1 && <span className="mx-1">vs</span>}
      </span>
    );
  });
};




return (
   <div className="p-4 md:p-6 w-full md:max-w-[1400px] md:mx-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Resumo de Eventos</h1>


      <div className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-600 dark:border-yellow-400 text-yellow-800 dark:text-yellow-200 p-4 mb-6 rounded transition-colors duration-300">
  <div className="flex items-center justify-between mb-2">
    <p className="font-semibold text-lg">Resumo Mensal</p>
    <button
  type="button"
  onClick={buscarLucrosMensais}
  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
>
  📊 Ver Lucros por Mês
</button>
  </div>    
  <p>📆 Lucro de {new Date().toLocaleString("pt-PT", { month: "long", year: "numeric" })}: <strong>{formatarNumero(resumoMensal.lucro)} €</strong></p>
  <p>
  💸 A aguardar pagamento:{" "}
  <strong>{formatarNumero(resumoMensal.pagamento)} €</strong>
  {resumoMensal.disputas > 0 && (
    <span className="ml-2 text-xs font-semibold text-red-600 dark:text-red-400">
      (+Disputas {formatarNumero(resumoMensal.disputas)} €)
    </span>
  )}
</p>
  <p>🎟️ Bilhetes vendidos esta época: <strong>{formatarNumero(resumoMensal.bilhetes_epoca)}</strong></p>
</div>


      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">

  {/* Botão Adicionar Evento */}
  <button
    onClick={adicionarLinha}
    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
  >
    Adicionar Evento
  </button>

  {/* Filtro de pesquisa ao meio */}
  <div className="relative w-full md:w-72">
    <input
      type="text"
      placeholder="🔍 Pesquisar equipa..."
      value={filtroPesquisa}
      onChange={(e) => setFiltroPesquisa(e.target.value)}
      className="p-2 pr-8 border rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
    />
    {filtroPesquisa && (
      <button
        onClick={() => setFiltroPesquisa("")}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-red-500 text-sm"
        title="Limpar"
      >
        ❌
      </button>
    )}
  </div>

 {/* ✅ Botão "Ocultar Pagos" — DESKTOP */}
  <div className="hidden md:block">
    <button
      onClick={() => setOcultarPagos(v => !v)}
      className={`ml-2 px-3 py-2 rounded text-white text-sm font-semibold transition-colors
        ${ocultarPagos ? "bg-gray-600 hover:bg-gray-700" : "bg-green-600 hover:bg-green-700"}`}
      title={ocultarPagos ? "A ocultar eventos pagos" : "A mostrar eventos pagos"}
    >
      {ocultarPagos ? "💰 Ocultar Pagos: ON" : "💰 Ocultar Pagos: OFF"}
    </button>
  </div>       

  {/* ✅ Botão "Ocultar Pagos" apenas no mobile */}
  <div className="md:hidden mt-2 flex justify-end">
    <button
      onClick={() => setOcultarPagos(!ocultarPagos)}
      className={`px-3 py-2 rounded text-white text-sm font-semibold transition-colors ${
        ocultarPagos ? "bg-gray-600 hover:bg-gray-700" : "bg-green-600 hover:bg-green-700"
      }`}
    >
      {ocultarPagos ? "👁️ Mostrar Pagos" : "💰 Ocultar Pagos"}
    </button>
  </div>
        
  <button
    onClick={() => exportarEventosParaExcel(registos)}
    className="hidden md:flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition"
  >
    <FaFileExcel size={18} />
    Exportar Excel
  </button>


</div>




      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-md rounded p-4 transition-colors duration-300">
        <div className="overflow-x-auto w-full">
          <table className="hidden md:table min-w-full border border-gray-300 dark:border-gray-600 text-sm transition-colors duration-300">
            <thead className="bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
               <tr>
                <th></th>
                <th className="p-2">Data</th>
                <th className="p-2">Evento</th>
                <th className="p-2">Estádio</th>
                <th className="p-2">Gasto</th>
                <th className="p-2">Ganho</th>
                <th className="p-2">Lucro</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
            {registos
              .filter(r => {
                const passaPesquisa = r.evento.toLowerCase().includes(filtroPesquisa.toLowerCase());
                const esconderPago = ocultarPagos && r.estado === "Pago" && modoEdicao !== r.id;
                return passaPesquisa && !esconderPago;
              })
              .map(r => (
              <>
                <tr
  key={r.id}
  ref={(el) => (linhaRefs.current[r.id] = el)}
  onClick={() => {
    const novoExpandido = linhaExpandida === r.id ? null : r.id;
    setLinhaExpandida(novoExpandido);

    if (novoExpandido !== null) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = linhaRefs.current[r.id];
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 150); // ligeiro atraso para garantir que DOM já expandiu
      });
    }
  }}
  className={`cursor-pointer ${
    linhaExpandida === r.id
      ? "bg-blue-100 dark:bg-blue-800 text-gray-900 dark:text-gray-100 font-semibold"
      : r.estado === "Pago"
      ? "bg-green-100 dark:bg-green-700"
      : r.estado === "Entregue"
      ? "bg-yellow-100 dark:bg-yellow-700"
      : r.estado === "Disputa"
      ? "bg-red-200 dark:bg-red-800"
      : ""
  } transition-colors duration-300`}
>


                 <td className="p-2">
  {vendas.some(v => v.evento === r.evento && v.data_evento === r.data_evento) || compras.some(c => c.evento === r.evento && c.data_evento === r.data_evento) ? (
    <button onClick={() => setLinhaExpandida(linhaExpandida === r.id ? null : r.id)}>
      {linhaExpandida === r.id ? "🔼" : "🔽"}
    </button>
  ) : (
    <span className="text-red-600">🔻</span>
  )}
</td>
  <td className="p-2">
    {modoEdicao === r.id ? (
      <input
        type="date"
        value={toInputDate(r.data_evento)}   // ✅ agora usa o helper
        onChange={(e) => atualizarCampo(r.id, "data_evento", e.target.value)}
        className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300 [color-scheme:dark]"
      />
    ) : (
      formatarDataPt(r.data_evento)
    )}
  </td>


                  <td className="p-2">
  {modoEdicao === r.id ? (
    <select
  value={r.evento}
  onChange={(e) => atualizarCampo(r.id, "evento", e.target.value)}
  className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
>
  <option value="">-- Selecionar Evento --</option>
  {eventosDropdown.map(e => (
    <option key={e.id} value={e.nome}>{e.nome}</option>
  ))}
</select>
  ) : (
    <div className="flex items-center gap-2">
      <span className="flex flex-wrap items-center gap-1">
        {renderEventoComSimbolos(r.evento)}
      </span>
      {r.nota_evento && (
        <span className="text-yellow-400 animate-pulse" title={r.nota_evento}>📝</span>
      )}
    </div>
  )}
</td>
                  <td className="p-2">
                    {modoEdicao === r.id
                      ? <input value={r.estadio} onChange={(e) => atualizarCampo(r.id, "estadio", e.target.value)} className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" />
                      : r.estadio}
                  </td>
                  <td className="p-2">{r.gasto} €</td>
                  <td className="p-2">{r.ganho} €</td>
                  <td className="p-2">{(r.ganho - r.gasto)} €</td>
                  <td className="p-2">
                    {modoEdicao === r.id
                      ? (
                        <select value={r.estado} onChange={(e) => atualizarCampo(r.id, "estado", e.target.value)} className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300">
                          <option value="Entregue">Entregue</option>
                          <option value="Por entregar">Por entregar</option>
                          <option value="Disputa">Disputa</option>
                          <option value="Pago">Pago</option>
                        </select>
                      ) : r.estado}
                  </td>
                  <td className="p-2 align-middle">
                    <div className="flex items-center gap-2">
                      {/* Editar */}
                      <button
                        onClick={() => {
                          if (modoEdicao === r.id) {
                            guardarEvento(r);
                          } else {
                            setModoEdicao(r.id);
                          }
                        }}
                        className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded leading-none"
                        title={modoEdicao === r.id ? "Guardar" : "Editar"}
                      >
                        {modoEdicao === r.id ? "💾" : <FaEdit size={14} />}
                      </button>
                  
                      {/* Eliminar */}
                      <button
                        onClick={() => confirmarEliminar(r.id)}
                        className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded leading-none"
                        title="Eliminar"
                      >
                        <FaTrash size={14} />
                      </button>
                  
                      {/* Imprimir (só desktop) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const vendasDoEvento = vendas.filter(
                            (v) => v.evento === r.evento && v.data_evento === r.data_evento
                          );
                          const titulo = `Vendas com Nota (bola vermelha) — ${r.evento} — ${new Date(
                            r.data_evento
                          ).toLocaleDateString("pt-PT")}`;
                          imprimirVendasComNotaVermelha(vendasDoEvento, titulo);
                        }}
                        title="Imprimir vendas com Nota (bola vermelha) deste evento"
                        className="hidden md:flex items-center justify-center px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white leading-none"
                      >
                        <FaPrint size={14} />
                      </button>
                  
                      {/* Notas */}
                      {/* Notas (por evento) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMostrarNotaEventoId(r.id);
                          setNotaEventoTmp(r.nota_evento || "");
                        }}
                        className={`flex items-center justify-center px-2 py-1 rounded leading-none
                          ${r.nota_evento ? "bg-purple-600 text-white neon-glow" : "bg-gray-500 text-white hover:bg-gray-600"}`}
                        title={r.nota_evento ? "Editar notas do evento" : "Adicionar nota ao evento"}
                      >
                        📝
                      </button>
                    </div>
                  </td>
                </tr>

                {linhaExpandida === r.id && (
                  <>
                    
                    
                   <tr className="bg-indigo-50 dark:bg-gray-800 text-sm border-t border-l-4 border-blue-600 transition-colors duration-300">
  <td colSpan="9" className="p-2 font-semibold">
  Vendas ({getTotalBilhetesVendas(r.evento, r.data_evento)})
  {(() => {
    const resumo = getResumoTituloVendas(r.evento, r.data_evento);
    return resumo ? <> — {resumo}</> : null;
  })()}
  {(() => {
    const pv = getResumoPorVender(r.evento, r.data_evento);
    return pv ? <span className="text-red-500"> — Por vender: {pv}</span> : null;
  })()}
  {(() => {
    const pc = getResumoPorComprar(r.evento, r.data_evento);
    return pc ? <span className="text-orange-500"> — Por comprar: {pc}</span> : null;
  })()}
</td>

</tr>

<tr className="border-l-4 border-blue-600 bg-blue-100 dark:bg-blue-800 text-xs font-semibold">
  <td className="p-2">ID Venda</td>
  <td className="p-2" colSpan="3">Bilhetes</td>
  <td className="p-2">Ganho</td>
  <td className="p-2">Estado</td>
  <td className="p-2">Nota</td>
  <td className="p-2">Ações</td>
  <td className="p-2"></td> {/* ← coluna vazia para manter 9 colunas */}
</tr>




{(() => {
  let lastSetor = null;
  let toggle = false;

  return getVendasOrdenadas(r.evento, r.data_evento).map((v) => {
    const setorAtual = setorExato(v.estadio);

    // Se mudou de setor → alterna cor
    if (setorAtual !== lastSetor) {
      toggle = !toggle;
      lastSetor = setorAtual;
    }

    const bgClass = toggle
      ? "bg-blue-50 dark:bg-blue-900"   // azul clarinho
      : "bg-blue-100 dark:bg-blue-800"; // azul normal

    if (modoEdicaoVenda === v.id) {
      return (
        <tr
          key={"v" + v.id}
          className={`border-l-4 border-blue-600 text-xs border-t ${bgClass}`}
        >
          <td className="p-2">
            <input
              type="number"
              className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
              value={vendaEditada.id_venda}
              onChange={(e) =>
                setVendaEditada({ ...vendaEditada, id_venda: e.target.value })
              }
            />
          </td>
          <td className="p-2" colSpan="2">
            <input
              className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
              value={vendaEditada.estadio}
              onChange={(e) =>
                setVendaEditada({ ...vendaEditada, estadio: e.target.value })
              }
            />
          </td>
          <td className="p-2">
            <input
              type="number"
              className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
              value={vendaEditada.ganho}
              onChange={(e) =>
                setVendaEditada({ ...vendaEditada, ganho: e.target.value })
              }
            />
          </td>
          <td className="p-2">
            <select
              className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
              value={vendaEditada.estado}
              onChange={(e) =>
                setVendaEditada({ ...vendaEditada, estado: e.target.value })
              }
            >
              <option value="Entregue">Entregue</option>
              <option value="Por entregar">Por entregar</option>
              <option value="Disputa">Disputa</option>
              <option value="Pago">Pago</option>
            </select>
          </td>
          <td colSpan="4" className="p-2">
            <button
              className="text-green-600 mr-2"
              onClick={() => guardarVenda(vendaEditada)}
            >
              Guardar
            </button>
            <button
              className="text-gray-500"
              onClick={() => setModoEdicaoVenda(null)}
            >
              Cancelar
            </button>
          </td>
        </tr>
      );
    } else {
      return (
        <tr
          key={"v" + v.id}
          className={`border-l-4 border-blue-600 text-xs border-t ${bgClass}`}
        >
          <td className="p-2">{v.id_venda}</td>
          <td className="p-2" colSpan="3">
            {v.estadio}
          </td>
          <td className="p-2">{v.ganho} €</td>
          <td className="p-2 whitespace-nowrap">{v.estado}</td>
          <td className="p-2">
            <CirculoEstado
              tipo="listagem_vendas"
              id={v.id}
              texto_estado={v.circulo_estado_venda}
              nota_estado={v.nota_estado_venda}
              setVendas={setVendas}
            />
          </td>
          <td className="p-2">
            {vendasNaoAssociadasSet.has(v.id) && (
              <span
                className="text-yellow-500 mr-2"
                title="Venda não associada a evento"
              >
                ⚠️
              </span>
            )}
            <button
              onClick={() => {
                setModoEdicaoVenda(v.id);
                setVendaEditada(v);
              }}
              className="text-blue-600 hover:underline"
            >
              Editar
            </button>
          </td>
          <td className="p-2"></td>
        </tr>
      );
    }
  });
})()}



   <tr className="bg-yellow-50 dark:bg-yellow-900 text-sm border-t border-l-4 border-yellow-600">
  <td colSpan="9" className="p-2 font-semibold">
    Compras ({compras.filter(c => c.evento === r.evento && c.data_evento === r.data_evento).reduce((acc, c) => acc + Number(c.quantidade || 0), 0)})
  </td>
</tr>
<tr className="border-l-4 border-yellow-600 bg-yellow-100 dark:bg-yellow-800 text-xs font-semibold">
  <td className="p-2">Local</td>
  <td className="p-2">Bancada</td>
  <td className="p-2">Setor</td>
  <td className="p-2">Fila</td>
  <td className="p-2">Qt</td>
  <td className="p-2">Gasto</td>
  <td className="p-2">Nota</td>
  <td className="p-2">Ações</td>
  <td></td>
</tr>

{compras.filter(c => c.evento === r.evento && c.data_evento === r.data_evento).map(c => (
  <tr key={"c" + c.id} className="border-l-4 border-yellow-600 bg-yellow-50 dark:bg-yellow-900 text-xs border-t">
    {modoEdicaoCompra === c.id ? (
      <>
        <td className="p-2">
          <input className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={compraEditada.local_compras} onChange={e => setCompraEditada({ ...compraEditada, local_compras: e.target.value })} />
        </td>
        <td className="p-2">
          <input className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={compraEditada.bancada} onChange={e => setCompraEditada({ ...compraEditada, bancada: e.target.value })} />
        </td>
        <td className="p-2">
          <input className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={compraEditada.setor} onChange={e => setCompraEditada({ ...compraEditada, setor: e.target.value })} />
        </td>
        <td className="p-2">
          <input className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={compraEditada.fila} onChange={e => setCompraEditada({ ...compraEditada, fila: e.target.value })} />
        </td>
        <td className="p-2">
          <input type="number" className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={compraEditada.quantidade} onChange={e => setCompraEditada({ ...compraEditada, quantidade: e.target.value })} />
        </td>
        <td className="p-2">
          <input type="number" className="border p-2 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" value={compraEditada.gasto} onChange={e => setCompraEditada({ ...compraEditada, gasto: e.target.value })} />
        </td>
        <td className="p-2" colSpan="3">
          <button className="text-green-600 mr-2" onClick={() => guardarCompra(compraEditada)}>Guardar</button>
          <button className="text-gray-500" onClick={() => setModoEdicaoCompra(null)}>Cancelar</button>
        </td>
      </>
    ) : (
      <>
        <td className="p-2">{c.local_compras}</td>
        <td className="p-2">{c.bancada}</td>
        <td className="p-2">{c.setor}</td>
        <td className="p-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={c.fila}>
  {c.fila}
</td>
        <td className="p-2">{c.quantidade}</td>
        <td className="p-2">{c.gasto} €</td>
       <td className="p-2">
  <CirculoEstado
    tipo="compras"
    id={c.id}
    texto_estado={c.circulo_estado_compra}
    nota_estado={c.nota_estado_compra}
    setCompras={setCompras}
  />
</td>
<td className="p-2">
  {comprasNaoAssociadasSet.has(c.id) && (
    <span className="text-yellow-500 mr-2" title="Compra não associada a evento">⚠️</span>
  )}
  <button
    onClick={() => {
      setModoEdicaoCompra(c.id);
      setCompraEditada(c);
    }}
    className="text-blue-600 hover:underline"
  >
    Editar
  </button>

</td>
<td></td>

      </>
    )}
  </tr>
  ))}
                  </>
                )}
              </>
            ))}
          </tbody>
        </table>       
          <div className="space-y-5 md:hidden mt-6 px-0 w-full max-w-full">
            {registos
              .filter(r => {
                const passaPesquisa = r.evento.toLowerCase().includes(filtroPesquisa.toLowerCase());
                const esconderPago = ocultarPagos && r.estado === "Pago" && modoEdicao !== r.id;
                return passaPesquisa && !esconderPago;
              })
              .map((r) => {
                const emEdicao = modoEdicao === r.id;
                const d = parseDataPt(r.data_evento); // ✅ usar helper para datas
                return (
                  <div
                    key={r.id}
                    onClick={(e) => {
                      if (!e.target.closest("button")) {
                        setLinhaExpandida(linhaExpandida === r.id ? null : r.id);
                      }
                    }}
                    className="w-full mx-0 rounded-xl border border-gray-700 bg-gradient-to-br from-zinc-900 to-gray-800 p-4 shadow-xl text-white cursor-pointer"
                  >
                    {/* Topo: Data + Estado */}
                    <div className="flex justify-between items-center text-sm mb-2">
                      {/* Data (com edição) */}
                      {emEdicao ? (
                        <input
                          type="date"
                          value={eventoEditado.data_evento}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            setEventoEditado({
                              ...eventoEditado,
                              data_evento: e.target.value,
                            })
                          }
                          className="bg-gray-900 border border-gray-500 text-white text-xs px-2 py-1 rounded"
                        />
                      ) : (
                        <div className="bg-gray-800 text-white text-center px-3 py-1 rounded w-14 leading-tight">
                          <div className="text-[10px] text-gray-300 uppercase">
                            {d ? d.toLocaleDateString("pt-PT", { month: "short" }) : ""}
                          </div>
                          <div className="text-lg font-bold">
                            {d ? String(d.getDate()).padStart(2, "0") : "--"}
                          </div>
                          <div className="text-[10px] text-gray-300 uppercase">
                            {d ? d.toLocaleDateString("pt-PT", { weekday: "short" }) : ""}
                          </div>
                        </div>
                      )}


          
                    {/* Estado */}
                    {emEdicao ? (
                      <select
                        value={eventoEditado.estado}
                        onChange={(e) => setEventoEditado({ ...eventoEditado, estado: e.target.value })}
                        className="bg-gray-900 border border-gray-500 text-white text-xs px-2 py-1 rounded"
                      >
                        <option value="Entregue">Entregue</option>
                        <option value="Pago">Pago</option>
                        <option value="Disputa">Disputa</option>
                        <option value="Por entregar">Por entregar</option>
                      </select>
                    ) : (
                      <span
                        className={`font-bold px-3 py-1 rounded-full text-xs ${
                          r.estado === "Pago"
                            ? "bg-green-500 text-white"
                            : r.estado === "Disputa"
                            ? "bg-red-500 text-white"
                            : r.estado === "Entregue"
                            ? "bg-blue-500 text-white"
                            : "bg-yellow-400 text-black"
                        }`}
                      >
                        {r.estado}
                      </span>
                    )}
                  </div>
          
                  {/* Evento com símbolos */}
                  <div className="text-lg font-bold mb-2 text-amber-400">
                    {emEdicao ? (
                      <select
                        value={eventoEditado.evento}
                        onChange={(e) =>
                          setEventoEditado({ ...eventoEditado, evento: e.target.value })
                        }
                        className="w-full bg-gray-900 border border-gray-500 p-2 rounded text-white"
                      >
                        <option value="">-- Selecionar Evento --</option>
                        {eventosDropdown.map((ev) => (
                          <option key={ev.id} value={ev.nome}>
                            {ev.nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1">{renderEventoComSimbolos(r.evento)}</div>
                    )}
                  </div>
          
                  {/* Totais em colunas alinhadas */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-400 font-semibold px-1">
                      <div>Gasto</div>
                      <div>Ganho</div>
                      <div>Lucro</div>
                    </div>
                    <div className="flex justify-between text-lg text-white font-bold px-1 mt-1">
                      {/* Gasto */}
                      <div className="text-red-400">
                        {emEdicao ? (
                          <input
                            type="number"
                            value={eventoEditado.gasto}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setEventoEditado({ ...eventoEditado, gasto: e.target.value })
                            }
                            className="w-20 bg-gray-900 border border-gray-500 p-1 rounded text-right text-red-400 text-lg"
                          />
                        ) : (
                          <span>{r.gasto || 0} €</span>
                        )}
                      </div>
                  
                      {/* Ganho */}
                      <div className="text-green-400">
                        {emEdicao ? (
                          <input
                            type="number"
                            value={eventoEditado.ganho}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setEventoEditado({ ...eventoEditado, ganho: e.target.value })
                            }
                            className="w-20 bg-gray-900 border border-gray-500 p-1 rounded text-right text-green-400 text-lg"
                          />
                        ) : (
                          <span>{r.ganho || 0} €</span>
                        )}
                      </div>
                  
                      {/* Lucro */}
                      <div className="text-sm font-semibold">
                        {emEdicao ? (
                          <span className="text-yellow-300 text-lg">
                            {(eventoEditado.ganho || 0) - (eventoEditado.gasto || 0)} €
                          </span>
                        ) : (
                          <span
                            className={
                              (r.ganho || 0) - (r.gasto || 0) < 0
                                ? "flash-lucro-negativo text-lg"
                                : "flash-lucro-positivo text-lg"
                            }
                          >
                            {(r.ganho || 0) - (r.gasto || 0)} €
                          </span>
                        )}
                      </div>
                    </div>
                  </div>


          
                  {/* Botões */}
                  <div className="mt-4 flex justify-end gap-4">
                    {emEdicao ? (
                      <button
                        onClick={() => guardarEvento(eventoEditado)}
                        className="bg-green-600 text-white py-1 px-3 rounded"
                      >
                        💾 Guardar
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
                  </div>
          
                  {linhaExpandida === r.id && (
                    <div className="mt-4 space-y-3">

                      {/* ✅ Cabeçalho VENDAS (MOBILE) */}
                      <div className="text-sm font-semibold text-blue-300">
                        Vendas (
                        {
                          vendas
                            .filter(v => v.evento === r.evento && v.data_evento === r.data_evento)
                            .reduce((acc, v) => {
                              const texto = v.estadio?.trim();
                              if (/^\d+$/.test(texto)) return acc + parseInt(texto); // Ex: "2"
                              const match = texto.match(/\((\d+)\s*Bilhetes?\)/i);   // Ex: "Piso 0 (4 Bilhetes)"
                              return acc + (match ? parseInt(match[1]) : 0);
                            }, 0)
                        }
                        )
                      </div>

                  
                      {/* VENDAS */}
                      {vendas.filter(v => v.evento === r.evento && v.data_evento === r.data_evento).map((v) => (
                        <div key={v.id} className="bg-blue-900 text-white p-3 rounded shadow">
                          <div className="flex justify-between text-xs text-gray-300">
                            <span>ID: {v.id_venda}</span>
                            <span className="font-bold">{v.estado}</span>
                          </div>
                          <div className="mt-1 text-sm">
                            <div><span className="text-gray-400">Bilhetes:</span> {v.estadio}</div>
                            <div><span className="text-gray-400">Ganho:</span> {v.ganho} €</div>
                          </div>
                          <div className="mt-2">
                            <CirculoEstado
                              tipo="listagem_vendas"
                              id={v.id}
                              texto_estado={v.circulo_estado_venda}
                              nota_estado={v.nota_estado_venda}
                              setVendas={setVendas}
                            />
                          </div>
                        </div>
                      ))}


                      {/* ✅ Cabeçalho COMPRAS (MOBILE) */}
                      <div className="text-sm font-semibold text-yellow-300 mt-4">
                        Compras (
                        {
                          compras
                            .filter(c => c.evento === r.evento && c.data_evento === r.data_evento)
                            .reduce((acc, c) => acc + Number(c.quantidade || 0), 0)
                        }
                        )
                      </div>


                      
                      {/* COMPRAS */}
                      {compras.filter(c => c.evento === r.evento && c.data_evento === r.data_evento).map((c) => (
                        <div key={c.id} className="bg-yellow-800 text-white p-3 rounded shadow">
                          <div className="text-xs text-gray-300 mb-1">Compra #{c.id}</div>
                          <div className="text-sm space-y-1">
                            <div><span className="text-gray-400">Local:</span> {c.local_compras}</div>
                            <div><span className="text-gray-400">Setor:</span> {c.setor}</div>
                            <div><span className="text-gray-400">Fila:</span> {c.fila}</div>
                            <div><span className="text-gray-400">Qtd:</span> {c.quantidade}</div>
                            <div><span className="text-gray-400">Gasto:</span> {c.gasto} €</div>
                          </div>
                          <div className="mt-2">
                            <CirculoEstado
                              tipo="compras"
                              id={c.id}
                              texto_estado={c.circulo_estado_compra}
                              nota_estado={c.nota_estado_compra}
                              setCompras={setCompras}
                            />
                          </div>
                        </div>
                      ))}
                  
                    </div>
                  )}
                </div>
              );
            })}
          </div>


          {hasMore && (
            <div ref={observerRef} className="text-center py-4 text-gray-700 dark:text-gray-300">
              🔄 A carregar mais eventos...
            </div>
          )}
       </div>   
      </div>

         {/* Modal de lucros por mês */}
      {mostrarResumoDetalhado && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 text-black dark:text-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Lucro por Mês</h2>
            <ul className="mb-4 space-y-1 text-black dark:text-white">
              {Array.isArray(lucrosMensais) && lucrosMensais.map((item, idx) => (
                <li key={idx} className="flex justify-between gap-8">
                  <span>{traduzirMesParaPt(item.mes)}</span>
                  <span className={
                    isMesPassado(item.mes) && item.lucro >= 0
                      ? "text-green-600 font-semibold"
                      : item.lucro < 0
                      ? "text-red-500"
                      : ""
                  }>
                    {formatarNumero(Number(item.lucro))} €
                  </span>
                </li>

              ))}
            </ul>

            {Array.isArray(lucrosMensais) && (
              <div className="text-right font-bold text-lg border-t pt-2 text-black dark:text-white">
                Total: {formatarNumero(lucrosMensais.reduce((acc, cur) => acc + Number(cur.lucro || 0), 0))} €
              </div>

            )}

            <button
              onClick={() => setMostrarResumoDetalhado(false)}
              className="mt-4 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Nota do Evento */}
      {mostrarNotaEventoId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full max-w-lg rounded-xl shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Notas do evento</h3>
      
            <textarea
              value={notaEventoTmp}
              onChange={(e) => setNotaEventoTmp(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900"
              placeholder="Escreve aqui as tuas notas…"
            />
      
            <div className="mt-4 flex justify-between items-center">
              {/* Indicador simples do estado */}
              <span className="text-xs text-gray-500">
                {notaEventoTmp?.length ? `${notaEventoTmp.length} caracteres` : "Sem nota"}
              </span>
      
              <div className="flex gap-2">
                <button
                  onClick={() => setMostrarNotaEventoId(null)}
                  className="px-3 py-2 rounded bg-gray-300 dark:bg-gray-700 hover:opacity-90"
                >
                  Cancelar
                </button>
      
                <button
                  onClick={async () => {
                    const id = mostrarNotaEventoId;
                    const eventoAtual = registos.find(x => x.id === id) || {};
                    const payload = { ...eventoAtual, nota_evento: notaEventoTmp };
      
                    try {
                      const res = await fetch(`https://controlo-bilhetes.onrender.com/eventos_completos2/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      });
                      if (!res.ok) throw new Error("Falha ao gravar nota");
      
                      // atualiza localmente e fecha modal
                      setRegistos(prev => prev.map(x => x.id === id ? { ...x, nota_evento: notaEventoTmp } : x));
                      setMostrarNotaEventoId(null);
                    } catch (e) {
                      toast.error("Não foi possível guardar a nota do evento.");
                      console.error(e);
                    }
                  }}
                  className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

     
      {/* Modal de confirmação */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 dark:text-gray-100 p-6 rounded shadow-lg transition-colors duration-300">
            <p className="mb-4">Tem a certeza que quer eliminar este registo?</p>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setMostrarModal(false)} className="bg-gray-300 px-4 py-2 rounded">
                Cancelar
              </button>
              <button onClick={eliminarRegisto} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
   </div>
  );
}

