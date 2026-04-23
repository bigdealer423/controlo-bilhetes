
import { useState, useEffect, useMemo, useRef, Fragment } from "react";
import {
  FaTrash,
  FaPrint,
  FaFileExcel,
  FaEdit,
  FaExternalLinkAlt,
  FaChartBar,
  FaChartLine,
  FaHourglassHalf,
  FaTicketAlt,
  FaCalendarAlt,
  FaPlus,
  FaSearch,
  FaChevronDown,
} from "react-icons/fa";
import { toast } from "react-toastify";            // se ainda não estiver
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import saveAs from "file-saver";
import CirculoEstado from "./CirculoEstado";
import { epocaAtualHoje, epocaDeData } from "@/utils/epocas";
import viagogoLogo from "./assets/viagogo.svg";



// ---- estilos base para botões (pílula) ----
const BTN_BASE =
  "inline-flex items-center gap-1.5 md:gap-1 px-4 md:px-3 py-2 md:py-1.5 rounded-xl font-semibold shadow-md " +
  "transition focus:outline-none focus:ring-2 focus:ring-offset-2 " +
  "active:translate-y-[1px]";

const BTN_VARIANTS = {
  blue:   "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-400",
  green:  "bg-green-600 hover:bg-green-700 text-white focus:ring-green-400",
  gray:   "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-400",
  slate:  // neutro para summaries (Época)
    "bg-slate-600 hover:bg-slate-700 text-white focus:ring-slate-400",
  outline:
    "bg-transparent border border-gray-300 text-gray-800 hover:bg-gray-50 " +
    "dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800 focus:ring-gray-400",
};









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

  // 🔽🔽🔽 limpa ruído comercial / nomes de bancada que não fazem parte do setor
  s = s.replace(/\bmais\s+vantagens\b/gi, "");
  s = s.replace(/\bemirates\b/gi, "");
  s = s.replace(/\b(continente|worten|fnac|loja|online|site)\b/gi, "");
  s = s.replace(/\s*-+\s*$/g, "").trim();   // remove " - " no fim
  s = s.replace(/\s{2,}/g, " ");            // colapsa espaços repetidos
  // 🔼🔼🔼
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
// 👉 SUBSTITUI a tua compraChave por esta

 

const setorGrupo = (txt = "") => {
  let s = limpar(txt);

  s = s.replace(/\([^)]*\)\s*$/g, "").trim();
  s = s.split(",")[0].split(" - ")[0].split(";")[0].trim();
  s = s.replace(/\b(Fila|Row|Gate|Porta|Entrada|Door|Seat|Lugar)\b.*$/i, "").trim();

  // normalizações conhecidas
  s = s.replace(/\bmais\s+vantagens\b/gi, "");
  s = s.replace(/\bemirates\b/gi, "");
  s = s.replace(/\b(continente|worten|fnac|loja|online|site)\b/gi, "");
  s = s.replace(/\s{2,}/g, " ").trim();

  // pisos canónicos
  s = s.replace(/\b(piso\s*zero|piso\s*0|p0)\b/gi, "Lower");
  s = s.replace(/\b(middle|piso\s*1|piso\s*um|piso\s*primeiro|p1)\b/gi, "Middle");
  s = s.replace(/\b(upper|piso\s*3|piso\s*tr[eê]s|p3)\b/gi, "Upper");

  // section/setor/etc
  s = s.replace(/\b(section|sect(?:ion)?|sec(?:ção|cao|cç?ao)?|sector|setor)\b/gi, "Setor");
  s = s.replace(/\bSetor\s+(Lower|Middle|Upper)\b/gi, "$1");

  s = s.replace(/\s{2,}/g, " ").trim();

  if (!s) return "Outros";

  // Se começar por Lower/Middle/Upper/Setor/Block/etc, o grupo é a família
  const famMatch = s.match(/^(Lower|Middle|Upper|Setor|Block|Stand|Tribuna|Ring|Level|Nascente|Poente|Norte|Sul)\b/i);
  if (famMatch) return canonFamilia(famMatch[1]);

  // Caso tipo "Meltino 2" => grupo "Meltino"
  const primeiroToken = s.match(/^([A-Za-zÀ-ÿ]+)\b/);
  if (primeiroToken) return canonFamilia(primeiroToken[1]);

  return s;
};

const vendaChaveExata = (v = {}) => setorExato(v.estadio);

const ALIASES_EQUIPAS_CASA = {
  "casa pia": "Casa Pia",
  "casa pia ac": "Casa Pia",
  "casa pia a.c.": "Casa Pia",
  "casa pia atletico clube": "Casa Pia",
  "casa pia atlético clube": "Casa Pia",

  "az": "AZ Alkmaar",
  "az alkmaar": "AZ Alkmaar",

  "sl benfica": "SL Benfica",
  "benfica": "SL Benfica",

  "sporting": "Sporting CP",
  "sporting cp": "Sporting CP",

  "fc porto": "FC Porto",
  "porto": "FC Porto",
};

