import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ComparadorViagogo() {
  const [dadosCSV, setDadosCSV] = useState([]);
  const [comparacoes, setComparacoes] = useState([]);

  const handleFicheiro = (e) => {
    const ficheiro = e.target.files[0];
    if (!ficheiro) return;

    const reader = new FileReader();
    reader.onload = () => {
      Papa.parse(reader.result, {
        header: true,
        skipEmptyLines: true,
        delimiter: ",",
        quoteChar: '"',
        complete: (resultado) => {
          const limpos = resultado.data.map((linha) => ({
            evento: linha.EventName?.replace(/"/g, "") || "",
            setor: linha.Section?.replace(/"/g, "") || "",
            qtd: linha.Qty || "",
            preco: (linha.PricePerTicketAmount || "").replace(",", "."),
            ganho: (linha.PayoutPerTicketAmount || "").replace(",", "."),
            fimVenda: (linha.SaleEnds || "").split("T")[0],
          }));
          setDadosCSV(limpos);
        },
      });
    };
    reader.readAsText(ficheiro, "ISO-8859-1");
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
                    <th className="text-left p-2 border-b dark:border-gray-700">Evento</th>
                    <th className="text-left p-2 border-b dark:border-gray-700">Setor</th>
                    <th className="text-left p-2 border-b dark:border-gray-700">Qtd</th>
                    <th className="text-left p-2 border-b dark:border-gray-700">Preço (€)</th>
                    <th className="text-left p-2 border-b dark:border-gray-700">Ganho (€)</th>
                    <th className="text-left p-2 border-b dark:border-gray-700">Venda termina</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosCSV.map((linha, idx) => (
                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <td className="p-2">{linha.evento}</td>
                      <td className="p-2">{linha.setor}</td>
                      <td className="p-2">{linha.qtd}</td>
                      <td className="p-2">{linha.preco}</td>
                      <td className="p-2">{linha.ganho}</td>
                      <td className="p-2">{linha.fimVenda}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
