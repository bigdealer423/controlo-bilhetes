// src/utils/resumoEventos.js

const limpar = (s = "") =>
  String(s)
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const canonFamilia = (w = "") => {
  const x = String(w).toLowerCase().normalize("NFKC").trim();

  if (x === "lower" || x === "piso 0" || x === "piso zero" || x === "p0") return "Lower";
  if (x === "middle" || x === "piso 1" || x === "piso um" || x === "piso primeiro" || x === "p1") return "Middle";
  if (x === "upper" || x === "piso 3" || x === "piso tres" || x === "piso três" || x === "p3") return "Upper";

  if (x === "sector" || x === "setor" || x === "section" || x === "secao" || x === "seção" || x === "secção")
    return "Setor";

  if (x === "block" || x === "bloco") return "Block";
  if (x === "stand" || x === "bancada") return "Stand";
  if (x === "tribuna") return "Tribuna";
  if (x === "ring" || x === "anel") return "Ring";
  if (x === "tier" || x === "nivel" || x === "nível" || x === "level") return "Level";
  if (x === "nascente") return "Nascente";
  if (x === "poente") return "Poente";
  if (x === "norte") return "Norte";
  if (x === "sul") return "Sul";

  return w;
};

const setorExato = (txt = "") => {
  let s = limpar(txt);

  s = s.replace(/\([^)]*\)\s*$/g, "").trim();
  s = s.split(",")[0].split(" - ")[0].split(";")[0].trim();
  s = s.replace(/\b(Fila|Row|Gate|Porta|Entrada|Door|Seat|Lugar)\b.*$/i, "").trim();

  s = s.replace(/\b(piso\s*zero|piso\s*0|p0)\b/gi, "Lower");
  s = s.replace(/\b(middle|piso\s*1|piso\s*um|piso\s*primeiro|p1)\b/gi, "Middle");
  s = s.replace(/\b(upper|piso\s*3|piso\s*tr[eê]s|p3)\b/gi, "Upper");

  s = s.replace(/\b(section|sect(?:ion)?|sec(?:ção|cao|cç?ao)?|sector|setor)\b/gi, "Setor");
  s = s.replace(/\bSetor\s+(Lower|Middle|Upper)\b/gi, "$1");

  s = s.replace(/\bmais\s+vantagens\b/gi, "");
  s = s.replace(/\bemirates\b/gi, "");
  s = s.replace(/\b(continente|worten|fnac|loja|online|site)\b/gi, "");
  s = s.replace(/\s*-+\s*$/g, "").trim();
  s = s.replace(/\s{2,}/g, " ");

  const m = s.match(/^([A-Za-zÀ-ÿ]+)(?:\s+(.*))?$/);
  if (m) {
    const fam = canonFamilia(m[1]);
    let resto = (m[2] || "").trim();
    resto = resto.replace(/\b0+(\d+)\b/g, "$1");
    s = resto ? `${fam} ${resto}` : fam;
  }

  if (/^devolu/i.test(s)) return "Devolução";
  return s || "Outros";
};

const setorGrupo = (txt = "") => {
  let s = limpar(txt);

  s = s.replace(/\([^)]*\)\s*$/g, "").trim();
  s = s.split(",")[0].split(" - ")[0].split(";")[0].trim();
  s = s.replace(/\b(Fila|Row|Gate|Porta|Entrada|Door|Seat|Lugar)\b.*$/i, "").trim();

  s = s.replace(/\bmais\s+vantagens\b/gi, "");
  s = s.replace(/\bemirates\b/gi, "");
  s = s.replace(/\b(continente|worten|fnac|loja|online|site)\b/gi, "");
  s = s.replace(/\s{2,}/g, " ").trim();

  s = s.replace(/\b(piso\s*zero|piso\s*0|p0)\b/gi, "Lower");
  s = s.replace(/\b(middle|piso\s*1|piso\s*um|piso\s*primeiro|p1)\b/gi, "Middle");
  s = s.replace(/\b(upper|piso\s*3|piso\s*tr[eê]s|p3)\b/gi, "Upper");

  s = s.replace(/\b(section|sect(?:ion)?|sec(?:ção|cao|cç?ao)?|sector|setor)\b/gi, "Setor");
  s = s.replace(/\bSetor\s+(Lower|Middle|Upper)\b/gi, "$1");
  s = s.replace(/\s{2,}/g, " ").trim();

  if (!s) return "Outros";

  const famMatch = s.match(/^(Lower|Middle|Upper|Setor|Block|Stand|Tribuna|Ring|Level|Nascente|Poente|Norte|Sul)\b/i);
  if (famMatch) return canonFamilia(famMatch[1]);

  const primeiroToken = s.match(/^([A-Za-zÀ-ÿ]+)\b/);
  if (primeiroToken) return canonFamilia(primeiroToken[1]);

  return s;
};

