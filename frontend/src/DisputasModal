import React, { useState, useEffect } from 'react';
import DisputasModal from './DisputasModal';  // O Modal para editar disputas

function ListagemVendas() {
  const [registos, setRegistos] = useState([]);  // Lista de vendas
  const [disputas, setDisputas] = useState([]);  // Lista de disputas
  const [modalVisivel, setModalVisivel] = useState(false);  // Controle de visibilidade do modal
  const [disputaSelecionada, setDisputaSelecionada] = useState(null);  // Disputa selecionada para edição

  useEffect(() => {
    // Simulando a obtenção de dados da API
    const dadosFicticios = [
      { id: 1, evento: 'Evento A', ganho: 500, estado: 'Por entregar' },
      { id: 2, evento: 'Evento B', ganho: 1000, estado: 'Disputa' },
      { id: 3, evento: 'Evento C', ganho: 700, estado: 'Pago' }
    ];
    setRegistos(dadosFicticios);  // Preenche a lista de vendas
  }, []);

  // Função para mudar o estado de uma venda para "Disputa" e copiá-la para a aba Disputas
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

  // Função para editar uma disputa
  const abrirModal = (disputa) => {
    setDisputaSelecionada(disputa);
    setModalVisivel(true);
  };

  const fecharModal = () => {
    setModalVisivel(false);
    setDisputaSelecionada(null);
  };

  const salvarDisputa = (novaDisputa) => {
    setDisputas(disputas.map((disputa) =>
      disputa.id === novaDisputa.id ? novaDisputa : disputa
    ));
    fecharModal();
  };

  const eliminarDisputa = (id) => {
    setDisputas(disputas.filter((disputa) => disputa.id !== id));
  };

  return (
    <div>
      {/* Listagem de Vendas */}
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

      {/* Aba de Disputas */}
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
              <th>Ações</th>
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
                    value={disputa.dataDisputa || ''}
                    onChange={(e) => setDisputaSelecionada({ ...disputa, dataDisputa: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={disputa.cobranca || ''}
                    onChange={(e) => setDisputaSelecionada({ ...disputa, cobranca: e.target.value })}
                  />
                </td>
                <td>
                  <button onClick={() => abrirModal(disputa)}>Editar</button>
                  <button onClick={() => eliminarDisputa(disputa.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para Editar Disputa */}
      {modalVisivel && (
        <DisputasModal
          visivel={modalVisivel}
          fechar={fecharModal}
          dadosDisputa={disputaSelecionada}
          onSalvar={salvarDisputa}
          onEliminar={eliminarDisputa}
        />
      )}
    </div>
  );
}

export default ListagemVendas;