const normalizarNomeEquipa = (s = "") =>
  limpar(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // remove acentos
    .replace(/[.\-_/]/g, " ")          // troca pontuação por espaço
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const extrairEquipaCasaRaw = (evento = "") => {
  const s = limpar(evento);
  const partes = s.split(/\bvs\b/i).map(p => limpar(p)).filter(Boolean);
  return partes[0] || s;
};

const getEquipaCasaCanonica = (evento = "") => {
  const raw = extrairEquipaCasaRaw(evento);
  const norm = normalizarNomeEquipa(raw);

  if (ALIASES_EQUIPAS_CASA[norm]) {
    return ALIASES_EQUIPAS_CASA[norm];
  }

  // fallback inteligente: tenta encontrar alias contido no nome
  const match = Object.entries(ALIASES_EQUIPAS_CASA).find(([alias]) => {
    return norm === alias || norm.includes(alias) || alias.includes(norm);
  });

  return match ? match[1] : raw;
};

const REGRAS_SETOR_OPERACIONAL = {
  default: {
    numerosParaLabel: {},
    aliasesTexto: {
      "bancada nascente": "Nascente",
      "nascente": "Nascente",
      "bancada poente": "Poente",
      "poente": "Poente",
      "bancada norte": "Norte",
      "norte": "Norte",
      "bancada sul": "Sul",
      "sul": "Sul",
    },
  },

  "Casa Pia": {
    numerosParaLabel: {
      "2": "Meltino 2",
      "3": "Meltino 3",
      "4": "Meltino 4",
      "5": "Valhala 5",
      "6": "Valhala 6",
      "7": "Valhala 7",
      "8": "Dominos 8",
      "9": "Dominos 9",
      "10": "Dominos 10",
      "11": "Dominos 11",
    },
    aliasesTexto: {
      "bancada nascente": "Nascente",
      "nascente": "Nascente",
      "bancada poente": "Poente",
      "poente": "Poente",
      "bancada norte": "Norte",
      "norte": "Norte",
      "bancada sul": "Sul",
      "sul": "Sul",

      "meltino 2": "Meltino 2",
      "meltino 3": "Meltino 3",
      "meltino 4": "Meltino 4",
      "val hala 5": "Valhala 5",
      "valhala 5": "Valhala 5",
      "val hala 6": "Valhala 6",
      "valhala 6": "Valhala 6",
      "val hala 7": "Valhala 7",
      "valhala 7": "Valhala 7",
      "dominos 8": "Dominos 8",
      "dominos 9": "Dominos 9",
      "dominos 10": "Dominos 10",
      "dominos 11": "Dominos 11",
      "bancada meltino café": "Bancada Meltino Café",
      "meltino café": "Bancada Meltino Café",
    },
  },
};

const REGRAS_COBERTURA_UNIDIRECIONAL = {
  "Casa Pia": {
    "Bancada Meltino Café": ["Meltino 2", "Meltino 3", "Meltino 4"],
    "Bancada Valhala Café": ["Valhala 5", "Valhala 6", "Valhala 7"],
  },
};

const getRegrasOperacionais = (estadioNome = "") => {
  const nome = limpar(estadioNome || "");
  const especifica = REGRAS_SETOR_OPERACIONAL[nome] || {};

  return {
    numerosParaLabel: {
      ...(REGRAS_SETOR_OPERACIONAL.default?.numerosParaLabel || {}),
      ...(especifica.numerosParaLabel || {}),
    },
    aliasesTexto: {
      ...(REGRAS_SETOR_OPERACIONAL.default?.aliasesTexto || {}),
      ...(especifica.aliasesTexto || {}),
    },
  };
};

const getRegrasCobertura = (chaveRegra = "") => {
  const nome = limpar(chaveRegra || "").toLowerCase();

  const entrada = Object.entries(REGRAS_COBERTURA_UNIDIRECIONAL).find(([key]) => {
    return limpar(key).toLowerCase() === nome;
  });

  return entrada ? entrada[1] : {};
};
const chaveOperacionalExata = (txt = "", estadioNome = "") => {
  const regras = getRegrasOperacionais(estadioNome);
  const bruto = limpar(txt).toLowerCase();

  // 1) alias textual direto
  for (const [alias, canonical] of Object.entries(regras.aliasesTexto || {})) {
    if (bruto.includes(alias)) return canonical;
  }

  // 2) normalização base
  const exato = setorExato(txt).replace(/^Setor\s+/i, "").trim();
  const exatoLower = exato.toLowerCase();

  for (const [alias, canonical] of Object.entries(regras.aliasesTexto || {})) {
    if (exatoLower === alias || exatoLower.includes(alias)) return canonical;
  }

  // 3) se for só número, converte pelo mapa do estádio
  const mNumeroPuro = exato.match(/^(\d{1,2})$/);
  if (mNumeroPuro) {
    return regras.numerosParaLabel?.[mNumeroPuro[1]] || exato;
  }

  // 4) se terminar em número, tenta também
  const mNumeroFinal = exato.match(/(\d{1,2})$/);
  if (mNumeroFinal) {
    const canon = regras.numerosParaLabel?.[mNumeroFinal[1]];
    if (canon) return canon;
  }

  return exato || "Outros";
};

const vendaChaveOperacionalExata = (v = {}, estadioNome = "") =>
  chaveOperacionalExata(v.estadio, estadioNome);

const compraChaveOperacionalExata = (c = {}, estadioNome = "") => {
  const setor = limpar(c.setor);
  const bancada = limpar(c.bancada);

  if (setor && setor !== "-" && setor.toLowerCase() !== "null") {
    return chaveOperacionalExata(setor, estadioNome);
  }

  if (bancada) {
    return chaveOperacionalExata(bancada, estadioNome);
  }

  return "Outros";
};

const vendaChaveGrupo = (v = {}) => setorGrupo(v.estadio);

const compraChaveExata = (c = {}) => {
  const partes = [c.bancada, c.setor].filter(Boolean).join(" ");
  const key = setorExato(partes).replace(/^Setor\s+/i, "").trim();
  return key || "Outro";
};

const compraChaveGrupo = (c = {}) => {
  const partes = [c.bancada, c.setor].filter(Boolean).join(" ");
  const key = setorGrupo(partes).replace(/^Setor\s+/i, "").trim();
  return key || "Outro";
};

const compraChave = (c = {}) => compraChaveExata(c);

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


function parseDataPt(input) {
  if (!input) return null;
  const s = String(input).trim();

  // bate certo mesmo que venha "YYYY-MM-DDTHH:mm:ss..."
  const mIso = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (mIso) {
    const [y, m, d] = mIso[1].split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  const s2 = s.replaceAll("/", "-");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s2)) {
    const [y, m, d] = s2.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  const mPt = s2.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (mPt) {
    const [_, dd, mm, yyyy] = mPt.map(Number);
    return new Date(yyyy, mm - 1, dd);
  }

  return null;
}

const getTotaisBilhetesEvento = (evento, data_evento, vendas = [], compras = []) => {
  const totalVendas = (vendas || [])
    .filter(v => v.evento === evento && v.data_evento === data_evento)
    .reduce((acc, v) => {
      if (setorExato(v.estadio) === "Devolução") return acc;
      return acc + (qtdBilhetes(v.estadio) || 0);
    }, 0);

  const totalCompras = (compras || [])
    .filter(c => c.evento === evento && c.data_evento === data_evento)
    .reduce((acc, c) => acc + (Number(c.quantidade) || 0), 0);

  const saldo = totalCompras - totalVendas;

  return {
    totalCompras,
    totalVendas,
    saldo,
  };
};

const getBadgeBilhetesMeta = (saldo) => {
  if (saldo > 0) {
    return {
      valor: saldo,
      title: `${saldo} bilhete${saldo === 1 ? "" : "s"} por vender`,
      className:
        "bg-emerald-900/85 text-white border border-emerald-700/80",
    };
  }

  if (saldo < 0) {
    const abs = Math.abs(saldo);
    return {
      valor: abs,
      title: `${abs} bilhete${abs === 1 ? "" : "s"} por comprar`,
      className:
        "bg-red-900/85 text-white border border-red-700/80",
    };
  }

  return {
    valor: 0,
    title: "Equilíbrio total",
    className:
      "bg-slate-700/90 text-white border border-slate-500/80",
  };
};

// ——— Normaliza URL para garantir https:// ———
function normalizeUrl(s) {
  const v = String(s || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return "https://" + v;
}


function formatarDataPt(dstr) {
  const d = parseDataPt(dstr);
  return d ? d.toLocaleDateString("pt-PT") : (dstr || "");
}
function toInputDate(dstr) {
  const d = parseDataPt(dstr);
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}


function epocaDoRegisto(r) {
  const d = parseDataPt(r?.data_evento);
  if (!d || isNaN(d.getTime())) return null;
  return epocaDeData(d);
}

// 🔼 logo após os imports/utilitários

function normalizarEpoca(s = "") {
  const m1 = String(s).match(/^(\d{4})\/(\d{4})$/);      // 2023/2024
  if (m1) return `${m1[1]}/${m1[2]}`;

  const m2 = String(s).match(/^(\d{4})\/(\d{2})$/);      // 2023/24 -> 2023/2024
  if (m2) return `${m2[1]}/${Number(m2[1]) + 1}`;

  return s;
}

function listarEpocasFixas({ inicio = 2020, incluirProxima = true } = {}) {
  const yAtual = parseInt(String(epocaAtualHoje()).slice(0, 4), 10);
  const yFim = incluirProxima ? yAtual + 1 : yAtual; // inclui a próxima época também
  const arr = [];
  for (let y = inicio; y <= yFim; y++) {
    arr.push(`${y}/${y + 1}`);
  }
  return arr.reverse(); // mais recentes primeiro
}



export default function Eventos() {
  const [registos, setRegistos] = useState([]);
  const [mostrarEstadioId, setMostrarEstadioId] = useState(null);
  const [estadioTmp, setEstadioTmp] = useState("");
  const [urlEventoTmp, setUrlEventoTmp] = useState("");
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
  const ready = vendas.length > 0 && compras.length > 0;
  const [vendasNaoAssociadasSet, setVendasNaoAssociadasSet] = useState(new Set());
  const [comprasNaoAssociadasSet, setComprasNaoAssociadasSet] = useState(new Set());
  const [mesesExpandidos, setMesesExpandidos] = useState({});
  const [mostrarModalNovaCompra, setMostrarModalNovaCompra] = useState(false);
  const [mostrarModalNovaVenda, setMostrarModalNovaVenda] = useState(false);
  const [novaVendaEvento, setNovaVendaEvento] = useState({
    id_venda: "",
    data_venda: new Date().toISOString().split("T")[0],
    data_evento: "",
    evento: "",
    estadio: "",
    ganho: "",
    estado: "Por entregar",
  });
  
  const [datasEventoVendasModal, setDatasEventoVendasModal] = useState([]);
  const [idVendaModalEmUso, setIdVendaModalEmUso] = useState(false);
  const [idVendaModalEmVerificacao, setIdVendaModalEmVerificacao] = useState(false);
  const getProximoIdVendaDisponivel = () => {
    const idsExistentes = (vendas || [])
      .map((v) => Number(v.id_venda))
      .filter((n) => Number.isFinite(n) && n > 0);
  
    if (idsExistentes.length === 0) return "1";
  
    const idsSet = new Set(idsExistentes);
    let candidato = 1;
  
    while (idsSet.has(candidato)) {
      candidato += 1;
    }
  
    return String(candidato);
  };
  const abrirModalNovaVenda = async (eventoItem) => {
    const dataEvento = String(eventoItem.data_evento || "").slice(0, 10);
    const proximoId = getProximoIdVendaDisponivel();
  
    setNovaVendaEvento({
      id_venda: proximoId,
      data_venda: new Date().toISOString().split("T")[0],
      data_evento: dataEvento,
      evento: eventoItem.evento || "",
      estadio: "",
      ganho: "",
      estado: "Por entregar",
    });
  
    setIdVendaModalEmUso(false);
    setIdVendaModalEmVerificacao(false);
  
    if (eventoItem.evento) {
      await buscarDatasEventoVendasModal(eventoItem.evento);
    } else {
      setDatasEventoVendasModal([]);
    }
  
    setMostrarModalNovaVenda(true);
  };
  const buscarDatasEventoVendasModal = async (nomeEvento) => {
    if (!nomeEvento) {
      setDatasEventoVendasModal([]);
      return;
    }
  
    try {
      const res = await fetch(
        `https://controlo-bilhetes.onrender.com/datas_evento/${encodeURIComponent(nomeEvento)}`
      );
      const data = await res.json();
      setDatasEventoVendasModal(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar datas do evento:", error);
      setDatasEventoVendasModal([]);
    }
  };
  const verificarIdVendaModal = (valor) => {
    const idLimpo = String(valor || "").trim();
  
    if (!idLimpo) {
      setIdVendaModalEmUso(false);
      setIdVendaModalEmVerificacao(false);
      return;
    }
  
    setIdVendaModalEmVerificacao(true);
  
    const existe = vendas.some(
      (v) => String(v.id_venda || "").trim() === idLimpo
    );
  
    setIdVendaModalEmUso(existe);
    setIdVendaModalEmVerificacao(false);
  };
  const handleNovaVendaEventoChange = async (e) => {
    const { name, value } = e.target;
  
    if (name === "id_venda") {
      setNovaVendaEvento((prev) => ({ ...prev, id_venda: value }));
      verificarIdVendaModal(value);
      return;
    }
  
    if (name === "evento") {
      setNovaVendaEvento((prev) => ({
        ...prev,
        evento: value,
        data_evento: "",
      }));
      await buscarDatasEventoVendasModal(value);
      return;
    }
  
    setNovaVendaEvento((prev) => ({ ...prev, [name]: value }));
  };
  const guardarNovaVendaNoEvento = async () => {
    const camposObrigatorios = {
      id_venda: "ID Venda",
      data_venda: "Data Venda",
      data_evento: "Data Evento",
      evento: "Evento",
      estadio: "Bilhete",
      ganho: "Ganho (€)",
    };
  
    for (const campo in camposObrigatorios) {
      if (!novaVendaEvento[campo] || String(novaVendaEvento[campo]).trim() === "") {
        toast.error(`Preencher campo ${camposObrigatorios[campo]}`);
        return;
      }
    }
  
    if (idVendaModalEmUso) {
      toast.error("Este ID já existe.");
      return;
    }
  
    try {
      const res = await fetch("https://controlo-bilhetes.onrender.com/listagem_vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...novaVendaEvento,
          id_venda: parseInt(novaVendaEvento.id_venda),
          ganho: parseFloat(String(novaVendaEvento.ganho).replace(",", ".")),
          data_venda: String(novaVendaEvento.data_venda || "").slice(0, 10),
          data_evento: String(novaVendaEvento.data_evento || "").slice(0, 10),
        }),
      });
  
      if (!res.ok) {
        throw new Error("Erro ao guardar venda");
      }
  
      const vendaCriada = await res.json();

      const vendaNormalizada = {
        ...vendaCriada,
        data_venda: String(vendaCriada.data_venda || "").slice(0, 10),
        data_evento: String(vendaCriada.data_evento || "").slice(0, 10),
      };
      
      setVendas(prev => {
        const next = [...prev, vendaNormalizada];
      
        atualizarTotaisEventoLocal(
          vendaNormalizada.evento,
          vendaNormalizada.data_evento,
          next,
          compras
        );
      
        return next;
      });
      
      await buscarResumoMensal();
  
      setNovaVendaEvento({
        id_venda: "",
        data_venda: new Date().toISOString().split("T")[0],
        data_evento: "",
        evento: "",
        estadio: "",
        ganho: "",
        estado: "Por entregar",
      });
  
      setDatasEventoVendasModal([]);
      setIdVendaModalEmUso(false);
      setIdVendaModalEmVerificacao(false);
      setMostrarModalNovaVenda(false);
  
      toast.success("Venda adicionada com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar venda.");
    }
  };
  const [novaCompraEvento, setNovaCompraEvento] = useState({
    evento: "",
    data_evento: "",
    local_compras: "",
    bancada: "",
    setor: "",
    fila: "",
    quantidade: "",
    gasto: "",
  });
  
  const locaisCompra = [
    "Benfica Viagens",
    "Site Benfica",
    "Site Clube",
    "Odisseias",
    "Continente",
    "Site clube adversário",
    "Smartfans",
    "Outro",
    "Viagogo",
    "Stubhub",
    "Facebook"
  ];
  
  const bancadas = ["Emirates", "BTV", "Sagres", "Mais vantagens"];
  
  const setores = [
    ...Array.from({ length: 32 }, (_, i) => "lower " + (i + 1)),
    ...Array.from({ length: 43 }, (_, i) => "middle " + (i + 1)),
    ...Array.from({ length: 44 }, (_, i) => "upper " + (i + 1))
  ];
  
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
  
  const abrirModalNovaCompra = (eventoItem) => {
    setNovaCompraEvento({
      evento: eventoItem.evento || "",
      data_evento: (eventoItem.data_evento || "").split("T")[0],
      local_compras: "",
      bancada: "",
      setor: "",
      fila: "",
      quantidade: "",
      gasto: "",
    });
  
    setMostrarModalNovaCompra(true);
  };
  
  const guardarNovaCompraNoEvento = async () => {
    const camposObrigatorios = {
      evento: "Evento",
      data_evento: "Data do Evento",
      gasto: "Gasto (€)",
      quantidade: "Quantidade",
    };
  
    for (const campo in camposObrigatorios) {
      if (!novaCompraEvento[campo] || novaCompraEvento[campo].toString().trim() === "") {
        toast.error(`Preencher campo ${camposObrigatorios[campo]}`, {
          toastId: `erro-evento-${campo}`,
        });
        return;
      }
    }
  
    try {
      const response = await fetch("https://controlo-bilhetes.onrender.com/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...novaCompraEvento,
          quantidade: parseInt(novaCompraEvento.quantidade),
          gasto: parseFloat(String(novaCompraEvento.gasto).replace(",", ".")),
        }),
      });
  
      if (!response.ok) {
        throw new Error("Erro ao guardar compra");
      }
  
      const compraCriada = await response.json();

      const compraNormalizada = {
        ...compraCriada,
        data_evento: String(compraCriada.data_evento || "").slice(0, 10),
      };
      
      setCompras((prev) => {
        const next = [...prev, compraNormalizada];
      
        atualizarTotaisEventoLocal(
          compraNormalizada.evento,
          compraNormalizada.data_evento,
          vendas,
          next
        );
      
        return next;
      });
      
      await buscarResumoMensal();
      
      toast.success("Compra guardada com sucesso!");
  
      setNovaCompraEvento({
        evento: "",
        data_evento: "",
        local_compras: "",
        bancada: "",
        setor: "",
        fila: "",
        quantidade: "",
        gasto: "",
      });
  
      setMostrarModalNovaCompra(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao guardar a compra");
    }
  };

  const toggleMesExpandido = (mes) => {
    setMesesExpandidos((prev) => ({
      ...prev,
      [mes]: !prev[mes],
    }));
  };
  const reqIdRef = useRef(0);
  const abortRef = useRef(null);
  const isCompact = typeof window !== "undefined"
    ? window.matchMedia("(max-width: 1024px)").matches
    : false;


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

// estado + refs (no topo do componente)
const [epocaAberta, setEpocaAberta] = useState(false);
const epocaRef = useRef(null);

// fecha ao clicar fora e ao carregar Esc
useEffect(() => {
  const onDown = (e) => {
    if (epocaRef.current && !epocaRef.current.contains(e.target)) {
      setEpocaAberta(false);
    }
  };
  const onKey = (e) => {
    if (e.key === "Escape") setEpocaAberta(false);
  };
  document.addEventListener("mousedown", onDown);
  document.addEventListener("keydown", onKey);
  return () => {
    document.removeEventListener("mousedown", onDown);
    document.removeEventListener("keydown", onKey);
  };
}, []);
  


  // Filtro por Época
// ▼ SUBSTITUI APENAS ESTA PARTE
const [epocaSelecionada, setEpocaSelecionada] = useState(() => {
  const saved = localStorage.getItem("eventos_epoca");
  const atual = epocaAtualHoje();

  if (!saved) return atual;
  const norm = normalizarEpoca(saved);

  // se estava “Todas” ou inválido, usa a atual
  if (!norm || norm === "Todas") return atual;

  // se a época guardada é mais antiga do que a atual, avança para a atual
  const ySaved = parseInt(norm.slice(0, 4), 10);
  const yAtual = parseInt(atual.slice(0, 4), 10);
  return ySaved < yAtual ? atual : norm;
});


useEffect(() => {
  localStorage.setItem("eventos_epoca", epocaSelecionada);
}, [epocaSelecionada]);

// 👉 reinicia paginação quando muda a época
useEffect(() => {
  setRegistos([]);
  setSkip(0);
  setHasMore(true);
}, [epocaSelecionada]);

// ✅ aborta pedidos pendentes quando muda a época (e também no unmount)
useEffect(() => {
  return () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null; // opcional
    }
  };
}, [epocaSelecionada]);




  
  
const opcoesEpoca = useMemo(() => {
  // base fixa (garante 2023/2024, 2024/2025, 2025/2026, …)
  const baseFixas = listarEpocasFixas({ inicio: 2023, incluirProxima: true });

  // acrescenta épocas que existam nos registos (se houver)
  const deDados = Array.from(new Set(
    (registos || [])
      .map(r => normalizarEpoca(epocaDoRegisto(r)))
      .filter(Boolean)
  ));

  // junta tudo, com "Todas" no topo
  const set = new Set(["Todas", ...baseFixas, ...deDados]);

  // ordena: "Todas" primeiro, restante desc por ano inicial
  return Array.from(set).sort((a, b) => {
    if (a === "Todas") return -1;
    if (b === "Todas") return 1;
    const ay = parseInt(String(a).slice(0, 4), 10);
    const by = parseInt(String(b).slice(0, 4), 10);
    return by - ay;
  });
}, [registos]);





// Helper local para filtrar pela época selecionada
const matchesEpoca = (r) => {
  if (epocaSelecionada === "Todas") return true;
  const eR = normalizarEpoca(epocaDoRegisto(r));
  const eSel = normalizarEpoca(epocaSelecionada);
  return eR === eSel;
};



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
  if (!ready) return;                     // 👈 só depois de compras+vendas carregarem
  if (epocaSelecionada === "Todas") return;
  if (registos.some(matchesEpoca)) return; // já tens algo dessa época visível
  if (!isLoading && hasMore) setSkip(s => s + limit); // puxa mais páginas
}, [registos, epocaSelecionada, isLoading, hasMore, limit]);


  

  useEffect(() => {
    const carregarDados = async () => {
      await buscarVendas();
      await buscarCompras();
    };
    carregarDados();
  }, []);

  useEffect(() => {
  if (!ready) return;
  setRegistos([]);
  setSkip(0);
  setHasMore(true);
}, [ready]);

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
  if (!ready) return;
  buscarEventos();
}, [skip, epocaSelecionada]); // 👈 adiciona aqui



