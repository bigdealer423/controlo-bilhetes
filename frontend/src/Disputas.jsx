import React, { useState, useEffect } from 'react';
import DisputasModal from './DisputasModal';

function Disputas() {
  const [disputas, setDisputas] = useState([]);  // Lista de disputas
  const [modalVisivel, setModalVisivel] = useState(false);
  const [disputaSelecionada, setDisputaSelecionada] = useState(null);


  
  // Use o useEffect para buscar os dados da Listagem Vendas (se aplicável)
  useEffect(() => {
    fetch('https://controlo-bilhetes.vercel.app/listagem-vendas')  // Se estiver usando uma API
      .then((response) => response.json())
      .then((data) => {
        setDisputas(data);  // Preenche a lista de disputas com dados da Listagem Vendas
      });
  }, []);


  const abrirModal = (disputa) => {
    console.log('Abrindo modal para a disputa:', disputa);
    setDisputaSelecionada(disputa);  // Passa os dados da disputa para o modal
    setModalVisivel(true); // Torna o modal visível
  };

  const fecharModal = () => {
    setModalVisivel(false); // Fecha o modal
    setDisputaSelecionada(null); // Limpa os dados da disputa
  };

  const salvarDisputa = (novaDisputa) => {
    setDisputas((prevDisputas) =>
      prevDisputas.map((disputa) =>
        disputa.id === novaDisputa.id ? novaDisputa : disputa
      )
    );
    fecharModal(); // Fecha o modal após salvar
  };

  const eliminarDisputa = (id) => {
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
