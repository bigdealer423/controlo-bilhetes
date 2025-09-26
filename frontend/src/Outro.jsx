
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
    try {
      const uint8Array = new Uint8Array(reader.result);

      // ✅ usar utf-16le explicitamente!
      const text = new TextDecoder("utf-16le").decode(uint8Array);

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        delimiter: ",",
        complete: (resultado) => {
          const limpos = resultado.data.map((linha) => {
            const keys = Object.keys(linha);
            if (keys.length === 1) {
              try {
                const jsonStr = linha[keys[0]];
                const obj = JSON.parse(jsonStr);
                return obj;
              } catch (erro) {
                console.error("Erro ao fazer parse JSON de linha:", linha);
                return {};
              }
            }
            return linha;
          });


          console.log("CORRIGIDO:", limpos);
          setDadosCSV(limpos);
        },
      });
    } catch (erro) {
      console.error("Erro ao processar ficheiro:", erro);
    }
  };

  reader.readAsArrayBuffer(ficheiro); // ← essencial!
};


  const enviarParaComparacao = async () => {
  const resposta = await fetch("https://controlo-bilhetes.onrender.com/api/comparar_listagens", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ listagens: dadosCSV }),
  });


  if (!resposta.ok) {
    console.error("Erro na resposta:", resposta.status);
    return;
  }

  const texto = await resposta.text();
  if (!texto) {
    console.warn("Resposta vazia");
    return;
  }

  try {
    const resultado = JSON.parse(texto);
    setComparacoes(resultado);
  } catch (erro) {
    console.error("Erro ao fazer parse do JSON:", erro);
    console.log("Conteúdo recebido:", texto);
  }
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
                      <td className="p-2">{linha.EventName}</td>
                      <td className="p-2">{linha.Section}</td>
                      <td className="p-2">{linha.Qty}</td>
                      <td className="p-2">{linha.PricePerTicketAmount}</td>
                      <td className="p-2">{linha.PayoutPerTicketAmount}</td>
                      <td className="p-2">{linha.SaleEnds?.split("T")[0]}</td>
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