// Regras aprendidas/persistidas por estádio
const [stadiumRules, setStadiumRules] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("stadium_rules_v1") || "{}");
  } catch { return {}; }
});

// Persistir sempre que mudar
useEffect(() => {
  localStorage.setItem("stadium_rules_v1", JSON.stringify(stadiumRules));
}, [stadiumRules]);

// ====== Regras base por estádio (fallback) ======
const STADIUM_RULES = {
  default: {
    // Bancadas "genéricas" que tratamos como buckets (podem existir ou não por estádio)
    genericBancadas: ["Nascente", "Poente", "Norte", "Sul"],
    // Mapeamentos conhecidos de letra -> bancada (vêm vazios por defeito; vamos aprendendo)
    lettersToBancada: {}
  }
};

// ====== Parse genérico de local/setor ======
function parseLocal(txt = "") {
  const s = limpar(txt);
  if (!s) return { bancada: null, letra: null, familia: null };

  // deteta bancada
  const bancadaMatch = s.match(/\b(Nascente|Poente|Norte|Sul)\b/i);
  const bancada = bancadaMatch ? canonFamilia(bancadaMatch[1]) : null;

  // deteta letra de setor: um token com 1-2 letras A-Z (evita "SC" de "SCP" porque exige palavra isolada)
  const letraMatch = s.match(/(?:^|\s)([A-ZÇ]{1,2})(?:\s|$)/i);
  let letra = letraMatch ? letraMatch[1].toUpperCase() : null;

  // família (Lower/Middle/Upper/Setor/Block/etc.) só para referência
  const familiaMatch = s.match(/^(Lower|Middle|Upper|Setor|Block|Stand|Tribuna|Ring|Level|Nascente|Poente|Norte|Sul)\b/i);
  const familia = familiaMatch ? canonFamilia(familiaMatch[1]) : null;

  // higiene: ignora letras claramente não-setor (ex.: "SC", "FC", "CP", etc.) se tiver bancada já presente
  if (bancada && letra && /^(SC|FC|CP|SL|UD|GD|CD|CF)$/i.test(letra)) letra = null;

  return { bancada, letra, familia };
}  
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


// Junta letra->bancada se ainda não existir (evita flapping)
const addMapSafe = (dict, letra, bancada) => {
  if (!letra || !bancada) return;
  if (dict[letra] && dict[letra] !== bancada) return;
  dict[letra] = bancada;
};

// Aprende a partir de um evento específico
const inferRulesFromEvent = (evento, data_evento) => {
  const lettersToBancada = {};

  // compras
  for (const c of compras) {
    if (c.evento !== evento || c.data_evento !== data_evento) continue;
    const loc = parseLocal([c.bancada, c.setor].filter(Boolean).join(" "));
    if (loc.letra && loc.bancada) addMapSafe(lettersToBancada, loc.letra, loc.bancada);
  }
  // vendas
  const arr = idxVendasPorEvento.get(`${evento}|${data_evento}`) || [];
  for (const v of arr) {
    const loc = parseLocal(v.estadio);
    if (loc.letra && loc.bancada) addMapSafe(lettersToBancada, loc.letra, loc.bancada);
  }

  return { lettersToBancada };
};

// Aprende de todos os eventos carregados (varre registos)
const inferRulesFromAll = () => {
  const byStadium = {}; // nomeEstadio -> { lettersToBancada: {} }
  for (const r of registos) {
    const estadioNome = (r.estadio || "").trim();
    if (!estadioNome) continue;
    const learned = inferRulesFromEvent(r.evento, r.data_evento);
    if (!byStadium[estadioNome]) byStadium[estadioNome] = { lettersToBancada: {} };
    Object.entries(learned.lettersToBancada).forEach(([L, B]) => addMapSafe(byStadium[estadioNome].lettersToBancada, L, B));
  }
  return byStadium;
};

// Sempre que compras/vendas/registos mudam, funde o que foi aprendido
useEffect(() => {
  if (!registos.length) return;
  const learned = inferRulesFromAll();
  setStadiumRules(prev => {
    const next = { ...prev };
    for (const [est, obj] of Object.entries(learned)) {
      if (!next[est]) next[est] = { lettersToBancada: {} };
      for (const [L, B] of Object.entries(obj.lettersToBancada || {})) {
        if (!next[est].lettersToBancada[L]) next[est].lettersToBancada[L] = B;
      }
    }
    return next;
  });
}, [compras, vendas, registos]);

const getRulesForStadium = (estadioTxt = "", evento = "", data_evento = "") => {
  const base = STADIUM_RULES.default;
  const nome = (estadioTxt || "").trim();

  // Persistido
  const persisted = stadiumRules[nome] || { lettersToBancada: {} };
  // Inferido “on the fly” só com dados daquele evento
  const inferred = inferRulesFromEvent(evento, data_evento);

  return {
    genericBancadas: base.genericBancadas,
    lettersToBancada: {
      ...base.lettersToBancada,
      ...(persisted.lettersToBancada || {}),
      ...(inferred.lettersToBancada || {}),
    },
  };
};
  
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

const mapVendasPorSetorExato = (evento, data_evento, estadioNome = "") => {
  const arr = idxVendasPorEvento.get(`${evento}|${data_evento}`) || [];
  const map = new Map();

  for (const v of arr) {
    const key = vendaChaveOperacionalExata(v, estadioNome);
    if (key === "Devolução") continue;

    const qtd = qtdBilhetes(v.estadio) || 0;
    if (!qtd) continue;

    map.set(key, (map.get(key) || 0) + qtd);
  }

  return map;
};

const mapComprasPorSetorExato = (evento, data_evento, estadioNome = "") => {
  const arr = compras.filter(c => c.evento === evento && c.data_evento === data_evento);
  const map = new Map();

  for (const c of arr) {
    const key = compraChaveOperacionalExata(c, estadioNome);
    const qtd = Number(c.quantidade || 0);
    if (!qtd) continue;

    map.set(key, (map.get(key) || 0) + qtd);
  }

  return map;
};

const mapVendasPorGrupo = (evento, data_evento) => {
  const arr = idxVendasPorEvento.get(`${evento}|${data_evento}`) || [];
  const map = new Map();

  for (const v of arr) {
    const key = vendaChaveGrupo(v).replace(/^Setor\s+/i, "").trim();
    if (key === "Devolução") continue;

    const qtd = qtdBilhetes(v.estadio) || 0;
    if (!qtd) continue;

    map.set(key, (map.get(key) || 0) + qtd);
  }
  return map;
};

const mapComprasPorGrupo = (evento, data_evento) => {
  const arr = compras.filter(c => c.evento === evento && c.data_evento === data_evento);
  const map = new Map();

  for (const c of arr) {
    const key = compraChaveGrupo(c);
    const qtd = Number(c.quantidade || 0);
    if (!qtd) continue;

    map.set(key, (map.get(key) || 0) + qtd);
  }
  return map;
};

const getResumoMatchingInteligente = (evento, data_evento, chaveRegra = "") => {
  const vendasExatas = mapVendasPorSetorExato(evento, data_evento, chaveRegra);
  const comprasExatas = mapComprasPorSetorExato(evento, data_evento, chaveRegra);
  const regrasCobertura = getRegrasCobertura(chaveRegra);

  // cópias mutáveis
  const faltas = new Map();
  const sobras = new Map();

  const chavesExatas = new Set([
    ...vendasExatas.keys(),
    ...comprasExatas.keys(),
  ]);

  // 1) match exato primeiro
  for (const key of chavesExatas) {
    const qV = vendasExatas.get(key) || 0;
    const qC = comprasExatas.get(key) || 0;

    if (qV > qC) faltas.set(key, qV - qC);
    if (qC > qV) sobras.set(key, qC - qV);
  }

  // 2) cobertura unidirecional:
  // sobras específicas podem cobrir faltas genéricas permitidas
  for (const [alvoGenerico, origens] of Object.entries(regrasCobertura)) {
    let falta = faltas.get(alvoGenerico) || 0;
    if (!falta) continue;

    for (const origem of origens) {
      const sobra = sobras.get(origem) || 0;
      if (!sobra || !falta) continue;

      const uso = Math.min(falta, sobra);

      falta -= uso;
      const sobraRestante = sobra - uso;

      if (sobraRestante > 0) sobras.set(origem, sobraRestante);
      else sobras.delete(origem);
    }

    if (falta > 0) faltas.set(alvoGenerico, falta);
    else faltas.delete(alvoGenerico);
  }

  const porComprar = [...faltas.entries()];
  const porVender = [...sobras.entries()];

  const fmt = (arr) =>
    arr
      .sort((a, b) => a[0].localeCompare(b[0], "pt", { numeric: true, sensitivity: "base" }))
      .map(([k, q]) => `${k} (${q})`)
      .join(" • ");

  return {
    porComprar,
    porVender,
    coberturaIncerta: [],
    porComprarTxt: fmt(porComprar),
    porVenderTxt: fmt(porVender),
    coberturaIncertaTxt: "",
  };
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
const getResumoTituloVendas = (evento, data_evento, chaveRegra = "") => {
  const arr = idxVendasPorEvento.get(`${evento}|${data_evento}`) || [];
  if (!arr.length) return "";

  const mapa = new Map();

  for (const v of arr) {
    const chave = vendaChaveOperacionalExata(v, chaveRegra);
    if (chave === "Devolução") continue;

    const qtd = qtdBilhetes(v.estadio) || 0;
    mapa.set(chave, (mapa.get(chave) || 0) + qtd);
  }

  return [...mapa.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "pt", { sensitivity: "base", numeric: true }))
    .map(([setor, qtd]) => `${setor} (${qtd})`)
    .join(" • ");
};

const getResumoTituloCompras = (evento, data_evento, chaveRegra = "") => {
  const arr = compras.filter(
    c => c.evento === evento && c.data_evento === data_evento
  );
  if (!arr.length) return "";

  const mapa = new Map();

  for (const c of arr) {
    const chave = compraChaveOperacionalExata(c, chaveRegra);
    const qtd = Number(c.quantidade || 0);
    if (!qtd) continue;

    mapa.set(chave, (mapa.get(chave) || 0) + qtd);
  }

  return [...mapa.entries()]
    .sort((a, b) =>
      a[0].localeCompare(b[0], "pt", { sensitivity: "base", numeric: true })
    )
    .map(([setor, qtd]) => `${setor} (${qtd})`)
    .join(" • ");
};

// Lista ordenada de vendas do evento (por setor exato; depois pelo texto completo)
const getVendasOrdenadas = (evento, data_evento) => {
  const arr = [...(idxVendasPorEvento.get(`${evento}|${data_evento}`) || [])];
  const chaveRegra = getEquipaCasaCanonica(evento);

  return arr.sort((a, b) => {
    const ka = vendaChaveOperacionalExata(a, chaveRegra);
    const kb = vendaChaveOperacionalExata(b, chaveRegra);

    // ✅ Devolução sempre primeiro
    if (ka === "Devolução" && kb !== "Devolução") return -1;
    if (kb === "Devolução" && ka !== "Devolução") return 1;

    const p = ka.localeCompare(kb, "pt", {
      sensitivity: "base",
      numeric: true,
    });
    if (p !== 0) return p;

    return limpar(a.estadio).localeCompare(limpar(b.estadio), "pt", {
      sensitivity: "base",
      numeric: true,
    });
  });
};

  // Lista ordenada de compras do evento (por setor exato; depois bancada, setor, fila e id)
