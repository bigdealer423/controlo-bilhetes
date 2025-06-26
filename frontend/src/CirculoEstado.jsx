import { useEffect, useState } from "react";

export default function CirculoEstado({ tipo, id, texto_estado = "", nota_estado = "", editavel = true }) {
  const [cor, setCor] = useState(texto_estado || "cinzento");
  const [nota, setNota] = useState(nota_estado || "");

  useEffect(() => {
    setCor(texto_estado || "cinzento");
    setNota(nota_estado || "");
  }, [texto_estado, nota_estado]);

  const atualizarBD = async (novaCor, novaNota) => {
    const url = `https://controlo-bilhetes.onrender.com/${tipo}/${id}`;
    const body = tipo === "compras"
      ? { circulo_estado_compra: novaCor, nota_estado_compra: novaNota }
      : { circulo_estado_venda: novaCor, nota_estado_venda: novaNota };

    try {
      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch (error) {
      console.error("Erro ao atualizar círculo/nota:", error);
    }
  };

  const handleChangeCor = (novaCor) => {
    setCor(novaCor);
    atualizarBD(novaCor, nota);
  };

  const handleNotaChange = (e) => {
    const novaNota = e.target.value;
    setNota(novaNota);
    atualizarBD(cor, novaNota);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {["cinzento", "verde", "vermelho"].map(c => (
          <button
            key={c}
            onClick={() => handleChangeCor(c)}
            className={`w-4 h-4 rounded-full border ${
              c === "verde" ? "bg-green-500" :
              c === "vermelho" ? "bg-red-500" :
              "bg-gray-400"
            } ${cor === c ? "ring-2 ring-black" : ""}`}
          />
        ))}
      </div>
      {editavel && (
        <input
          className="input text-xs max-w-[120px]"
          placeholder="Nota"
          value={nota}
          onChange={handleNotaChange}
        />
      )}
    </div>
  );
} 
