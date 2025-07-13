import { useState } from "react";
import Papa from "papaparse";

export default function ComparadorViagogo() {
  const [dadosCSV, setDadosCSV] = useState([]);
  const [cabecalhos, setCabecalhos] = useState([]);
  const [comparacoes, setComparacoes] = useState([]);

  const handleFicheiro = (e) => {
    const ficheiro = e.target.files[0];
    if (!ficheiro) return;

    const reader = new FileReader();
    reader.onload = () => {
      Papa.parse(reader.result, {
        header: true,
        skipEmptyLines: true,
        delimiter: ";",
        complete: (resultado) => {
          setDadosCSV(resultado.data);
          setCabecalhos(Object.keys(resultado.data[0]));
        },
      });
    };
    reader.readAsText(ficheiro, "utf-16le");
  };

  const enviarParaComparacao = async () => {
    const resposta = await fetch("/api/comparar_listagens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listagens: dadosCSV }),
    });
    const resultado = await resposta.json();
    setComparacoes(resultado);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Comparador de Listagens Viagogo</h1>

      <input type="file" accept=".csv" onChange={handleFicheiro} className="mb-2" />

      {dadosCSV.length > 0 && (
        <>
          <button
            onClick={enviarParaComparacao}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Comparar com Viagogo
          </button>

          <div className="mt-4 rounded-2xl shadow p-4 bg-white dark:bg-gray-900">
            <div className="p-2 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    {cabecalhos.map((cab, idx) => (
                      <th key={idx} className="text-left p-2 border-b dark:border-gray-700 dark:text-white">{cab}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dadosCSV.map((linha, idx) => (
                    <tr key={idx} className="border-b dark:border-gray-700">
                      {cabecalhos.map((cab, i) => (
                        <td key={i} className="p-2 dark:text-white">{linha[cab]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {comparacoes.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Resultados da Comparação</h2>
          <div className="mt-2 rounded-2xl shadow p-4 bg-white dark:bg-gray-900">
            <div className="p-2 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2 border-b dark:border-gray-700 dark:text-white">Evento</th>
                    <th className="text-left p-2 border-b dark:border-gray-700 dark:text-white">Setor</th>
                    <th className="text-left p-2 border-b dark:border-gray-700 dark:text-white">Teu Preço (€)</th>
                    <th className="text-left p-2 border-b dark:border-gray-700 dark:text-white">Concorrência (€)</th>
                    <th className="text-left p-2 border-b dark:border-gray-700 dark:text-white">Sugestão</th>
                  </tr>
                </thead>
                <tbody>
                  {comparacoes.map((item, idx) => (
                    <tr key={idx} className="border-b dark:border-gray-700">
                      <td className="p-2 dark:text-white">{item.evento}</td>
                      <td className="p-2 dark:text-white">{item.setor}</td>
                      <td className="p-2 dark:text-white">{item.teu_preco}</td>
                      <td className="p-2 dark:text-white">{item.concorrente_preco}</td>
                      <td className="p-2 dark:text-white">{item.sugestao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
