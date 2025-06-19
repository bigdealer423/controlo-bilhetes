import React, { useState, useEffect } from 'react';
import DisputasModal from './DisputasModal';

function Disputas() {
  const [disputas, setDisputas] = useState([]);  // Lista de disputas
  const [modalVisivel, setModalVisivel] = useState(false);
  const [disputaSelecionada, setDisputaSelecionada] = useState(null);

  // Simulando a obtenção de dados do backend ou uma API
  useEffect(() => {
    // Aqui você faria uma chamada para o backend ou API para obter os dados
    const dadosFicticios = [
      { id: 1, dataEvento: '2023-07-20', evento: 'Evento A', bilhetes: 50, ganhos: 500, cobranca: 450, dataDisputa: '2023-07-22' },
      { id: 2, dataEvento: '2023-07-21', evento: 'Evento B', bilhetes: 100, ganhos: 1000, cobranca: 950, dataDisputa: '2023-07-23' },
      // Adicione mais itens conforme necessário
    ];
    setDisputas(dadosFicticios); // Atualiza a lista de disputas
  }, []);

  const abrirModal = (disputa) => {
    console.log('Abrindo modal para a disputa:', disputa); // Verifique se a disputa está com os dados corretos
    setDisputaSelecionada(disputa);  // Passa os dados da disputa para o modal
    setModalVisivel(true); // Torna o modal visível
  };

  const fecharModal = () => {
    setModalVisivel(false); // Fecha o modal
    setDisputaSelecionada(null); // Limpa os dados da disputa
  };

  const salvarDisputa = (novaDisputa) => {
    // Atualiza a lista de disputas com os novos dados
    setDisputas((prevDisputas) =>
      prevDisputas.map((disputa) =>
        disputa.id === novaDisputa.id ? novaDisputa : disputa
      )
    );
    fecharModal(); // Fecha o modal após salvar
  };

  const eliminarDisputa = (id) => {
    // Remove a disputa da lista
    setDisputas((prevDisputas) => prevDisputas.filter((disputa) => disputa.id !== id));
    fecharModal(); // Fecha o modal após eliminar
  };

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>ID Venda</th>
            <th>Data Evento</th>
            <th>Evento</th>
            <th>Bilhetes</th>
            <th>Ganhos</th>
            <th>Cobrança</th>
            <th>Data Disputa</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {disputas.map((disputa) => (
            <tr key={disputa.id}>
              <td>{disputa.id}</td>
              <td>{disputa.dataEvento}</td>
              <td>{disputa.evento}</td>
              <td>{disputa.bilhetes}</td>
              <td>{disputa.ganhos}</td>
              <td>{disputa.cobranca}</td>
              <td>{disputa.dataDisputa}</td>
              <td>
                <button onClick={() => abrirModal(disputa)}>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <DisputasModal
        visivel={modalVisivel}
        fechar={fecharModal}
        dadosDisputa={disputaSelecionada}
        onSalvar={salvarDisputa}
        onEliminar={eliminarDisputa}
      />
    </div>
  );
}

export default Disputas;
