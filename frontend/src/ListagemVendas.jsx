// src/ListagemVendas.jsx
import { useEffect, useState } from "react";

export default function ListagemVendas() {
  const [eventos, setEventos] = useState([]);
  const [vendas, setVendas] = useState([]);

  const buscarEventos = async () => {
    try {
      const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown");
      const data = await res.json();
      setEventos(data);
    } catch (err) {
      console.error("Erro ao buscar eventos:", err);
    }
  };

  const buscarVendas = async () => {
    try {
      const res = await fetch("https://controlo-bilhetes.onrender.com/listagem_vendas");
      const data = await res.json();
      setVendas(data);
    } catch (err) {
      console.error("Erro ao buscar vendas:", err);
    }
  };

  useEffect(() => {
    buscarEventos();
    buscarVendas();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Listagem de Vendas</h2>

      <table className="w-full table-auto border">
        <thead>
          <tr className="bg-gray-200">
            <th>ID Venda</th>
            <th>Data</th>
            <th>Evento</th>
            <th>Estádio</th>
            <th>Ganho</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {vendas.map((venda) => (
            <tr key={venda.id} className="border-t">
              <td>{venda.id_venda}</td>
              <td>{venda.data_evento}</td>
              <td>
                <select defaultValue={venda.evento}>
                  {eventos.map((ev) => (
                    <option key={ev.id} value={ev.nome}>
                      {ev.nome}
                    </option>
                  ))}
                </select>
              </td>
              <td>{venda.estadio}</td>
              <td>{venda.ganho} €</td>
              <td>{venda.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
