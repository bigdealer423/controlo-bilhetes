import React, { useState, useEffect } from 'react';
import DisputasModal from './DisputasModal';

function ListagemVendas() {
  const [registos, setRegistos] = useState([]);
  const [disputas, setDisputas] = useState([]); // Estado para armazenar as disputas

  useEffect(() => {
    // Simulando a obtenção de dados da API
    const dadosFicticios = [
      { id: 1, evento: 'Evento A', ganho: 500, estado: 'Por entregar' },
      { id: 2, evento: 'Evento B', ganho: 1000, estado: 'Disputa' },
      { id: 3, evento: 'Evento C', ganho: 700, estado: 'Pago' }
    ];
    setRegistos(dadosFicticios); // Preenche a lista de vendas
  }, []);

  // Função para alterar o estado de uma venda para 'Disputa'
  const mudarParaDisputa = (id) => {
    // Atualiza o estado da venda para "Disputa"
    setRegistos(prevRegistos =>
      prevRegistos.map(registo =>
        registo.id === id ? { ...registo, estado: 'Disputa' } : registo
      )
    );
    // Adiciona a venda à lista de disputas
    const vendaDisputa = registos.find(registo => registo.id === id);
    setDisputas(prevDisputas => [...prevDisputas, vendaDisputa]);
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
                <button onClick={() => mudarParaDisputa(registo.id)}>
                  Mudar para Disputa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Aqui você renderiza a aba Disputas */}
      <div>
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
                  {/* Aqui você pode renderizar os campos editáveis, como a data de disputa e cobrança */}
                  <input type="date" value={disputa.dataDisputa || ''} />
                </td>
                <td>
                  <input type="number" value={disputa.cobranca || ''} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListagemVendas;
