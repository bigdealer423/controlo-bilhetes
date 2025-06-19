import { useEffect, useState } from "react";

export default function Disputas() {
  const [disputas, setDisputas] = useState([]);

  useEffect(() => {
    fetch("https://controlo-bilhetes.onrender.com/disputas")
      .then(res => res.json())
      .then(data => {
        setDisputas(data);
      })
      .catch(err => console.error("Erro ao buscar disputas:", err));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Disputas</h1>

      <div className="bg-white shadow-md rounded p-4 mb-6">
        <table className="min-w-full border text-sm text-left text-gray-600">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">ID Venda</th>
              <th className="p-2">Data Evento</th>
              <th className="p-2">Evento</th>
              <th className="p-2">Estadio</th>
              <th className="p-2">Ganho (€)</th>
              <th className="p-2">Cobrança</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Data Disputa</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {disputas.map(disputa => (
              <tr key={disputa.id_venda} className="border-t">
                <td className="p-2">{disputa.id_venda}</td>
                <td className="p-2">{disputa.data_evento}</td>
                <td className="p-2">{disputa.evento}</td>
                <td className="p-2">{disputa.estadio}</td>
                <td className="p-2">{disputa.ganho} €</td>
                <td className="p-2">{disputa.cobranca}</td>
                <td className="p-2">{disputa.estado}</td>
                <td className="p-2">{disputa.data_disputa}</td>
                <td className="p-2">
                  <button className="text-blue-600 hover:underline mr-2">Editar</button>
                  <button className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
