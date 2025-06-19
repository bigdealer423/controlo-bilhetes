import { useEffect, useState } from "react";

export default function Disputas() {
  const [disputas, setDisputas] = useState([]);
  const [modoEdicao, setModoEdicao] = useState(null);
  const [registoEditado, setRegistoEditado] = useState({
    cobranca: "",
    data_disputa: "",
  });

  useEffect(() => {
    fetch("https://controlo-bilhetes.onrender.com/disputas")
      .then(res => res.json())
      .then(data => {
        setDisputas(data);
      })
      .catch(err => console.error("Erro ao buscar disputas:", err));
  }, []);

  // Função para ativar o modo de edição
  const ativarEdicao = (id, disputa) => {
    setModoEdicao(id);
    setRegistoEditado({
      cobranca: disputa.cobranca,
      data_disputa: disputa.data_disputa,
    });
  };

  // Função para atualizar o registo editado
  const atualizarRegisto = (id) => {
    const dadosAtualizados = {
      cobranca: registoEditado.cobranca,
      data_disputa: registoEditado.data_disputa,
    };

    fetch(`https://controlo-bilhetes.onrender.com/disputas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosAtualizados),
    })
      .then(() => {
        setModoEdicao(null);
        // Atualiza os dados na tabela após a edição
        setDisputas((prevDisputas) =>
          prevDisputas.map((disputa) =>
            disputa.id_venda === id
              ? { ...disputa, ...dadosAtualizados }
              : disputa
          )
        );
      })
      .catch((err) => console.error("Erro ao atualizar disputa:", err));
  };

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
            {disputas.map((disputa) => (
              <tr key={disputa.id_venda} className="border-t">
                {/* Campos não editáveis */}
                <td className="p-2">{disputa.id_venda}</td>
                <td className="p-2">{disputa.data_evento}</td>
                <td className="p-2">{disputa.evento}</td>
                <td className="p-2">{disputa.estadio}</td>
                <td className="p-2">{disputa.ganho} €</td>

                {/* Campos editáveis apenas durante a edição */}
                {modoEdicao === disputa.id_venda ? (
                  <>
                    <td className="p-2">
                      <input
                        type="number"
                        className="input bg-blue-50" // Alterei para destacar o campo
                        value={registoEditado.cobranca}
                        onChange={(e) =>
                          setRegistoEditado({
                            ...registoEditado,
                            cobranca: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td className="p-2">{disputa.estado}</td>
                    <td className="p-2">
                      <input
                        type="date"
                        className="input bg-blue-50" // Alterei para destacar o campo
                        value={registoEditado.data_disputa}
                        onChange={(e) =>
                          setRegistoEditado({
                            ...registoEditado,
                            data_dispu_
