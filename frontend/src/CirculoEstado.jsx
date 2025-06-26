import { useState } from "react";

export default function CirculoEstado({ tipo, id, texto_estado, nota_estado }) {
  const [cor, setCor] = useState(texto_estado || "cinzento");
  const [nota, setNota] = useState(nota_estado || "");
  const [mensagem, setMensagem] = useState("");

  const cores = ["verde", "vermelho", "cinzento"];

  const proximaCor = () => {
    const atualIndex = cores.indexOf(cor);
    const novaCor = cores[(atualIndex + 1) % cores.length];
    setCor(novaCor);
  };

  const guardarAlteracoes = async () => {
    const endpoint = tipo === "listagem_vendas" ? "listagem_vendas" : "compras";
    const campoCor = tipo === "listagem_vendas" ? "circulo_estado_venda" : "circulo_estado_compra";
    const campoNota = tipo === "listagem_vendas" ? "nota_estado_venda" : "nota_estado_compra";

    const res = await fetch(`https://controlo-bilhetes.onrender.com/${endpoint}/${id}`);
    if (!res.ok) {
      setMensagem("❌ Erro ao buscar dados.");
      return;
    }

    const dados = await res.json();

    const atualizados = {
      ...dados,
      [campoCor]: cor,
      [campoNota]: nota
    };

    const resposta = await fetch(`https://controlo-bilhetes.onrender.com/${endpoint}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(atualizados)
    });

    if (resposta.ok) {
      setMensagem("✅");
      setTimeout(() => setMensagem(""), 2000);
    } else {
      setMensagem("❌");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Círculo com clique para mudar cor */}
      <button
        onClick={proximaCor}
        className={`w-4 h-4 rounded-full border cursor-pointer ${
          cor === "verde" ? "bg-green-500" : cor === "vermelho" ? "bg-red-500" : "bg-gray-400"
        }`}
        title="Clique para alterar cor"
      />

      {/* Campo de nota visível sempre */}
      <textarea
        className="border rounded text-sm p-1 w-32 resize-none"
        value={nota}
        placeholder="Nota..."
        onChange={(e) => setNota(e.target.value)}
      />

      {/* Botão para guardar */}
      <button onClick={guardarAlteracoes} title="Guardar alterações">💾</button>

      {/* Mensagem de feedback */}
      {mensagem && <span className="text-xs text-gray-500">{mensagem}</span>}
    </div>
  );
}
