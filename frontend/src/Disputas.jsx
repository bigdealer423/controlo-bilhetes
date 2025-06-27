// src/Disputas.jsx

import { useEffect, useState } from "react";
import { FiEdit, FiTrash, FiFileText } from "react-icons/fi";
import Modal from "./Modal";

export default function Disputas() {
  const [disputas, setDisputas] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [disputaSelecionada, setDisputaSelecionada] = useState(null);

  useEffect(() => {
    fetchDisputas();
  }, []);

  const fetchDisputas = async () => {
    try {
      const res = await fetch("https://controlo-bilhetes.onrender.com/disputas");
      const data = await res.json();
      setDisputas(data);
    } catch (err) {
      console.error("Erro ao carregar disputas:", err);
    }
  };

  const abrirModal = (disputa) => {
    setDisputaSelecionada(disputa);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setDisputaSelecionada(null);
    fetchDisputas();
  };

  const eliminarDisputa = async (id) => {
    if (!confirm("Tem a certeza que pretende eliminar esta disputa?")) return;
    try {
      await fetch(`https://controlo-bilhetes.onrender.com/disputas/${id}`, {
        method: "DELETE",
      });
      fetchDisputas();
    } catch (err) {
      console.error("Erro ao eliminar disputa:", err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Aba Disputas</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 border">ID Venda</th>
              <th className="px-2 py-1 border">Data Evento</th>
              <th className="px-2 py-1 border">Evento</th>
              <th className="px-2 py-1 border">Bilhetes</th>
              <th className="px-2 py-1 border">Ganho</th>
              <th className="px-2 py-1 border">Cobrança</th>
              <th className="px-2 py-1 border">Estado</th>
              <th className="px-2 py-1 border">Data Disputa</th>
              <th className="px-2 py-1 border">Ações</th>
            </tr>
          </thead>
          <tbody>
            {disputas.map((disputa) => (
              <tr key={disputa.id} className="hover:bg-gray-50">
                <td className="px-2 py-1 border text-center">{disputa.id_venda}</td>
                <td className="px-2 py-1 border text-center">{disputa.data_evento}</td>
                <td className="px-2 py-1 border text-center">{disputa.evento}</td>
                <td className="px-2 py-1 border text-center">{disputa.bilhetes}</td>
                <td className="px-2 py-1 border text-center">{disputa.ganho}€</td>
                <td className="px-2 py-1 border text-center">{disputa.cobranca || "-"}</td>
                <td className="px-2 py-1 border text-center">{disputa.estado || "-"}</td>
                <td className="px-2 py-1 border text-center">{disputa.data_disputa || "-"}</td>
                <td className="px-2 py-1 border flex justify-center gap-2">
                  <button
                    onClick={() => abrirModal(disputa)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FiEdit />
                  </button>
                  <button
                    onClick={() => eliminarDisputa(disputa.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FiTrash />
                  </button>
                  {disputa.ficheiros && (
                    <button
                      onClick={() => abrirModal(disputa)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <FiFileText />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <Modal disputa={disputaSelecionada} fechar={fecharModal} />
      )}
    </div>
  );
}
