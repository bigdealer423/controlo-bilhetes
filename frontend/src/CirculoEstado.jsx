
import { useState } from "react";
import { FaCircle } from "react-icons/fa";

export default function CirculoEstado({ corInicial = "cinzento", notaInicial = "", onAtualizar }) {
  const [cor, setCor] = useState(corInicial);
  const [nota, setNota] = useState(notaInicial);
  const [editando, setEditando] = useState(false);

  const cores = {
    vermelho: "#e3342f",
    verde: "#38a169",
    cinzento: "#a0aec0",
  };

  const proximaCor = {
    cinzento: "vermelho",
    vermelho: "verde",
    verde: "cinzento",
  };

  const mudarCor = () => {
    const novaCor = proximaCor[cor];
    setCor(novaCor);
    if (onAtualizar) onAtualizar(novaCor, nota);
  };

  const handleNotaChange = (e) => {
    const novaNota = e.target.value;
    setNota(novaNota);
  };

  const handleNotaBlur = () => {
    setEditando(false);
    if (onAtualizar) onAtualizar(cor, nota);
  };

  return (
    <div className="flex items-center gap-2">
      <FaCircle
        className="cursor-pointer"
        color={cores[cor]}
        onClick={mudarCor}
        title="Clique para mudar a cor"
      />
      {editando ? (
        <input
          type="text"
          className="text-sm px-1 border rounded"
          value={nota}
          onChange={handleNotaChange}
          onBlur={handleNotaBlur}
          autoFocus
        />
      ) : (
        <span
          onClick={() => setEditando(true)}
          className="text-xs text-gray-600 cursor-pointer"
          title="Clique para editar a nota"
        >
          {nota || "Clique para adicionar nota"}
        </span>
      )}
    </div>
  );
}
