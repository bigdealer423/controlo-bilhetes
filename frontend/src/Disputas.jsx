import { useState, useEffect } from "react";

export default function Disputas() {
  const [disputas, setDisputas] = useState([]);

  // Função para buscar as disputas do backend
  const fetchDisputas = async () => {
    try {
      const response = await fetch("https://controlo-bilhetes.onrender.com/disputas");
      const data = await response.json();
      setDisputas(data);
    } catch (err) {
      console.error("Erro ao buscar disputas:", err);
    }
  };

  useEffect(() => {
    fetchDisputas();
  }, []);  // Executa apenas quando o componente é montado

  return (
    <div className="disputas-container">
      <h2>Disputas</h2>
      <table className="disputas-table">
        <thead>
          <tr>
            <th>ID Venda</th>
            <th>Data Evento</th>
            <th>Evento</th>
            <th>Bilhetes</th>
            <th>Ganho</th>
            <th>Cobrança</th>
            <th>Estado</th>
            <th>Data Disputa</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {disputas.map((disputa) => (
            <tr key={disputa.id_venda}>
              <td>{disputa.id_venda}</td>
              <td>{disputa.data_evento}</td>
              <td>{disputa.evento}</td>
              <td>{disputa.bilhetes}</td>
              <td>{disputa.ganho}</td>
              <td>{disputa.cobranca}</td>
              <td>{disputa.estado}</td>
              <td>{disputa.data_disputa}</td>
              <td>
                <button onClick={() => editarDisputa(disputa)}>Editar</button>
                <button onClick={() => eliminarDisputa(disputa.id_venda)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const editarDisputa = (disputa) => {
  // Lógica para editar a disputa
  console.log(disputa);
};

const eliminarDisputa = (id_venda) => {
  // Lógica para eliminar a disputa
  console.log(id_venda);
};
