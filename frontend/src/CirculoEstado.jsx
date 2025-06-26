import { useState } from "react";
import { FaCircle } from "react-icons/fa";
import { Tooltip } from "@radix-ui/react-tooltip";

const cores = {
  cinzento: "text-gray-400",
  verde: "text-green-500",
  vermelho: "text-red-500",
};

export default function CirculoEstado({ tipo, id, texto_estado, nota_estado }) {
  const [cor, setCor] = useState(texto_estado || "cinzento");
  const [nota, setNota] = useState(nota_estado || "");
  const [editando, setEditando] = useState(false);

  const API_URL = "https://controlo-bilhetes.onrender.com";

  const atualizarEstado = async (novaCor, novaNota) => {
    try {
      const endpoint = tipo === "listagem_vendas"
        ? `${API_URL}/listagem_vendas/${id}`
        : `${API_URL}/compras/${id}`;

      // Buscar os dados atuais antes de atualizar
      const res = await fetch(endpoint);
      const dadosAtuais = await res.json();

      const payloadAtualizado = {
        ...dadosAtuais,
        [tipo === "listagem_vendas" ? "circulo_estado_venda" : "circulo_estado_compra"]: novaCor,
        [tipo === "listagem_vendas" ? "nota_estado_venda" : "nota_estado_compra"]: novaNota,
      };

      const metodo = "PUT";
      await fetch(endpoint, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadAtualizado),
      });

      setCor(novaCor);
      setNota(novaNota);
    } catch (erro) {
      console.error("Erro ao atualizar estado:", erro);
    }
  };

  const handleCorClick = (novaCor) => {
    atualizarEstado(novaCor, nota);
  };

  const handleNotaChange = (e) => setNota(e.target.value);

  const handleGuardarNota = () => {
    atualizarEstado(cor, nota);
    setEditando(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Tooltip com campo de texto */}
      <Tooltip>
        <div className="relative group">
          <FaCircle
            className={`cursor-pointer ${cores[cor]} text-lg`}
            onClick={() => setEditando((e) => !e)}
          />
          <div className="absolute left-8 z-10 hidden group-hover:flex flex-col p-2 rounded-md shadow bg-white border text-sm w-60">
            <textarea
              className="border rounded p-1 text-sm"
              placeholder="Nota..."
              value={nota}
              onChange={handleNotaChange}
              rows={3}
            />
            <button
              onClick={handleGuardarNota}
              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Guardar Nota
            </button>
          </div>
        </div>
      </Tooltip>

      {/* Alternador de cor se estiver em modo edição */}
      {editando && (
        <div className="flex gap-2">
          <FaCircle
            className="text-green-500 cursor-pointer"
            onClick={() => handleCorClick("verde")}
          />
          <FaCircle
            className="text-red-500 cursor-pointer"
            onClick={() => handleCorClick("vermelho")}
          />
          <FaCircle
            className="text-gray-400 cursor-pointer"
            onClick={() => handleCorClick("cinzento")}
          />
        </div>
      )}
    </div>
  );
}
