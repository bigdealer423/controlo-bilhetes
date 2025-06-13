import { useEffect, useState } from "react";

export default function App() {
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    fetch("https://controlo-bilhetes.onrender.com/eventos")
      .then(res => res.json())
      .then(data => setEventos(data))
      .catch(err => console.error("Erro ao buscar eventos:", err));
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Interface de Gestão de Bilhetes</h1>
      <table border="1" cellPadding="8" style={{ marginTop: "1rem", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Data</th>
            <th>Local</th>
            <th>Gasto</th>
            <th>Ganho</th>
            <th>Lucro</th>
            <th>Pago</th>
          </tr>
        </thead>
        <tbody>
          {eventos.map(e => (
            <tr key={e.id}>
              <td>{e.nome}</td>
              <td>{e.data}</td>
              <td>{e.local}</td>
              <td>{e.gasto.toFixed(2)} €</td>
              <td>{e.ganho.toFixed(2)} €</td>
              <td>{(e.ganho - e.gasto).toFixed(2)} €</td>
              <td>{e.pago ? "✅" : "❌"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
