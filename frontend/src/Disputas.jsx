import { useState, useEffect } from "react";

export default function Disputas() {
  const [disputas, setDisputas] = useState([]);

  useEffect(() => {
    const fetchDisputas = async () => {
      try {
        const response = await fetch("https://controlo-bilhetes.onrender.com/disputas");
        const result = await response.json();
        setDisputas(result);
      } catch (err) {
        console.error("Erro ao buscar disputas:", err);
      }
    };
    
    fetchDisputas();
  }, []);

  return (
    <div className="container mx-auto my-4">
      <h2 className="text-xl font-bold mb-4">Disputas</h2>
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-4 py-2 border-b text-left">ID Venda</th>
            <th className="px-4 py-2 border-b text-left">Data Evento</th>
            <th className="px-4 py-2 border-b text-left">Evento</th>
            <th className="px-4 py-2 border-b text-left">Bilhetes</th>
            <th className="px-4 py-2 border-b text-left">Ganho</th>
            <th className="px-4 py-2 border-b text-left">Cobrança</th>
            <th className="px-4 py-2 border-b text-left">Estado</th>
            <th className="px-4 py-2 border-b text-left">Data Disputa</th>
            <th className="px-4 py-2 border-b text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {disputas.map((disputa) => (
            <tr key={disputa.id_venda} className="hover:bg-gray-100">
              <td className="px-4 py-2 border-b">{disputa.id_venda}</td>
              <td className="px-4 py-2 border-b">{disputa.data_evento}</td>
              <td className="px-4 py-2 border-b">{disputa.evento}</td>
              <td className="px-4 py-2 border-b">{disputa.bilhetes}</td>
              <td className="px-4 py-2 border-b">{disputa.ganho}</td>
              <td className="px-4 py-2 border-b">{disputa.cobranca}</td>
              <td className="px-4 py-2 border-b">{disputa.estado}</td>
              <td className="px-4 py-2 border-b">{disputa.data_disputa}</td>
              <td className="px-4 py-2 border-b">
                <button className="text-blue-500 hover:text-blue-700">Editar</button>
                <button className="text-red-500 hover:text-red-700 ml-2">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

