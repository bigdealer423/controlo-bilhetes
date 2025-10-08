// src/utils/epocas.ts
export const EPOCA_INICIO_MES = 7;   // 1 = Jan, 7 = Jul
export const EPOCA_INICIO_DIA = 1;   // 1 de Julho
// Regra: Época YYYY/YYYY+1 vai de 1-Jul-YYYY a 30-Jun-(YYYY+1)

export function epocaDeData(d: Date) {
  const y = d.getFullYear();
  const inicioEpocaAtual = new Date(y, EPOCA_INICIO_MES - 1, EPOCA_INICIO_DIA);
  if (d >= inicioEpocaAtual) return `${y}/${y + 1}`;
  return `${y - 1}/${y}`;
}

export function epocaAtualHoje() {
  return epocaDeData(new Date());
}

/** Gera lista de épocas existentes com base nas datas dos eventos */
export function gerarEpocasAPartirDeDatas(datasISO: string[], incluirTodas = true) {
  const set = new Set<string>();
  for (const iso of datasISO) {
    if (!iso) continue;
    const d = new Date(iso);
    if (isNaN(d.getTime())) continue;
    set.add(epocaDeData(d));
  }
  const arr = Array.from(set).sort((a, b) => {
    // ordena decrescente por ano inicial
    const ay = parseInt(a.slice(0, 4), 10);
    const by = parseInt(b.slice(0, 4), 10);
    return by - ay;
  });
  return incluirTodas ? ["Todas", ...arr] : arr;
}