const qtdBilhetes = (txt = "") => {
  const s = String(txt).trim();
  if (/^\d+$/.test(s)) return Number(s);
  const m = s.match(/\((\d+)\s*Bilhetes?\)/i);
  return m ? Number(m[1]) : 0;
};

const ALIASES_EQUIPAS_CASA = {
  "casa pia": "Casa Pia",
  "casa pia ac": "Casa Pia",
  "casa pia a.c.": "Casa Pia",
  "casa pia atletico clube": "Casa Pia",
  "casa pia atlético clube": "Casa Pia",
  "az": "AZ Alkmaar",
  "az alkmaar": "AZ Alkmaar",
  "sl benfica": "SL Benfica",
  benfica: "SL Benfica",
  sporting: "Sporting CP",
  "sporting cp": "Sporting CP",
  "fc porto": "FC Porto",
  porto: "FC Porto",
};

const normalizarNomeEquipa = (s = "") =>
  limpar(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.\-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const extrairEquipaCasaRaw = (evento = "") => {
  const s = limpar(evento);
  const partes = s.split(/\bvs\b/i).map((p) => limpar(p)).filter(Boolean);
  return partes[0] || s;
};

export const getEquipaCasaCanonica = (evento = "") => {
  const raw = extrairEquipaCasaRaw(evento);
  const norm = normalizarNomeEquipa(raw);

  if (ALIASES_EQUIPAS_CASA[norm]) return ALIASES_EQUIPAS_CASA[norm];

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
      nascente: "Nascente",
      "bancada poente": "Poente",
      poente: "Poente",
      "bancada norte": "Norte",
      norte: "Norte",
      "bancada sul": "Sul",
      sul: "Sul",
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
      nascente: "Nascente",
      "bancada poente": "Poente",
      poente: "Poente",
      "bancada norte": "Norte",
      norte: "Norte",
      "bancada sul": "Sul",
      sul: "Sul",
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

  for (const [alias, canonical] of Object.entries(regras.aliasesTexto || {})) {
    if (bruto.includes(alias)) return canonical;
  }

  const exato = setorExato(txt).replace(/^Setor\s+/i, "").trim();
  const exatoLower = exato.toLowerCase();

  for (const [alias, canonical] of Object.entries(regras.aliasesTexto || {})) {
    if (exatoLower === alias || exatoLower.includes(alias)) return canonical;
  }

  const mNumeroPuro = exato.match(/^(\d{1,2})$/);
  if (mNumeroPuro) return regras.numerosParaLabel?.[mNumeroPuro[1]] || exato;

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

const mapVendasPorSetorExato = (evento, data_evento, estadioNome = "", registosVendas = []) => {
  const arr = registosVendas.filter(
    (v) => v.evento === evento && v.data_evento === data_evento
  );
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

const mapComprasPorSetorExato = (evento, data_evento, estadioNome = "", registosCompras = []) => {
  const arr = registosCompras.filter(
    (c) => c.evento === evento && c.data_evento === data_evento
  );
  const map = new Map();

  for (const c of arr) {
    const key = compraChaveOperacionalExata(c, estadioNome);
    const qtd = Number(c.quantidade || 0);
    if (!qtd) continue;

    map.set(key, (map.get(key) || 0) + qtd);
  }

  return map;
};

export const getResumoMatchingInteligente = (
  evento,
  data_evento,
  chaveRegra = "",
  registosCompras = [],
  registosVendas = []
) => {
  const vendasExatas = mapVendasPorSetorExato(
    evento,
    data_evento,
    chaveRegra,
    registosVendas
  );

  const comprasExatas = mapComprasPorSetorExato(
    evento,
    data_evento,
    chaveRegra,
    registosCompras
  );

  const regrasCobertura = getRegrasCobertura(chaveRegra);

  const faltas = new Map();
  const sobras = new Map();

  const chavesExatas = new Set([
    ...vendasExatas.keys(),
    ...comprasExatas.keys(),
  ]);

  for (const key of chavesExatas) {
    const qV = vendasExatas.get(key) || 0;
    const qC = comprasExatas.get(key) || 0;

    if (qV > qC) faltas.set(key, qV - qC);
    if (qC > qV) sobras.set(key, qC - qV);
  }

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
