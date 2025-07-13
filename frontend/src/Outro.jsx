import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
          delimiter: ";", // ← importante para números com vírgula decimal
          complete: (resultado) => {
            setDadosCSV(resultado.data);
            setCabecalhos(Object.keys(resultado.data[0]));
          },
        });
      };
      reader.readAsText(ficheiro, "ISO-8859-1"); // ← encoding correto
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
          <Button onClick={enviarParaComparacao}>Comparar com Viagogo</Button>

          <Card className="mt-4">
            <CardContent className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    {cabecalhos.map((cab, idx) => (
                      <th key={idx} className="text-left p-2 border-b dark:border-gray-700">{cab}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dadosCSV.map((linha, idx) => (
                    <tr key={idx} className="border-b dark:border-gray-700">
                      {cabecalhos.map((cab, i) => (
                        <td key={i} className="p-2">{linha[cab]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      {comparacoes.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Resultados da Comparação</h2>
          <Card className="mt-2">
            <CardContent className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2 border-b dark:border-gray-700">Evento</th>
                    <th className="text-left p-2 border-b dark:border-gray-700">Setor</th>
                    <th className="text-left p-2 border-b dark:border-gray-700">Teu Preço (€)</th>
                    <th className="text-left p-2 border-b dark:border-gray-700">Concorrência (€)</th>
                    <th className="text-left p-2 border-b dark:border-gray-700">Sugestão</th>
                  </tr>
                </thead>
                <tbody>
                  {comparacoes.map((item, idx) => (
                    <tr key={idx} className="border-b dark:border-gray-700">
                      <td className="p-2">{item.evento}</td>
                      <td className="p-2">{item.setor}</td>
                      <td className="p-2">{item.teu_preco}</td>
                      <td className="p-2">{item.concorrente_preco}</td>
                      <td className="p-2">{item.sugestao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
