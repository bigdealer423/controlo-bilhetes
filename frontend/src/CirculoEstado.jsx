import { useState } from "react";
import { FaCircle } from "react-icons/fa";
import { Tooltip } from "@radix-ui/react-tooltip";


export default function CirculoEstado({ tipo, id, texto_estado, nota_estado }) {
  const [cor, setCor] = useState(texto_estado || "cinzento");
  const [nota, setNota] = useState(nota_estado || "");
  const [editar, setEditar] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const atualizarBackend = async () => {
    // Determinar o endpoint correto
    const endpoint = tipo === "listagem_vendas" ? "listagem_vendas" : "compras";

    // Buscar os dados atuais do registo
    const res = await fetch(`https://controlo-bilhetes.onrender.com/${endpoint}/${id}`);
    if (!res.ok) {
      setMensagem("❌ Erro ao buscar dados.");
      return;
    }
    const dadosAtuais = await res.json();

    // Atualizar os dados
    const atualizados = {
      ...dadosAtuais,
      [`circulo_estado_${tipo === "listagem_vendas" ? "venda" : "compra"}`]: cor,
      [`nota_estado_${tipo === "listagem_vendas" ? "venda" : "compra"}`]: nota
    };

    const resposta = await fetch(`https://controlo-bilhetes.onrender.com/${endpoint}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(atualizados)
    });

    if (resposta.ok) {
      setMensagem("✅ Guardado");
      setTimeout(() => setMensagem(""), 2000);
    } else {
      setMensagem("❌ Erro ao guardar.");
    }
  };

  return (
    <div className="flex flex-col gap-1 items-start">
      <div className="flex items-center gap-2">
        {/* Círculos */}
        {["vermelho", "verde", "cinzento"].map((c) => (
          <button
            key={c}
            className={`w-4 h-4 rounded-full border ${c === "vermelho" ? "bg-red-500" : c === "verde" ? "bg-green-500" : "bg-gray-400"}`}
            onClick={() => {
              setCor(c);
              setEditar(true);
            }}
          />
        ))}
        <button onClick={atualizarBackend} className="text-sm ml-2">💾</button>
        {mensagem && <span className="text-xs text-gray-600">{mensagem}</span>}
      </div>

      {/* Área de Nota */}
      {editar && (
        <textarea
          className="border rounded text-sm p-1 mt-1 w-full"
          value={nota}
          placeholder="Nota..."
          onChange={(e) => setNota(e.target.value)}
        />
      )}
    </div>
  );
}