const getComprasOrdenadas = (evento, data_evento) => {
  const arr = compras.filter(c => c.evento === evento && c.data_evento === data_evento);
  const chaveRegra = getEquipaCasaCanonica(evento);

  return arr.sort((a, b) => {
    const ka = compraChaveOperacionalExata(a, chaveRegra);
    const kb = compraChaveOperacionalExata(b, chaveRegra);

    const p = ka.localeCompare(kb, "pt", {
      sensitivity: "base",
      numeric: true,
    });
    if (p !== 0) return p;

    const bancadaCmp = limpar(a.bancada).localeCompare(limpar(b.bancada), "pt", {
      sensitivity: "base",
      numeric: true,
    });
    if (bancadaCmp !== 0) return bancadaCmp;

    const setorCmp = limpar(a.setor).localeCompare(limpar(b.setor), "pt", {
      sensitivity: "base",
      numeric: true,
    });
    if (setorCmp !== 0) return setorCmp;

    const filaCmp = limpar(a.fila).localeCompare(limpar(b.fila), "pt", {
      sensitivity: "base",
      numeric: true,
    });
    if (filaCmp !== 0) return filaCmp;

    return (a.id || 0) - (b.id || 0);
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

// Constrói pools de compras por bancada e por letra
function buildCompraPools(evento, data_evento) {
  const pools = {}; // { [bancada]: { total: number, byLetter: { [L]: number } } }
  for (const c of compras) {
    if (c.evento !== evento || c.data_evento !== data_evento) continue;
    const qtd = Number(c.quantidade || 0);
    if (!qtd) continue;

    const loc = parseLocal([c.bancada, c.setor].filter(Boolean).join(" "));
    const b = loc.bancada || "Outros";
    if (!pools[b]) pools[b] = { total: 0, byLetter: {} };

    // se veio letra, guarda também por letra
    if (loc.letra) {
      pools[b].byLetter[loc.letra] = (pools[b].byLetter[loc.letra] || 0) + qtd;
    }
    // em qualquer dos casos, entra para o total dessa bancada
    pools[b].total += qtd;
  }
  return pools;
}

// Consome pools com vendas, respeitando letra->bancada (via regras)
function calcularSaldos(evento, data_evento, estadioNome) {
  const rules = getRulesForStadium(estadioNome, evento, data_evento);
  const pools = buildCompraPools(evento, data_evento);

  const deficits = {};
  const sobras   = {};

  const vendasArr = idxVendasPorEvento.get(`${evento}|${data_evento}`) || [];
  for (const v of vendasArr) {
    const q = qtdBilhetes(v.estadio) || 0;
    if (!q) continue;

    const loc = parseLocal(v.estadio);

    // Determina a bancada alvo
    let targetB = loc.bancada;
    if (!targetB && loc.letra) {
      targetB = rules.lettersToBancada[loc.letra] || null;
    }

    // 🔽🔽 Fallback: se não reconheceu, e só existe UMA bancada genérica com stock, usa essa
    if (!targetB) {
      const candidatos = Object.keys(pools)
        .filter(b => STADIUM_RULES.default.genericBancadas.includes(b) && pools[b]?.total > 0);
      if (candidatos.length === 1) targetB = candidatos[0];
    }
    // 🔼🔼

    // Se nem letra nem bancada reconhecida, ignora para consumo
    if (!targetB) continue;

    // Consome primeiro por letra (se existir), depois pelo total da bancada
    let rest = q;
    if (loc.letra && pools[targetB]?.byLetter?.[loc.letra] > 0) {
      const take = Math.min(rest, pools[targetB].byLetter[loc.letra]);
      pools[targetB].byLetter[loc.letra] -= take;
      pools[targetB].total -= take;
      rest -= take;
    }
    if (rest > 0 && pools[targetB]?.total > 0) {
      const take = Math.min(rest, pools[targetB].total);
      pools[targetB].total -= take;
      rest -= take;
    }
    if (rest > 0) {
      deficits[targetB] = (deficits[targetB] || 0) + rest;
    }
  }

  // Sobra por vender
  for (const [b, obj] of Object.entries(pools)) {
    if (obj.total > 0) sobras[b] = (sobras[b] || 0) + obj.total;
  }

  return { deficits, sobras };
}


// Helpers de resumo (strings) usando a lógica acima
function resumoPorVender(evento, data_evento, estadioNome) {
  const { sobras } = calcularSaldos(evento, data_evento, estadioNome);
  return Object.entries(sobras)
    .sort((a,b)=>a[0].localeCompare(b[0],"pt",{numeric:true,sensitivity:"base"}))
    .map(([k,v]) => `${k} (${v})`)
    .join(" • ");
}

function resumoPorComprar(evento, data_evento, estadioNome) {
  const { deficits } = calcularSaldos(evento, data_evento, estadioNome);
  return Object.entries(deficits)
    .sort((a,b)=>a[0].localeCompare(b[0],"pt",{numeric:true,sensitivity:"base"}))
    .map(([k,v]) => `${k} (${v})`)
    .join(" • ");
}




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
  
      setLucrosMensais(
        data.map(d => ({
          ...d,
          nr_eventos: Number(d.nr_eventos || 0),
          bilhetes_vendidos: Number(d.bilhetes_vendidos || 0),
          gasto: Number(d.gasto || 0),
          ganho: Number(d.ganho || 0),
          lucro: Number(d.lucro || 0),
          margem: Number(d.margem || 0),
          lucro_por_bilhete: Number(d.lucro_por_bilhete || 0),
        }))
      );
  
      setMostrarResumoDetalhado(true);
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

  function isMesAtual(mesStr) {
  try {
    const [mesNomeRaw, anoStr] = mesStr.trim().toLowerCase().split(" ");

    const meses = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];

    const mesIndex = meses.indexOf(mesNomeRaw);
    const ano = parseInt(anoStr, 10);

    if (mesIndex === -1 || isNaN(ano)) return false;

    const hoje = new Date();

    return (
      hoje.getFullYear() === ano &&
      hoje.getMonth() === mesIndex
    );
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

const imprimirVendasComNotaVermelha = (
  vendasDoEvento,
  {
    tituloEvento = "Vendas com Nota (bola vermelha)",
    cabecalhoResumo = "",
    linhaPorComprar = "",
    linhaPorVender = "",
    linhaCoberturaIncerta = "",
  } = {}
) => {
  if (!Array.isArray(vendasDoEvento)) vendasDoEvento = [];

  const selecionadas = vendasDoEvento.filter(v => isVermelho(v?.circulo_estado_venda));

  if (selecionadas.length === 0) {
    toast.info("Não há vendas com nota (bola vermelha) para imprimir.");
    return;
  }

  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const linhas = selecionadas.map(v => `
    <tr>
      <td>${esc(v.id_venda ?? v.id ?? "")}</td>
      <td>${esc((v.data_evento ?? "").toString().slice(0, 10))}</td>
      <td>${esc(v.evento ?? "")}</td>
      <td>${esc(v.estadio ?? "")}</td>
      <td>${esc(v.ganho ?? "")}</td>
      <td>${esc(v.estado ?? "")}</td>
      <td>${esc(v.nota_estado_venda ?? "")}</td>
    </tr>
  `).join("");

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${esc(tituloEvento)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; color: #111; }
          h1 { font-size: 18px; margin-bottom: 8px; }
          .resumo-bloco { margin-bottom: 14px; }
          .resumo-titulo { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
          .resumo-linha { font-size: 13px; margin: 3px 0; }
          .comprar { color: #c62828; font-weight: 700; }
          .vender { color: #0a8f2f; font-weight: 700; }
          .incerta { color: #b26a00; font-weight: 700; }

          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; vertical-align: top; }
          th { background: #f3f3f3; text-align: left; }

          @media print {
            @page { margin: 12mm; }
          }
        </style>
      </head>
      <body>
        <h1>${esc(tituloEvento)}</h1>

        ${
          cabecalhoResumo || linhaPorComprar || linhaPorVender || linhaCoberturaIncerta
            ? `
          <div class="resumo-bloco">
            ${cabecalhoResumo ? `<div class="resumo-titulo">${esc(cabecalhoResumo)}</div>` : ""}
            ${linhaPorComprar ? `<div class="resumo-linha comprar">🔴 ${esc(linhaPorComprar)}</div>` : ""}
            ${linhaCoberturaIncerta ? `<div class="resumo-linha incerta">🟡 ${esc(linhaCoberturaIncerta)}</div>` : ""}
            ${linhaPorVender ? `<div class="resumo-linha vender">🟢 ${esc(linhaPorVender)}</div>` : ""}
          </div>
        `
            : ""
        }

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
  if (!w) {
    toast.error("Popup bloqueado. Permite popups para imprimir.");
    return;
  }

  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
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
  if (isLoading || !hasMore) return;
  setIsLoading(true);

  const myReqId = ++reqIdRef.current;
  if (abortRef.current) abortRef.current.abort();
  const controller = new AbortController();
  abortRef.current = controller;

  try {
    const pageLimit = limit;

    const fetchPage = async (s) => {
      const res = await fetch(
        `https://controlo-bilhetes.onrender.com/eventos_completos2?skip=${s}&limit=${pageLimit}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    };

    let acumulados = [];
    let s = skip;
    let acabou = false;

    if (epocaSelecionada === "Todas") {
      const pagina0 = await fetchPage(s); // ← declara aqui
      if (controller.signal.aborted || myReqId !== reqIdRef.current) return;
      if (pagina0.length < pageLimit) setHasMore(false);
      acumulados = pagina0;
      // NÃO alterar skip aqui; o IntersectionObserver trata disso
    } else {
      // carrega páginas até compor uma página “limpa” da época selecionada
      while (acumulados.length < pageLimit && !acabou) {
        const pagina = await fetchPage(s);
        if (controller.signal.aborted || myReqId !== reqIdRef.current) return;
        if (!pagina.length) { setHasMore(false); break; }

        const filtrados = pagina.filter(matchesEpoca);
        acumulados = acumulados.concat(filtrados);

        s += pageLimit;
        if (pagina.length < pageLimit) { setHasMore(false); acabou = true; }
      }
    }

    if (controller.signal.aborted || myReqId !== reqIdRef.current) return;

    setRegistos(prev => {
      const vistos = new Set(prev.map(e => e.id));
      const novos = acumulados.filter(e => !vistos.has(e.id));
      const merged = [...prev, ...novos];

      const visiveis = epocaSelecionada === "Todas"
        ? merged
        : merged.filter(matchesEpoca);

      visiveis.sort((a, b) => {
        const da = parseDataPt(a.data_evento);
        const db = parseDataPt(b.data_evento);
        const diff = (da?.getTime() || 0) - (db?.getTime() || 0); // ASC
        return diff !== 0 ? diff : (a.id || 0) - (b.id || 0);
      });

      return visiveis;
    });

    // ⚠️ Não faças setSkip(s) aqui
  } catch (e) {
    if (e.name !== "AbortError") console.error("Erro ao carregar eventos:", e);
  } finally {
    if (myReqId === reqIdRef.current) setIsLoading(false);
  }
};






  const buscarVendas = async () => {
  const res = await fetch("https://controlo-bilhetes.onrender.com/listagem_vendas");
  if (res.ok) {
    const data = await res.json();
    setVendas(
      data.map(v => ({
        ...v,
        data_evento: String(v.data_evento || "").slice(0, 10),
      }))
    );
  }
};


  const buscarCompras = async () => {
  const res = await fetch("https://controlo-bilhetes.onrender.com/compras");
  if (res.ok) {
    const data = await res.json();
    setCompras(
      data.map(c => ({
        ...c,
        data_evento: String(c.data_evento || "").slice(0, 10),
      }))
    );
  }
};


  const atualizarCampo = (id, campo, valor) => {
    setRegistos(registos =>
      registos.map(r =>
        r.id === id ? { ...r, [campo]: valor } : r
      )
    );
  };

  const atualizarTotaisEventoLocal = (eventoNome, dataEvento, listaVendas, listaCompras) => {
  const ganhoTotal = (listaVendas || [])
    .filter(v =>
      String(v.evento || "") === String(eventoNome || "") &&
      String(v.data_evento || "").slice(0, 10) === String(dataEvento || "").slice(0, 10)
    )
    .reduce((acc, v) => acc + (parseFloat(v.ganho) || 0), 0);

  const gastoTotal = (listaCompras || [])
    .filter(c =>
      String(c.evento || "") === String(eventoNome || "") &&
      String(c.data_evento || "").slice(0, 10) === String(dataEvento || "").slice(0, 10)
    )
    .reduce((acc, c) => acc + (parseFloat(c.gasto) || 0), 0);

  setRegistos(prev =>
    prev.map(r => {
      const mesmoEvento =
        String(r.evento || "") === String(eventoNome || "") &&
        String(r.data_evento || "").slice(0, 10) === String(dataEvento || "").slice(0, 10);

      if (!mesmoEvento) return r;

      return {
        ...r,
        ganho: ganhoTotal,
        gasto: gastoTotal,
        lucro: ganhoTotal - gastoTotal,
      };
    })
  );
};

  // helper para “recarregar de raiz”
const hardReloadEventos = () => {
  setRegistos([]);
  setSkip(0);
  setHasMore(true);
};

// usa o hard reload quando guardas
const guardarEvento = async (evento) => {
  const res = await fetch(`https://controlo-bilhetes.onrender.com/eventos_completos2/${evento.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(evento)
  });
  if (res.ok) {
    hardReloadEventos();         // 👈 força a lista a recomeçar do início
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

  const normalizarTextoClube = (s = "") =>
  limpar(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.\-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const renderEventoComSimbolos = (eventoNome) => {
  const nomeLimpo = eventoNome.replace(/\b(vs\s*){2,}/gi, "vs");

  const partes = nomeLimpo
    .split(/\bvs\b/i)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return partes.map((parte, idx) => {
    const parteBase = parte
      .split(" - ")[0]
      .split(" | ")[0]
      .split("(")[0]
      .trim();
    
    const parteNorm = normalizarTextoClube(parteBase);

    // 1) match exato normalizado
    let clubeMatch = clubesInfo.find(
      clube => normalizarTextoClube(clube.nome) === parteNorm
    );
    
    if (!clubeMatch) {
      clubeMatch = clubesInfo.find(clube => {
        const clubeNorm = normalizarTextoClube(clube.nome);
        return parteNorm.startsWith(clubeNorm + " ");
      });
    }

    // 3) fallback antigo: primeiros 5 caracteres
    if (!clubeMatch) {
      clubeMatch = clubesInfo.find(clube =>
        parteNorm.includes(normalizarTextoClube(clube.nome).slice(0, 5))
      );
    }

    return (
      <span key={idx} className="inline-flex items-center gap-1 mr-1">
        {clubeMatch?.simbolo && (
          <img
            src={clubeMatch.simbolo}
            alt={clubeMatch.nome}
            className="w-5 h-5 object-contain inline-block"
          />
        )}
        {parte}
        {idx === 0 && partes.length > 1 && <span className="mx-1">vs</span>}
      </span>
    );
  });
};

const getDataBadgeClass = (estado) => {
  if (estado === "Pago") {
    return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/20";
  }
  if (estado === "Entregue") {
    return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/20";
  }
  if (estado === "Disputa") {
    return "bg-red-500/15 text-red-200 ring-1 ring-red-400/20";
  }
  return "bg-white/[0.05] text-white/90 ring-1 ring-white/10";
};

 const getExpandedVendaRowClass = (toggle) => {
  return toggle
    ? "bg-emerald-950/55 hover:bg-emerald-900/45"
    : "bg-emerald-900/28 hover:bg-emerald-800/35";
}; 
 const getLeftBarClass = (estado) => {
  if (estado === "Pago") return "border-l-[3px] border-l-emerald-400";
  if (estado === "Entregue") return "border-l-[3px] border-l-amber-400";
  if (estado === "Disputa") return "border-l-[3px] border-l-red-400";
  return "border-l-[3px] border-l-white/10";
}; 

  const getExpandedCompraRowClass = (toggle) => {
  return toggle
    ? "bg-rose-950/50 hover:bg-rose-900/40"
    : "bg-red-900/22 hover:bg-red-800/30";
};
return (
   <div className="p-4 md:p-6 w-full md:max-w-[1400px] md:mx-auto min-h-screen">
      


      <div className="relative mb-6 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_0%_0%,rgba(251,191,36,0.18),transparent_24%),radial-gradient(circle_at_100%_0%,rgba(168,85,247,0.18),transparent_26%),linear-gradient(135deg,#0f172a_0%,#111c3a_45%,#1b1b4b_100%)] px-5 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:px-8 md:py-6">
  {/* brilho topo */}
  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-blue-300/70" />

  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
    {/* lado esquerdo */}
    <div className="flex min-w-0 items-center gap-4 lg:w-[24%] xl:w-[28%]">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-amber-400/10 shadow-[0_0_35px_rgba(251,191,36,0.16)]">
        <FaChartBar className="text-[30px] text-amber-300" />
      </div>

      <div className="min-w-0">
        <h2 className="text-[26px] font-extrabold leading-none tracking-tight text-white md:text-[30px]">
          Resumo Mensal
        </h2>

        <p className="mt-2 text-[22px] font-medium capitalize leading-none text-white/90 md:text-[24px]">
          {new Date().toLocaleString("pt-PT", { month: "long", year: "numeric" })}
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 backdrop-blur-sm">
          <span className="text-amber-300">🗓️</span>
          <span>Época {epocaSelecionada}</span>
        </div>
      </div>
    </div>

    {/* centro */}
    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3 md:gap-5 lg:gap-4 md:min-w-0 xl:px-4">
      <div className="relative rounded-2xl border border-white/8 bg-white/[0.03] px-4 md:px-5 lg:px-4 py-4 backdrop-blur-sm min-w-0">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
          <span className="text-[26px]">↗</span>
        </div>
        <p className="text-sm text-white/65">Lucro</p>
        <p className="mt-1 text-[32px] md:text-[22px] lg:text-[38px] font-extrabold leading-none tracking-tight text-emerald-300 whitespace-nowrap">
          {formatarNumero(resumoMensal.lucro)} €
        </p>
        <p className="mt-3 text-sm text-white/55">Este mês</p>
      </div>

      <div className="relative rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 backdrop-blur-sm">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/10 text-amber-300">
          <span className="text-[24px]">⏳</span>
        </div>
        <p className="text-sm text-white/65">Por Pagar</p>
        <p className="mt-1 text-[32px] md:text-[22px] lg:text-[38px] font-extrabold leading-none tracking-tight text-amber-300 whitespace-nowrap">
          {formatarNumero(resumoMensal.pagamento)} €
        </p>
        {resumoMensal.disputas > 0 ? (
          <p className="mt-3 text-sm font-semibold text-red-400">
            (+Disputas {formatarNumero(resumoMensal.disputas)} €)
          </p>
        ) : (
          <p className="mt-3 text-sm text-white/55">Sem disputas</p>
        )}
      </div>

      <div className="relative rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 backdrop-blur-sm">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-fuchsia-400/10 text-fuchsia-300">
          <span className="text-[24px]">🎟️</span>
        </div>
        <p className="text-sm text-white/65">Bilhetes Vendidos</p>
        <p className="mt-1 text-[32px] md:text-[22px] lg:text-[38px] font-extrabold leading-none tracking-tight text-fuchsia-300 whitespace-nowrap">
          {formatarNumero(resumoMensal.bilhetes_epoca)}
        </p>
        <p className="mt-3 text-sm text-white/55">Nesta época</p>
      </div>
    </div>

    {/* direita */}
    <div className="flex shrink-0 lg:w-[110px] xl:w-[18%] lg:justify-end">
      <button
        type="button"
        onClick={buscarLucrosMensais}
        className="inline-flex w-full lg:w-auto items-center justify-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-500/15 px-3 lg:px-5 py-3 lg:py-4 text-white shadow-[0_10px_30px_rgba(59,130,246,0.20)] transition hover:bg-blue-500/20 whitespace-nowrap"
      >
        <FaChartBar className="text-lg text-blue-300" />
        <span className="hidden xl:inline font-semibold">Ver Lucros por Mês</span>
        <span className="xl:hidden font-semibold text-sm">Lucros</span>
      </button>
    </div>
  </div>
</div>

<div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
  <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
    {/* Adicionar Evento */}
    <button
      onClick={adicionarLinha}
      className="inline-flex items-center justify-center gap-3 rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] transition hover:scale-[1.01] hover:from-blue-500 hover:to-blue-400"
    >
      <span className="text-xl leading-none">＋</span>
      <span>Adicionar Evento</span>
    </button>

    {/* Pesquisa */}
    <div className="relative min-w-0 md:w-[240px] lg:w-[300px] xl:w-[420px]">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-white/45">
        🔍
      </span>
      <input
        type="text"
        placeholder="Pesquisar equipa..."
        value={filtroPesquisa}
        onChange={(e) => setFiltroPesquisa(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-12 pr-11 text-white placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-blue-400/40 focus:bg-white/[0.05]"
      />
      {filtroPesquisa && (
        <button
          onClick={() => setFiltroPesquisa("")}
          className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-sm text-white/55 transition hover:bg-white/10 hover:text-red-400"
          title="Limpar"
        >
          ✕
        </button>
      )}
    </div>

    {/* Época */}
    <div ref={epocaRef} className="relative">
      <button
        type="button"
        onClick={() => setEpocaAberta(v => !v)}
        className="inline-flex min-w-[190px] items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:bg-white/[0.08]"
        aria-expanded={epocaAberta}
        aria-haspopup="listbox"
      >
        <span className="truncate">Época {epocaSelecionada}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-white/70 transition-transform ${epocaAberta ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"/>
        </svg>
      </button>

      {epocaAberta && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 w-full min-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]/95 p-2 shadow-2xl backdrop-blur-xl"
        >
          <div className="max-h-64 overflow-y-auto">
            {opcoesEpoca.map((opt) => {
              const ativo = epocaSelecionada === opt;
              return (
                <button
                  key={opt}
                  role="option"
                  aria-selected={ativo}
                  onClick={() => {
                    setEpocaSelecionada(opt);
                    setEpocaAberta(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    ativo
                      ? "bg-blue-500/15 font-semibold text-blue-200"
                      : "text-white/80 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>

    {/* Ocultar Pagos */}
    <button
      onClick={() => setOcultarPagos(v => !v)}
      title={ocultarPagos ? "A ocultar eventos pagos" : "A mostrar eventos pagos"}
      className={`inline-flex items-center justify-center gap-3 rounded-2xl px-5 py-3 font-semibold text-white transition ${
        ocultarPagos
          ? "border border-amber-400/20 bg-amber-500/12 shadow-[0_12px_30px_rgba(245,158,11,0.18)] hover:bg-amber-500/18"
          : "border border-emerald-400/20 bg-emerald-500/12 shadow-[0_12px_30px_rgba(16,185,129,0.18)] hover:bg-emerald-500/18"
      }`}
    >
      <span className="text-base">💰</span>
      <span>Ocultar Pagos: {ocultarPagos ? "ON" : "OFF"}</span>
    </button>
  </div>

  {/* Exportar */}
  <div className="flex shrink-0">
    <button
      onClick={() => exportarEventosParaExcel(registos)}
      className="inline-flex items-center justify-center gap-3 md:gap-1.5 lg:gap-3 rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-emerald-600 to-green-500 px-5 md:px-3 lg:px-5 py-3 md:py-2 lg:py-3 font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.24)] transition hover:scale-[1.01] hover:from-emerald-500 hover:to-green-400 whitespace-nowrap text-sm md:text-[13px] lg:text-base"
    >
      <FaFileExcel className="h-4 w-4 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
      <span className="hidden lg:inline">Exportar Excel</span>
      <span className="lg:hidden">Excel</span>
    </button>
  </div>
</div>


    


      <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.025] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
  <table className="hidden md:table min-w-full table-fixed text-sm text-white">
    <colgroup>
      <col className="w-[470px]" />
      <col className="w-[95px]" />
      <col className="w-[95px]" />
      <col className="w-[95px]" />
      <col className="w-[120px]" />
      <col className="w-[240px]" />
    </colgroup>

    <thead className="bg-white/[0.045]">
      <tr className="border-b border-white/10 text-[13px] uppercase tracking-[0.08em] text-white/70">
        <th className="p-4 font-semibold">Evento</th>
        <th className="p-4 text-center font-semibold">Gasto</th>
        <th className="p-4 text-center font-semibold">Ganho</th>
        <th className="p-4 text-left font-semibold">Lucro</th>
        <th className="p-4 font-semibold">Estado</th>
        <th className="p-4 text-center font-semibold">Ações</th>
      </tr>
    </thead>

    <tbody>
      {registos
        .filter(r => {
          const passaPesquisa = (r.evento || "").toLowerCase().includes(filtroPesquisa.toLowerCase());
          const filtroAtivo = !!filtroPesquisa.trim();
          const esconderPago = !filtroAtivo && ocultarPagos && r.estado === "Pago" && modoEdicao !== r.id;
          const passaEpoca = matchesEpoca(r);
          return passaPesquisa && !esconderPago && passaEpoca;
        })
        .map(r => (
          <Fragment key={r.id}>
            <tr
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
                    }, 150);
                  });
                }
              }}
              className={`cursor-pointer border-b border-white/[0.03] transition-all duration-200 hover:bg-white/[0.045] ${
                linhaExpandida === r.id
                  ? r.estado === "Pago"
                    ? "bg-emerald-500/10 border-l-emerald-400"
                    : r.estado === "Entregue"
                    ? "bg-amber-500/10 border-l-amber-400"
                    : r.estado === "Disputa"
                    ? "bg-red-500/12 border-l-red-400"
                    : "bg-blue-500/10 border-l-blue-400"
                  : r.estado === "Pago"
                  ? "bg-emerald-500/10 border-l-emerald-400"
                  : r.estado === "Entregue"
                  ? "bg-amber-500/10 border-l-amber-400"
                  : r.estado === "Disputa"
                  ? "bg-red-500/12 border-l-red-400"
                  : "bg-transparent border-l-white/10"
              }`}
            >

              <td className={`p-4 pl-5 overflow-hidden ${getLeftBarClass(r.estado)}`}>
                {modoEdicao === r.id ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="date"
                      value={toInputDate(r.data_evento)}
                      onChange={(e) => atualizarCampo(r.id, "data_evento", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-white [color-scheme:dark]"
                    />

                    <select
                      value={r.evento}
                      onChange={(e) => atualizarCampo(r.id, "evento", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-white"
                    >
                      <option value="">-- Selecionar Evento --</option>
                      {eventosDropdown.map(e => (
                        <option key={e.id} value={e.nome}>{e.nome}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  (() => {
                    const { saldo } = getTotaisBilhetesEvento(r.evento, r.data_evento, vendas, compras);
                    const badge = getBadgeBilhetesMeta(saldo);

                    return (
                      <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                        <span
                          className={`shrink-0 rounded-xl px-2.5 py-1.5 text-[13px] font-semibold tabular-nums ${getDataBadgeClass(r.estado)}`}
                        >
                          {formatarDataPt(r.data_evento)}
                        </span>

                        {badge && (
                          <span
                            title={badge.title}
                            className={`
                              inline-flex shrink-0 items-center justify-center
                              min-w-[30px] h-[30px] px-2 rounded-xl
                              text-[12px] font-bold leading-none
                              shadow-sm
                              ${badge.className}
                            `}
                          >
                            {badge.valor}
                          </span>
                        )}

                        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                          <span className="flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis min-w-0 font-medium text-white">
                            {renderEventoComSimbolos(r.evento)}
                          </span>

                          {r.nota_evento && (
                            <span
                              className="text-yellow-300 shrink-0"
                              title={r.nota_evento}
                            >
                              📝
                            </span>
                          )}

                          {r.url_evento ? (
                            <a
                              href={normalizeUrl(r.url_evento)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Abrir link do evento"
                              className="inline-flex items-center opacity-80 transition hover:opacity-100 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img
                                src={viagogoLogo}
                                alt="Viagogo"
                                className="w-5 h-5 inline-block"
                                loading="lazy"
                              />
                            </a>
                          ) : null}
                        </div>
                      </div>
                    );
                  })()
                )}
              </td>

              

              <td className="p-4 whitespace-nowrap text-center font-medium text-red-300">
                {r.gasto} €
              </td>

              <td className="p-4 whitespace-nowrap text-center font-medium text-emerald-300">
                {r.ganho} €
              </td>

              <td className="p-4 whitespace-nowrap text-left font-semibold text-white">
                {(r.ganho - r.gasto)} €
              </td>

              <td className="p-4 whitespace-nowrap">
                {modoEdicao === r.id ? (
                  <select
                    value={r.estado}
                    onChange={(e) => atualizarCampo(r.id, "estado", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-white"
                  >
                    <option value="Entregue">Entregue</option>
                    <option value="Por entregar">Por entregar</option>
                    <option value="Disputa">Disputa</option>
                    <option value="Pago">Pago</option>
                  </select>
                ) : (
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      r.estado === "Pago"
                        ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20"
                        : r.estado === "Entregue"
                        ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20"
                        : r.estado === "Disputa"
                        ? "bg-red-500/15 text-red-300 ring-1 ring-red-400/20"
                        : "bg-white/8 text-white/80 ring-1 ring-white/10"
                    }`}
                  >
                    {r.estado}
                  </span>
                )}
              </td>

              <td className="p-4 align-middle">
                <div className="flex items-center justify-center gap-3 whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (modoEdicao === r.id) {
                        guardarEvento(r);
                      } else {
                        ativarEdicao(r.id, r);
                      }
                    }}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-[0_8px_20px_rgba(59,130,246,0.28)] transition hover:scale-105 hover:bg-blue-400"
                    title={modoEdicao === r.id ? "Guardar" : "Editar"}
                  >
                    {modoEdicao === r.id ? "💾" : <FaEdit size={14} />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmarEliminar(r.id);
                    }}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-[0_8px_20px_rgba(239,68,68,0.28)] transition hover:scale-105 hover:bg-red-400"
                    title="Eliminar"
                  >
                    <FaTrash size={14} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                      const vendasDoEvento = vendas.filter(
                        (v) => v.evento === r.evento && v.data_evento === r.data_evento
                      );

                      const chaveRegra = getEquipaCasaCanonica(r.evento);
                      const resumo = getResumoMatchingInteligente(r.evento, r.data_evento, chaveRegra);
                      const resumoTitulo = getResumoTituloVendas(r.evento, r.data_evento, chaveRegra);

                      const titulo = `Vendas com Nota (bola vermelha) — ${r.evento} — ${new Date(
                        r.data_evento
                      ).toLocaleDateString("pt-PT")}`;

                      const cabecalhoResumo = `Vendas (${getTotalBilhetesVendas(r.evento, r.data_evento)})${
                        resumoTitulo ? ` — ${resumoTitulo}` : ""
                      }`;

                      imprimirVendasComNotaVermelha(vendasDoEvento, {
                        tituloEvento: titulo,
                        cabecalhoResumo,
                        linhaPorComprar: resumo.porComprarTxt ? `Por comprar: ${resumo.porComprarTxt}` : "",
                        linhaCoberturaIncerta: resumo.coberturaIncertaTxt
                          ? `Cobertura incerta: ${resumo.coberturaIncertaTxt}`
                          : "",
                        linhaPorVender: resumo.porVenderTxt ? `Por vender: ${resumo.porVenderTxt}` : "",
                      });
                    }}
                    title="Imprimir vendas com Nota (bola vermelha) deste evento"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.28)] transition hover:scale-105 hover:bg-emerald-400"
                  >
                    <FaPrint size={14} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMostrarNotaEventoId(r.id);
                      setNotaEventoTmp(r.nota_evento || "");
                      setUrlEventoTmp(r.url_evento || "");
                    }}
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition hover:scale-105 ${
                      r.nota_evento
                        ? "bg-purple-500 shadow-[0_8px_20px_rgba(168,85,247,0.28)] hover:bg-purple-400"
                        : "bg-white/10 hover:bg-white/15"
                    }`}
                    title={r.nota_evento ? "Editar notas do evento" : "Adicionar nota ao evento"}
                  >
                    📝
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMostrarEstadioId(r.id);
                      setEstadioTmp(r.estadio || "");
                    }}
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition hover:scale-105 ${
                      r.estadio
                        ? "bg-sky-500 shadow-[0_8px_20px_rgba(56,189,248,0.28)] hover:bg-sky-400"
                        : "bg-white/10 hover:bg-white/15"
                    }`}
                    title={r.estadio || "Adicionar estádio"}
                  >
                    🏟️
                  </button>
                </div>
              </td>
            </tr>

            {linhaExpandida === r.id && (
              <>
                <tr className="bg-blue-500/6">
                  <td colSpan="6" className="p-4 border-b border-white/6">
                    {(() => {
                      const chaveRegra = getEquipaCasaCanonica(r.evento);
                      const resumo = getResumoMatchingInteligente(r.evento, r.data_evento, chaveRegra);
                      const resumoTitulo = getResumoTituloVendas(r.evento, r.data_evento, chaveRegra);

                  return (
                    <div className="rounded-2xl border border-blue-400/10 bg-blue-500/8 px-4 py-3">
                      
                      {/* 🔵 HEADER COM BOTÃO */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-white">
                          Vendas ({getTotalBilhetesVendas(r.evento, r.data_evento)})
                          {resumoTitulo ? <> — {resumoTitulo}</> : null}
                        </div>
                  
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalNovaVenda(r);
                          }}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-[0_8px_20px_rgba(59,130,246,0.28)] transition hover:scale-105 hover:bg-blue-400"
                          title="Adicionar venda"
                        >
                          <FaPlus size={12} />
                        </button>
                      </div>
                  
                      {/* 🔽 RESTO DO RESUMO */}
                      {resumo.porComprarTxt && (
                        <div className="text-red-300 text-xs mt-1">
                          🔴 Por comprar: {resumo.porComprarTxt}
                        </div>
                      )}
                  
                      {resumo.coberturaIncertaTxt && (
                        <div className="text-yellow-300 text-xs mt-1">
                          🟡 Cobertura incerta: {resumo.coberturaIncertaTxt}
                        </div>
                      )}
                  
                      {resumo.porVenderTxt && (
                        <div className="text-emerald-300 text-xs mt-1">
                          🟢 Por vender: {resumo.porVenderTxt}
                        </div>
                      )}
                    </div>
                  );
                    })()}
                  </td>
                </tr>

                <tr className="bg-blue-500/6">
  <td colSpan="6" className="p-0 border-b border-white/6">
    <div className="px-4 pb-2">
      <table className="w-full table-fixed text-xs text-white">
        <colgroup>
          <col className="w-[110px]" />
          <col className="w-[430px]" />
          <col className="w-[85px]" />
          <col className="w-[95px]" />
          <col className="w-[170px]" />
          <col className="w-[80px]" />
        </colgroup>
        <thead>
          <tr className="bg-blue-500/10 text-[11px] uppercase tracking-[0.08em] text-white/65">
            <th className="py-3 pl-3 pr-2 text-left">ID Venda</th>
            <th className="py-3 px-2 text-left">Bilhetes</th>
            <th className="py-3 px-2 text-right">Ganho</th>
            <th className="py-3 pl-2 pr-1 text-left">Estado</th>
            <th className="py-3 pl-1 pr-1 text-left">Nota</th>
            <th className="py-3 pl-1 pr-3 text-left">Ações</th>
          </tr>
        </thead>

        <tbody>
          {(() => {
            let lastSetor = null;
            let toggle = false;

            return getVendasOrdenadas(r.evento, r.data_evento).map((v) => {
              const setorAtual = setorExato(v.estadio);

              if (setorAtual !== lastSetor) {
                toggle = !toggle;
                lastSetor = setorAtual;
              }

              const bgClass = getExpandedVendaRowClass(toggle);

              if (modoEdicaoVenda === v.id) {
                return (
                  <tr
                    key={"v" + v.id}
                    className={`border-b border-emerald-400/10 transition-colors ${bgClass}`}
                  >
                    <td className="py-[6px] pl-3 pr-2 align-top">
                      <input
                        type="number"
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-2 py-1 text-white"
                        value={vendaEditada.id_venda}
                        onChange={(e) =>
                          setVendaEditada({ ...vendaEditada, id_venda: e.target.value })
                        }
                      />
                    </td>
              
                    <td className="py-[6px] px-2 align-top">
                      <input
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-2 py-1 text-white"
                        value={vendaEditada.estadio}
                        onChange={(e) =>
                          setVendaEditada({ ...vendaEditada, estadio: e.target.value })
                        }
                      />
                    </td>
              
                    <td className="py-[6px] px-2 align-top">
                      <input
                        type="number"
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-2 py-1 text-right text-white"
                        value={vendaEditada.ganho}
                        onChange={(e) =>
                          setVendaEditada({ ...vendaEditada, ganho: e.target.value })
                        }
                      />
                    </td>
              
                    <td className="py-[6px] px-2 align-top">
                      <select
                        className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-2 py-1 text-white"
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
              
                    <td className="py-[6px] px-2 align-top"></td>
              
                    <td className="py-[6px] pl-2 pr-3 align-top whitespace-nowrap">
                      <button
                        className="mr-3 text-emerald-300"
                        onClick={() => guardarVenda(vendaEditada)}
                      >
                        Guardar
                      </button>
                      <button
                        className="text-white/60"
                        onClick={() => setModoEdicaoVenda(null)}
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                );
              }
              
              return (
                <tr
                  key={"v" + v.id}
                  className={`border-b border-emerald-400/10 transition-colors ${bgClass}`}
                >
                  <td className="py-[6px] pl-3 pr-2 whitespace-nowrap text-white/90 align-middle">
                    {v.id_venda}
                  </td>
              
                  <td className="py-[6px] px-2 text-white/85 align-middle">
                    {v.estadio}
                  </td>
              
                  <td className="py-[6px] px-2 whitespace-nowrap text-right font-medium text-emerald-300 align-middle">
                    {v.ganho} €
                  </td>
              
                  <td className="py-[6px] pl-2 pr-1 whitespace-nowrap align-middle">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-[3px] text-xs font-semibold ${
                        v.estado === "Pago"
                          ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20"
                          : v.estado === "Entregue"
                          ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20"
                          : v.estado === "Disputa"
                          ? "bg-red-500/15 text-red-300 ring-1 ring-red-400/20"
                          : "bg-white/8 text-white/80 ring-1 ring-white/10"
                      }`}
                    >
                      {v.estado}
                    </span>
                  </td>
                  
                  <td className="py-[6px] pl-1 pr-1 align-middle">
                    <CirculoEstado
                      tipo="listagem_vendas"
                      id={v.id}
                      texto_estado={v.circulo_estado_venda}
                      nota_estado={v.nota_estado_venda}
                      setVendas={setVendas}
                    />
                  </td>
                  
                  <td className="py-[6px] pl-1 pr-3 whitespace-nowrap align-middle">
                    {vendasNaoAssociadasSet.has(v.id) && (
                      <span
                        className="text-yellow-400 mr-2"
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
                      className="text-blue-300 hover:text-blue-200"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              );
            });
          })()}
        </tbody>
      </table>
    </div>
  </td>
</tr>

                <tr className="bg-amber-500/8">
                  <td colSpan="6" className="p-4 border-b border-white/6">
                    {(() => {
                      const chaveRegra = getEquipaCasaCanonica(r.evento);
                      const totalCompras = compras
                        .filter(c => c.evento === r.evento && c.data_evento === r.data_evento)
                        .reduce((acc, c) => acc + Number(c.quantidade || 0), 0);

                      const resumoCompras = getResumoTituloCompras(
                        r.evento,
                        r.data_evento,
                        chaveRegra
                      );

                      return (
                        <div className="rounded-2xl border border-amber-400/10 bg-amber-500/8 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-white">
                              Compras ({totalCompras})
                              {resumoCompras ? <> — {resumoCompras}</> : null}
                            </div>
                        
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModalNovaCompra(r);
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-[0_8px_20px_rgba(245,158,11,0.28)] transition hover:scale-105 hover:bg-amber-400"
                              title="Adicionar compra"
                            >
                              <FaPlus size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                </tr>

                <tr className="bg-amber-500/6">
                  <td colSpan="6" className="p-0 border-b border-white/6">
                    <div className="px-4 pb-2">
                      <table className="w-full table-fixed text-xs text-white">
                        <colgroup>
                          <col className="w-[92px]" />
                          <col className="w-[104px]" />
                          <col className="w-[92px]" />
                          <col className="w-[56px]" />
                          <col className="w-[42px]" />
                          <col className="w-[74px]" />
                          <col className="w-[170px]" />
                          <col className="w-[84px]" />
                        </colgroup>
                
                        <thead>
                          <tr className="bg-amber-500/10 text-[11px] uppercase tracking-[0.08em] text-white/65">
                            <th className="py-2 pl-2 pr-[2px] text-left">Local</th>
                            <th className="py-2 px-[2px] text-left">Bancada</th>
                            <th className="py-2 px-[2px] text-left">Setor</th>
                            <th className="py-2 px-[2px] text-left">Fila</th>
                            <th className="py-2 px-[2px] text-left">Qt</th>
                            <th className="py-2 px-[4px] text-right">Gasto</th>
                            <th className="py-2 pl-[8px] pr-[4px] text-left">Nota</th>
                            <th className="py-2 pl-[10px] pr-2 text-left">Ações</th>
                          </tr>
                        </thead>
                
                        <tbody>
                          {(() => {
                            let lastSetor = null;
                            let toggle = false;
                            const chaveRegra = getEquipaCasaCanonica(r.evento);
                
                            return getComprasOrdenadas(r.evento, r.data_evento).map((c) => {
                              const setorAtual = compraChaveOperacionalExata(c, chaveRegra);
                
                              if (setorAtual !== lastSetor) {
                                toggle = !toggle;
                                lastSetor = setorAtual;
                              }
                
                              const bgClass = getExpandedCompraRowClass(toggle);
                
                              return (
                                <tr
                                  key={"c" + c.id}
                                  className={`border-b border-red-400/10 text-xs transition-colors ${bgClass}`}
                                >
                                  {modoEdicaoCompra === c.id ? (
                                    <>
                                      <td className="py-[6px] pl-2 pr-[2px] align-middle">
                                        <input
                                          className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-2 py-1 text-white"
                                          value={compraEditada.local_compras}
                                          onChange={(e) =>
                                            setCompraEditada({
                                              ...compraEditada,
                                              local_compras: e.target.value,
                                            })
                                          }
                                        />
                                      </td>
                
                                      <td className="py-[6px] px-[2px] align-middle">
                                        <input
                                          className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-2 py-1 text-white"
                                          value={compraEditada.bancada}
                                          onChange={(e) =>
                                            setCompraEditada({
                                              ...compraEditada,
                                              bancada: e.target.value,
                                            })
                                          }
                                        />
                                      </td>
                
                                      <td className="py-[6px] px-[2px] align-middle">
                                        <input
                                          className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-2 py-1 text-white"
                                          value={compraEditada.setor}
                                          onChange={(e) =>
                                            setCompraEditada({
                                              ...compraEditada,
                                              setor: e.target.value,
                                            })
                                          }
                                        />
                                      </td>
                
                                      <td className="py-[6px] px-[2px] align-middle">
                                        <input
                                          className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-2 py-1 text-white"
                                          value={compraEditada.fila}
                                          onChange={(e) =>
                                            setCompraEditada({
                                              ...compraEditada,
                                              fila: e.target.value,
                                            })
                                          }
                                        />
                                      </td>
                
                                      <td className="py-[6px] px-[2px] align-middle">
                                        <input
                                          type="number"
                                          className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-2 py-1 text-white"
                                          value={compraEditada.quantidade}
                                          onChange={(e) =>
                                            setCompraEditada({
                                              ...compraEditada,
                                              quantidade: e.target.value,
                                            })
                                          }
                                        />
                                      </td>
                
                                      <td className="py-[6px] px-[4px] align-middle">
                                        <input
                                          type="number"
                                          className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-2 py-1 text-right text-white"
                                          value={compraEditada.gasto}
                                          onChange={(e) =>
                                            setCompraEditada({
                                              ...compraEditada,
                                              gasto: e.target.value,
                                            })
                                          }
                                        />
                                      </td>
                
                                      <td className="py-[6px] pl-[8px] pr-[4px] align-middle"></td>
                
                                      <td className="py-[6px] pl-[10px] pr-2 whitespace-nowrap align-middle">
                                        <button
                                          className="mr-3 text-emerald-300"
                                          onClick={() => guardarCompra(compraEditada)}
                                        >
                                          Guardar
                                        </button>
                                        <button
                                          className="text-white/60"
                                          onClick={() => setModoEdicaoCompra(null)}
                                        >
                                          Cancelar
                                        </button>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="py-[6px] pl-2 pr-[2px] text-white/85 align-middle truncate">
                                        {c.local_compras}
                                      </td>
                
                                      <td className="py-[6px] px-[2px] text-white/85 align-middle truncate">
                                        {c.bancada}
                                      </td>
                
                                      <td className="py-[6px] px-[2px] text-white/85 align-middle truncate">
                                        {c.setor}
                                      </td>
                
                                      <td
                                        className="py-[6px] px-[2px] text-white/75 align-middle truncate"
                                        title={c.fila}
                                      >
                                        {c.fila}
                                      </td>
                
                                      <td className="py-[6px] px-[2px] whitespace-nowrap text-white/90 align-middle">
                                        {c.quantidade}
                                      </td>
                
                                      <td className="py-[6px] px-[4px] whitespace-nowrap text-right font-medium text-red-300 align-middle">
                                        {c.gasto} €
                                      </td>
                
                                      <td className="py-[6px] pl-[6px] pr-[2px] align-middle">
                                        <div className="w-[170px] min-w-0">
                                          <CirculoEstado
                                            tipo="compras"
                                            id={c.id}
                                            texto_estado={c.circulo_estado_compra}
                                            nota_estado={c.nota_estado_compra}
                                            setCompras={setCompras}
                                          />
                                        </div>
                                      </td>
                
                                      <td className="py-[6px] pl-[6px] pr-2 whitespace-nowrap align-middle text-left">
                                        {comprasNaoAssociadasSet.has(c.id) && (
                                          <span
                                            className="text-yellow-400 mr-2"
                                            title="Compra não associada a evento"
                                          >
                                            ⚠️
                                          </span>
                                        )}
                                        <button
                                          onClick={() => {
                                            setModoEdicaoCompra(c.id);
                                            setCompraEditada(c);
                                          }}
                                          className="text-blue-300 hover:text-blue-200"
                                        >
                                          Editar
                                        </button>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </>
            )}
          </Fragment>
        ))}
    </tbody>
  </table>
</div>
          <div className="space-y-5 md:hidden mt-6 px-0 w-full max-w-full">
            {registos
              .filter(r => {
                const passaPesquisa = (r.evento || "").toLowerCase().includes(filtroPesquisa.toLowerCase());
                const filtroAtivo = !!filtroPesquisa.trim();
                const esconderPago = !filtroAtivo && ocultarPagos && r.estado === "Pago" && modoEdicao !== r.id;
                const passaEpoca = matchesEpoca(r);
                return passaPesquisa && !esconderPago && passaEpoca;
              })
              .map((r) => {
                const emEdicao = modoEdicao === r.id;
                const d = parseDataPt(r.data_evento); // ✅ usar helper para datas
                const { saldo } = getTotaisBilhetesEvento(
                  r.evento,
                  r.data_evento,
                  vendas,
                  compras
                );
                const badge = getBadgeBilhetesMeta(saldo);
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
                          value={toInputDate(eventoEditado.data_evento)}
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
                        <div className="flex items-center gap-2">
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
                      
                          <span
                            title={badge.title}
                            className={`
                              inline-flex shrink-0 items-center justify-center
                              min-w-[28px] h-[28px] px-2 rounded-[10px]
                              text-[12px] font-bold leading-none
                              shadow-sm
                              ${badge.className}
                            `}
                          >
                            {badge.valor}
                          </span>
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
                    <>
                      <div className="flex flex-wrap items-center gap-1">
                        {renderEventoComSimbolos(r.evento)}
                      </div>
                
                      {r.nota_evento && (
                        <div className="mt-1 text-xs text-amber-300/90 bg-amber-900/30 rounded px-2 py-1 whitespace-pre-wrap">
                          📝 {r.nota_evento}
                        </div>
                      )}
                    </>
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
                        Vendas ({getTotalBilhetesVendas(r.evento, r.data_evento)})
                        {(() => {
                          const resumo = getResumoTituloVendas(r.evento, r.data_evento);
                          return resumo ? <> — {resumo}</> : null;
                        })()}
                      </div>


                  
                      {/* VENDAS */}
                      {getVendasOrdenadas(r.evento, r.data_evento).map((v) => (
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
                          
                            {/* ⬇️ NOTA DA VENDA (MOBILE) */}
                            {v.nota_estado_venda?.trim() && (
                              <div className="mt-2 text-xs bg-white/10 rounded px-2 py-1 whitespace-pre-wrap">
                                <span className="font-semibold">Nota:</span> {v.nota_estado_venda}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}


                      {/* ✅ Cabeçalho COMPRAS (MOBILE) */}
                      <div className="text-sm font-semibold text-yellow-300 mt-4">
                        {(() => {
                          const chaveRegra = getEquipaCasaCanonica(r.evento);
                          const totalCompras = compras
                            .filter(c => c.evento === r.evento && c.data_evento === r.data_evento)
                            .reduce((acc, c) => acc + Number(c.quantidade || 0), 0);
                      
                          const resumoCompras = getResumoTituloCompras(
                            r.evento,
                            r.data_evento,
                            chaveRegra
                          );
                      
                          return (
                            <>
                              Compras ({totalCompras})
                              {resumoCompras ? <> — {resumoCompras}</> : null}
                            </>
                          );
                        })()}
                      </div>


                      
                      {/* COMPRAS */}
                      {getComprasOrdenadas(r.evento, r.data_evento).map((c) => (
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
                          
                            {/* ⬇️ NOTA DA COMPRA (MOBILE) */}
                            {c.nota_estado_compra?.trim() && (
                              <div className="mt-2 text-xs bg-white/10 rounded px-2 py-1 whitespace-pre-wrap">
                                <span className="font-semibold">Nota:</span> {c.nota_estado_compra}
                              </div>
                            )}
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
         
      

         {/* Modal de lucros por mês */}
        {mostrarResumoDetalhado && (
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
            onClick={() => setMostrarResumoDetalhado(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 text-black dark:text-white p-6 rounded shadow-lg w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                Lucro por Mês
              </h2>
        
              <div className="mb-4 overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-300 dark:border-gray-600">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="p-2 text-left">Mês</th>
                      <th className="p-2 text-right">Nr Eventos</th>
                      <th className="p-2 text-right">Bilhetes Vendidos</th>
                      <th className="p-2 text-right">Gasto</th>
                      <th className="p-2 text-right">Ganho</th>
                      <th className="p-2 text-right">Lucro</th>
                      <th className="p-2 text-right">Margem</th>
                      <th className="p-2 text-right">€/Bilhete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(lucrosMensais) &&
                      lucrosMensais.map((item, idx) => (
                        <Fragment key={idx}>
                          <tr
                            className={`border-t border-gray-200 dark:border-gray-600 ${
                              isMesAtual(item.mes)
                                ? "bg-blue-100 dark:bg-blue-900 font-semibold"
                                : "bg-white dark:bg-gray-800"
                            }`}
                          >
                            <td className="p-2">
                              <button
                                onClick={() => toggleMesExpandido(item.mes)}
                                className="mr-2 font-bold text-blue-600 dark:text-blue-400"
                                title={mesesExpandidos[item.mes] ? "Fechar" : "Expandir"}
                              >
                                {mesesExpandidos[item.mes] ? "−" : "+"}
                              </button>
                              {traduzirMesParaPt(item.mes)}
                            </td>
                    
                            <td className="p-2 text-right">{item.nr_eventos}</td>
                            <td className="p-2 text-right">{item.bilhetes_vendidos}</td>
                            <td className="p-2 text-right">{formatarNumero(item.gasto)} €</td>
                            <td className="p-2 text-right">{formatarNumero(item.ganho)} €</td>
                    
                            <td
                              className={`p-2 text-right font-semibold ${
                                item.lucro < 0
                                  ? "text-red-500"
                                  : isMesPassado(item.mes)
                                  ? "text-green-600"
                                  : ""
                              }`}
                            >
                              {formatarNumero(item.lucro)} €
                            </td>
                    
                            <td
                              className={`p-2 text-right font-semibold ${
                                item.margem < 0 ? "text-red-500" : "text-blue-600"
                              }`}
                            >
                              {item.margem.toFixed(2)}%
                            </td>
                    
                            <td className="p-2 text-right text-purple-600 font-semibold">
                              {formatarNumero(item.lucro_por_bilhete)} €
                            </td>
                          </tr>
                    
                          {mesesExpandidos[item.mes] &&
                            Array.isArray(item.eventos) &&
                            [...item.eventos]
                              .sort((a, b) => {
                                const lucroA = Number(a.lucro || 0);
                                const lucroB = Number(b.lucro || 0);
                          
                                if (lucroB !== lucroA) return lucroB - lucroA;
                          
                                const margemA = Number(a.margem || 0);
                                const margemB = Number(b.margem || 0);
                          
                                if (margemB !== margemA) return margemB - margemA;
                          
                                return String(a.jogo || "").localeCompare(String(b.jogo || ""), "pt");
                              })
                              .map((ev, evIdx) => (
                              <tr
                                key={`${idx}-${evIdx}`}
                                className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                              >
                                <td className="p-2 pl-8 text-left">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {renderEventoComSimbolos(ev.jogo)}
                                  </div>
                                </td>
                                <td className="p-2 text-right">1</td>
                                <td className="p-2 text-right">{ev.bilhetes_vendidos}</td>
                                <td className="p-2 text-right">{formatarNumero(ev.gasto)} €</td>
                                <td className="p-2 text-right">{formatarNumero(ev.ganho)} €</td>
                    
                                <td
                                  className={`p-2 text-right font-semibold ${
                                    ev.lucro < 0 ? "text-red-500" : "text-green-600"
                                  }`}
                                >
                                  {formatarNumero(ev.lucro)} €
                                </td>
                    
                                <td
                                  className={`p-2 text-right font-semibold ${
                                    ev.margem < 0 ? "text-red-500" : "text-blue-600"
                                  }`}
                                >
                                  {Number(ev.margem || 0).toFixed(2)}%
                                </td>
                    
                                <td className="p-2 text-right text-purple-600 font-semibold">
                                  {formatarNumero(ev.lucro_por_bilhete)} €
                                </td>
                              </tr>
                            ))}
                        </Fragment>
                      ))}
                  </tbody>
        
                  <tfoot className="border-t-2 border-gray-400 dark:border-gray-500 font-bold">
                    <tr>
                      <td className="p-2">Total</td>
                      <td className="p-2 text-right">
                        {lucrosMensais.reduce((acc, cur) => acc + Number(cur.nr_eventos || 0), 0)}
                      </td>
                      <td className="p-2 text-right">
                        {lucrosMensais.reduce((acc, cur) => acc + Number(cur.bilhetes_vendidos || 0), 0)}
                      </td>
                      <td className="p-2 text-right">
                        {formatarNumero(
                          lucrosMensais.reduce((acc, cur) => acc + Number(cur.gasto || 0), 0)
                        )} €
                      </td>
                      <td className="p-2 text-right">
                        {formatarNumero(
                          lucrosMensais.reduce((acc, cur) => acc + Number(cur.ganho || 0), 0)
                        )} €
                      </td>
                      <td className="p-2 text-right">
                        {formatarNumero(
                          lucrosMensais.reduce((acc, cur) => acc + Number(cur.lucro || 0), 0)
                        )} €
                      </td>
                      <td className="p-2 text-right">
                        {(() => {
                          const ganhoTotal = lucrosMensais.reduce(
                            (acc, cur) => acc + Number(cur.ganho || 0),
                            0
                          );
                          const lucroTotal = lucrosMensais.reduce(
                            (acc, cur) => acc + Number(cur.lucro || 0),
                            0
                          );
                          const margemTotal = ganhoTotal > 0 ? (lucroTotal / ganhoTotal) * 100 : 0;
                          return `${margemTotal.toFixed(2)}%`;
                        })()}
                      </td>
                      <td className="p-2 text-right">
                        {(() => {
                          const lucroTotal = lucrosMensais.reduce(
                            (acc, cur) => acc + Number(cur.lucro || 0),
                            0
                          );
                          const bilhetesTotal = lucrosMensais.reduce(
                            (acc, cur) => acc + Number(cur.bilhetes_vendidos || 0),
                            0
                          );
                          const media = bilhetesTotal > 0 ? lucroTotal / bilhetesTotal : 0;
                          return `${formatarNumero(media)} €`;
                        })()}
                      </td>
                    </tr>
                  
                    <tr className="border-t border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                      <td className="p-2">Média mensal</td>
                  
                      <td className="p-2 text-right">
                        {(() => {
                          const n = lucrosMensais.length || 1;
                          const total = lucrosMensais.reduce((acc, cur) => acc + Number(cur.nr_eventos || 0), 0);
                          return (total / n).toFixed(1);
                        })()}
                      </td>
                  
                      <td className="p-2 text-right">
                        {(() => {
                          const n = lucrosMensais.length || 1;
                          const total = lucrosMensais.reduce((acc, cur) => acc + Number(cur.bilhetes_vendidos || 0), 0);
                          return (total / n).toFixed(1);
                        })()}
                      </td>
                  
                      <td className="p-2 text-right">
                        {(() => {
                          const n = lucrosMensais.length || 1;
                          const total = lucrosMensais.reduce((acc, cur) => acc + Number(cur.gasto || 0), 0);
                          return `${formatarNumero(total / n)} €`;
                        })()}
                      </td>
                  
                      <td className="p-2 text-right">
                        {(() => {
                          const n = lucrosMensais.length || 1;
                          const total = lucrosMensais.reduce((acc, cur) => acc + Number(cur.ganho || 0), 0);
                          return `${formatarNumero(total / n)} €`;
                        })()}
                      </td>
                  
                      <td className="p-2 text-right">
                        {(() => {
                          const n = lucrosMensais.length || 1;
                          const total = lucrosMensais.reduce((acc, cur) => acc + Number(cur.lucro || 0), 0);
                          return `${formatarNumero(total / n)} €`;
                        })()}
                      </td>
                  
                      <td className="p-2 text-right">
                        {(() => {
                          const ganhoTotal = lucrosMensais.reduce(
                            (acc, cur) => acc + Number(cur.ganho || 0),
                            0
                          );
                          const lucroTotal = lucrosMensais.reduce(
                            (acc, cur) => acc + Number(cur.lucro || 0),
                            0
                          );
                          const margem = ganhoTotal > 0 ? (lucroTotal / ganhoTotal) * 100 : 0;
                          return `${margem.toFixed(2)}%`;
                        })()}
                      </td>
                  
                      <td className="p-2 text-right">
                        {(() => {
                          const lucroTotal = lucrosMensais.reduce(
                            (acc, cur) => acc + Number(cur.lucro || 0),
                            0
                          );
                          const bilhetesTotal = lucrosMensais.reduce(
                            (acc, cur) => acc + Number(cur.bilhetes_vendidos || 0),
                            0
                          );
                          const media = bilhetesTotal > 0 ? lucroTotal / bilhetesTotal : 0;
                          return `${formatarNumero(media)} €`;
                        })()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
        
              <button
                onClick={() => setMostrarResumoDetalhado(false)}
                className="mt-4 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

{mostrarModalNovaCompra && (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
    <div
      className="w-full max-w-5xl rounded-[24px] border border-white/10 bg-[#0f1b3d] p-5 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Nova Compra</h3>
        <button
          onClick={() => setMostrarModalNovaCompra(false)}
          className="rounded-xl bg-white/10 px-3 py-2 text-white/80 transition hover:bg-white/15 hover:text-white"
        >
          Fechar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
        <div className="flex min-w-0 flex-col">
          <label className="mb-2 text-[13px] font-semibold tracking-wide text-white/80">
            Evento
          </label>
          <input
            value={novaCompraEvento.evento}
            readOnly
            className="w-full rounded-xl border border-white/10 bg-[#1a2742] px-3 py-2.5 text-sm text-white/80 outline-none"
          />
        </div>

        <div className="flex min-w-0 flex-col">
          <label className="mb-2 text-[13px] font-semibold tracking-wide text-white/80">
            Data do Evento
          </label>
          <input
            type="date"
            value={novaCompraEvento.data_evento}
            onChange={(e) =>
              setNovaCompraEvento((prev) => ({
                ...prev,
                data_evento: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-white/10 bg-[#1a2742] px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark]"
          />
        </div>

        <div className="flex min-w-0 flex-col">
          <label className="mb-2 text-[13px] font-semibold tracking-wide text-white/80">
            Local da Compra
          </label>
          <select
            value={novaCompraEvento.local_compras}
            onChange={(e) =>
              setNovaCompraEvento((prev) => ({
                ...prev,
                local_compras: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-white/10 bg-[#1a2742] px-3 py-2.5 text-sm text-white outline-none appearance-none [color-scheme:dark]"
          >
            <option value="" className="bg-[#0f172a] text-white">
              -- Local da Compra --
            </option>
            {locaisCompra.map((local) => (
              <option key={local} value={local} className="bg-[#0f172a] text-white">
                {local}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-0 flex-col">
          <label className="mb-2 text-[13px] font-semibold tracking-wide text-white/80">
            Bancada
          </label>
          <input
            list="bancadas-evento-modal"
            value={novaCompraEvento.bancada}
            onChange={(e) =>
              setNovaCompraEvento((prev) => ({
                ...prev,
                bancada: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-white/10 bg-[#1a2742] px-3 py-2.5 text-sm text-white outline-none"
            placeholder="Bancada"
          />
          <datalist id="bancadas-evento-modal">
            {bancadas.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>

        <div className="flex min-w-0 flex-col">
          <label className="mb-2 text-[13px] font-semibold tracking-wide text-white/80">
            Setor
          </label>
          <input
            list="setores-evento-modal"
            value={novaCompraEvento.setor}
            onChange={(e) =>
              setNovaCompraEvento((prev) => ({
                ...prev,
                setor: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-white/10 bg-[#1a2742] px-3 py-2.5 text-sm text-white outline-none"
            placeholder="Setor"
          />
          <datalist id="setores-evento-modal">
            {setores.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="flex min-w-0 flex-col">
          <label className="mb-2 text-[13px] font-semibold tracking-wide text-white/80">
            Fila
          </label>
          <input
            value={novaCompraEvento.fila}
            onChange={(e) =>
              setNovaCompraEvento((prev) => ({
                ...prev,
                fila: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-white/10 bg-[#1a2742] px-3 py-2.5 text-sm text-white outline-none"
            placeholder="Fila"
          />
        </div>

        <div className="flex min-w-0 flex-col">
          <label className="mb-2 text-[13px] font-semibold tracking-wide text-white/80">
            Quantidade
          </label>
          <input
            type="number"
            value={novaCompraEvento.quantidade}
            onChange={(e) =>
              setNovaCompraEvento((prev) => ({
                ...prev,
                quantidade: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-white/10 bg-[#1a2742] px-3 py-2.5 text-sm text-white outline-none"
            placeholder="Quantidade"
          />
        </div>

        <div className="flex min-w-0 flex-col">
          <label className="mb-2 text-[13px] font-semibold tracking-wide text-white/80">
            Gasto (€)
          </label>
          <input
            type="text"
            value={novaCompraEvento.gasto}
            onChange={(e) =>
              setNovaCompraEvento((prev) => ({
                ...prev,
                gasto: e.target.value,
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const resultado = calcularExpressao(e.target.value);
                setNovaCompraEvento((prev) => ({
                  ...prev,
                  gasto: String(resultado),
                }));
              }
            }}
            className="w-full rounded-xl border border-white/10 bg-[#1a2742] px-3 py-2.5 text-sm text-white outline-none"
            placeholder="Gasto (€)"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => setMostrarModalNovaCompra(false)}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/15"
        >
          Cancelar
        </button>

        <button
          onClick={guardarNovaCompraNoEvento}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500"
        >
          Guardar
        </button>
      </div>
    </div>
  </div>
)}
     {mostrarModalNovaVenda && (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
    <div
      className="w-full max-w-5xl rounded-[24px] border border-white/10 bg-[#0f1b3d] p-5 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Nova Venda</h3>
        <button
          onClick={() => setMostrarModalNovaVenda(false)}
          className="rounded-xl bg-white/10 px-3 py-2 text-white/80 transition hover:bg-white/15 hover:text-white"
        >
          Fechar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-white/80">ID Venda</label>
          <input
            name="id_venda"
            type="number"
            inputMode="numeric"
            placeholder="ID Venda"
            className={`h-10 w-full rounded-xl border px-3 py-2 bg-[#1a2742] text-sm text-white outline-none ${
              idVendaModalEmUso
                ? "border-red-500 focus:ring-2 focus:ring-red-400"
                : "border-white/10 focus:ring-2 focus:ring-blue-400"
            }`}
            value={novaVendaEvento.id_venda}
            onChange={handleNovaVendaEventoChange}
          />
          <div className="mt-1 text-xs min-h-5">
            {idVendaModalEmVerificacao && <span className="text-white/60">A verificar…</span>}
            {!idVendaModalEmVerificacao && idVendaModalEmUso && (
              <span className="text-red-400">⚠️ Este ID já existe.</span>
            )}
            {!idVendaModalEmVerificacao && !idVendaModalEmUso && novaVendaEvento.id_venda && (
              <span className="text-emerald-400">✅ ID disponível.</span>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-white/80">Data Venda</label>
          <input
            name="data_venda"
            type="date"
            className="border border-white/10 p-2 rounded-xl w-full bg-[#1a2742] text-white [color-scheme:dark]"
            value={novaVendaEvento.data_venda}
            onChange={handleNovaVendaEventoChange}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-white/80">Data Evento</label>
          <input
            name="data_evento"
            type="date"
            className="border border-white/10 p-2 rounded-xl w-full bg-[#1a2742] text-white [color-scheme:dark]"
            value={novaVendaEvento.data_evento}
            onChange={handleNovaVendaEventoChange}
          />
          {datasEventoVendasModal.length > 0 && (
            <div className="mt-1 text-xs text-white/70">
              Datas existentes (clique para preencher):
              <ul className="list-disc list-inside">
                {datasEventoVendasModal.map((d, idx) => {
                  const yyyyMMdd = new Date(d).toISOString().split("T")[0];
                  return (
                    <li
                      key={idx}
                      onClick={() =>
                        setNovaVendaEvento((prev) => ({
                          ...prev,
                          data_evento: yyyyMMdd,
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

        <div className="flex flex-col">
          <label className="text-sm font-medium text-white/80">Evento</label>
          <select
            name="evento"
            className="border border-white/10 p-2 rounded-xl w-full bg-[#1a2742] text-white"
            value={novaVendaEvento.evento}
            onChange={handleNovaVendaEventoChange}
          >
            <option value="">-- Selecionar Evento --</option>
            {eventosDropdown.map((e) => (
              <option key={e.id} value={e.nome}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col md:col-span-2 xl:col-span-1">
          <label className="text-sm font-medium text-white/80">Bilhete</label>
          <input
            name="estadio"
            placeholder="Bilhete"
            className="border border-white/10 p-2 rounded-xl w-full bg-[#1a2742] text-white"
            value={novaVendaEvento.estadio}
            onChange={handleNovaVendaEventoChange}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-white/80">Ganho (€)</label>
          <input
            name="ganho"
            type="text"
            placeholder="Ganho (€)"
            className="border border-white/10 p-2 rounded-xl w-full bg-[#1a2742] text-white"
            value={novaVendaEvento.ganho}
            onChange={handleNovaVendaEventoChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const resultado = calcularExpressao(e.target.value);
                setNovaVendaEvento((prev) => ({
                  ...prev,
                  ganho: String(resultado),
                }));
              }
            }}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-white/80">Estado</label>
          <select
            name="estado"
            className="border border-white/10 p-2 rounded-xl w-full bg-[#1a2742] text-white"
            value={novaVendaEvento.estado}
            onChange={handleNovaVendaEventoChange}
          >
            <option value="Entregue">Entregue</option>
            <option value="Por entregar">Por entregar</option>
            <option value="Disputa">Disputa</option>
            <option value="Pago">Pago</option>
          </select>
        </div>
      </div>

      <button
        onClick={guardarNovaVendaNoEvento}
        disabled={idVendaModalEmUso || !novaVendaEvento.id_venda}
        className={`mt-4 px-4 py-2 rounded-xl transition-colors duration-300 text-white ${
          idVendaModalEmUso || !novaVendaEvento.id_venda
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        Guardar Registo
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

            <label className="block text-sm font-medium mt-3 mb-1">
              VIAGOGO:
            </label>
            <input
              type="url"
              inputMode="url"
              value={urlEventoTmp}
              onChange={(e) => setUrlEventoTmp(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900"
              placeholder="ex.: https://www.viagogo.pt/... ou viagogo.pt/..."
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
                  
                    const urlNorm = urlEventoTmp?.trim() ? normalizeUrl(urlEventoTmp) : null;
                  
                    // 👇 Envia o OBJETO COMPLETO + os novos campos
                    const payload = {
                      ...eventoAtual,
                      nota_evento: notaEventoTmp,
                      url_evento: urlNorm,
                      url: urlNorm, // cobre o caso do backend usar 'url'
                    };
                  
                    try {
                      const res = await fetch(`https://controlo-bilhetes.onrender.com/eventos_completos2/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      });
                  
                      if (!res.ok) {
                        // ajuda a diagnosticar caso volte a falhar
                        const txt = await res.text().catch(() => "");
                        console.error("Falha no PUT:", res.status, txt);
                        throw new Error("Falha ao gravar nota/URL");
                      }
                  
                      // Atualiza no estado local para refletir de imediato
                      setRegistos(prev =>
                        prev.map(x =>
                          x.id === id ? { ...x, nota_evento: payload.nota_evento, url_evento: payload.url_evento } : x
                        )
                      );
                      setMostrarNotaEventoId(null);
                    } catch (e) {
                      toast.error("Não foi possível guardar a nota/URL do evento.");
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
{/* ✅ MODAL ESTÁDIO */}
{mostrarEstadioId && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div
      className="w-full max-w-md rounded-2xl bg-gray-900 p-5 text-white"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="mb-4 text-lg font-bold">Editar Estádio</h3>

      <input
        value={estadioTmp}
        onChange={(e) => setEstadioTmp(e.target.value)}
        className="mb-4 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-white"
        placeholder="Nome do estádio"
      />

      <div className="flex justify-end gap-3">
        <button onClick={() => setMostrarEstadioId(null)}>
          Cancelar
        </button>

        <button
          onClick={() => {
            atualizarCampo(mostrarEstadioId, "estadio", estadioTmp);
            setMostrarEstadioId(null);
          }}
          className="rounded-xl bg-blue-500 px-4 py-2 text-white"
        >
          Guardar
        </button>
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


