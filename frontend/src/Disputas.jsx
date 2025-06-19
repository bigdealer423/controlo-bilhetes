import React, { useState } from 'react';
import DisputasModal from './DisputasModal';

function Disputas() {
  const [disputas, setDisputas] = useState([]);  // Lista de disputas
  const [modalVisivel, setModalVisivel] = useState(false);
  const [disputaSelecionada, setDisputaSelecionada] = useState(null);

  const abrirModal = (disputa) => {
    setDisputaSelecionada(disputa);
    setModalVisivel(true);
  };

  const fecharModal = () => {
    setModalVisivel(false);
    setDisputaSelecionada(null);
  };

  const salvarDisputa = (novaDisputa) => {
    setDisputas((prevDisputas) =>
      prevDisputas.map((disputa) =>
        disputa.id === novaDisputa.id ? novaDisputa : disputa
      )
    );
  };

  const eliminarDisputa = (id) => {
    setDisputas((prevDisputas) => prevDisputas.filter((disputa) => disputa.id !== id));
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
