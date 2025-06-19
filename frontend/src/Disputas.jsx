import React, { useState, useEffect } from 'react';

function Disputas() {
  // Estado para armazenar as vendas e as disputas
  const [registos, setRegistos] = useState([]);  // Lista de vendas
  const [disputas, setDisputas] = useState([]);  // Lista de disputas

  // Simulando a obtenção de dados da API (substitua com dados reais)
  useEffect(() => {
    const dadosFicticios = [
      { id: 1, evento: 'Evento A', ganho: 500, estado: 'Por entregar', cobranca: 450, dataDisputa: '' },
      { id: 2, evento: 'Evento B', ganho: 1000, estado: 'Disputa', cobranca: 950, dataDisputa: '2023-07-23' },
      { id: 3, evento: 'Evento C', ganho: 700, estado: 'Pago', cobranca: 0, dataDisputa: '' }
    ];
    setRegistos(dadosFicticios);  // Preenche a lista de vendas
  }, []);

  // Função para alterar o estado para "Disputa" e mover para a aba Disputas
  const mudarParaDisputa = (id) => {
    // Atualiza o estado da venda para "Disputa"
    const vendasAtualizadas = registos.map((registo) =>
      registo.id === id ? { ...registo, estado: 'Disputa' } : registo
    );
    setRegistos(vendasAtualizadas);

    // Copia a venda para a aba de disputas
    const vendaDisputa = registos.find((registo) => registo.id === id);
    if (vendaDisputa && !disputas.some(d => d.id === vendaDisputa.id)) {
      setDisputas([...disputas, vendaDisputa]);
    }
  };

  // Função para editar os campos na aba Disputas
  const editarDisputa = (id, campo, valor) => {
    setDisputas(disputas.map(disputa =>
      disputa.id === id ? { ...disputa, [campo]: valor } : disputa
    ));
  };

  return (
    <div>
      <h2>Listagem de Vendas</h2>
      <table>
        <thead>
          <tr>
            <th>ID Venda</th>
            <th>Evento</th>
            <th>Ganhos</th>
            <th>Estado</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {registos.map((registo) => (
            <tr key={registo.id}>
              <td>{registo.id}</td>
              <td>{registo.evento}</td>
              <td>{registo.ganho}</td>
              <td>{registo.estado}</td>
              <td>
                {/* Apenas permite mudar para "Disputa" caso o estado ainda não seja "Disputa" */}
                {registo.estado !== 'Disputa' && (
                  <button onClick={() => mudarParaDisputa(registo.id)}>
                    Mudar para Disputa
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Disputas</h2>
      <table>
        <thead>
          <tr>
            <th>ID Venda</th>
            <th>Evento</th>
            <th>Ganhos</th>
            <th>Estado</th>
            <th>Data Disputa</th>
            <th>Cobrança</th>
          </tr>
        </thead>
        <tbody>
          {disputas.map((disputa) => (
            <tr key={disputa.id}>
              <td>{disputa.id}</td>
              <td>{disputa.evento}</td>
              <td>{disputa.ganho}</td>
              <td>{disputa.estado}</td>
              <td>
                <input
                  type="date"
                  value={disputa.dataDisputa}
                  onChange={(e) => editarDisputa(disputa.id, 'dataDisputa', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={disputa.cobranca}
                  onChange={(e) => editarDisputa(disputa.id, 'cobranca', e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Disputas;
