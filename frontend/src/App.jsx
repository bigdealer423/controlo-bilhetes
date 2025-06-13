import { useEffect, useState } from "react";

export default function App() {
  const [eventos, setEventos] = useState([]);
  const [novoEvento, setNovoEvento] = useState({
    id: "",
    nome: "",
    data: "",
    local: "",
    gasto: 0,
    ganho: 0,
    pago: false,
    bilhetes: []
  });

  useEffect(() => {
    buscarEventos();
  }, []);

  const buscarEventos = () => {
    fetch("https://controlo-bilhetes.onrender.com/eventos")
      .then(res => res.json())
      .then(data => setEventos(data))
      .catch(err => console.error("Erro ao buscar eventos:", err));
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setNovoEvento(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const adicionarEvento = () => {
    fetch("https://controlo-bilhetes.onrender.com/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...novoEvento, id: parseInt(novoEvento.id) })
    })
      .then(res => res.json())
      .then(() => {
        buscarEventos();
        setNovoEvento({
          id: "",
          nome: "",
          data: "",
          local: "",
          gasto: 0,
          ganho: 0,
          pago: false,
          bilhetes: []
        });
      });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Interface de Gestão de Bilhetes</h1>

      <h2>Adicionar Evento</h2>
      <div style={{ marginBottom: "1rem" }}>
        <input name="id" placeholder="ID" value={novoEvento.id} onChange={handleChange} />
        <input name="nome" placeholder="Nome" value={novoEvento.nome} onChange={handleChange} />
        <input name="data" placeholder="Data" value={novoEvento.data} onChange={handleChange} />
        <input name="local" placeholder="Local" value={novoEvento.local} onChange={handleChange} />
        <input name="gasto" type="number" placeholder="Gasto" value={novoEvento.gasto} onChange={handleChange} />
        <input name="ganho" type="number" placeholder="Ganho" value={novoEvento.ganho} onChange={handleChange} />
        <label>
          Pago:
          <input name="pago" type="checkbox" checked={novoEvento.pago} onChange={handleChange} />
        </label>
        <button onClick={adicionarEvento}>Guardar Evento</button>
      </div>

      <h2>Eventos Existentes</h2>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
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
              <td>{e.gasto} €</td>
              <td>{e.ganho} €</td>
              <td>{(e.ganho - e.gasto).toFixed(2)} €</td>
              <td>{e.pago ? "✅" : "❌"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
