import React, { useState, useEffect } from 'react';
import './DisputasModal.css';  // Importe o arquivo CSS aqui

function DisputasModal({ visivel, fechar, dadosDisputa, onSalvar, onEliminar }) {
  if (!dadosDisputa) {
    return <div>Carregando...</div>;
  }

  const [campoCobrança, setCampoCobrança] = useState(dadosDisputa.cobranca || '');
  const [campoDataDisputa, setCampoDataDisputa] = useState(dadosDisputa.dataDisputa || '');
  const [campoTexto, setCampoTexto] = useState(dadosDisputa.texto || '');
  const [arquivos, setArquivos] = useState([]);

  // Atualiza os campos sempre que dadosDisputa mudar
  useEffect(() => {
    setCampoCobrança(dadosDisputa.cobranca || '');
    setCampoDataDisputa(dadosDisputa.dataDisputa || '');
    setCampoTexto(dadosDisputa.texto || '');
  }, [dadosDisputa]);

  const handleSalvar = () => {
    const novaDisputa = {
      ...dadosDisputa,
      cobranca: campoCobrança,
      dataDisputa: campoDataDisputa,
      texto: campoTexto,
      arquivos: arquivos,
    };
    onSalvar(novaDisputa);
    fechar();
  };

  const handleAdicionarArquivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArquivos([...arquivos, file]);
    }
  };

  const handleEliminarArquivo = (index) => {
    setArquivos(arquivos.filter((_, i) => i !== index));
  };

  return (
    <div
      className={`modal ${visivel ? 'modal-show' : ''}`}
      onClick={fechar}
    >
      <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
        <button className="fechar" onClick={fechar}>
          X
        </button>
        <h2>Editar Disputa</h2>
        
        {/* Tabela dentro do modal */}
        <table>
          <thead>
            <tr>
              <th>Campo</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cobrança</td>
              <td>
                <input
                  type="text"
                  value={campoCobrança}
                  onChange={(e) => setCampoCobrança(e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Data da Disputa</td>
              <td>
                <input
                  type="date"
                  value={campoDataDisputa}
                  onChange={(e) => setCampoDataDisputa(e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td>Texto Adicional</td>
              <td>
                <textarea
                  value={campoTexto}
                  onChange={(e) => setCampoTexto(e.target.value)}
                  rows="5"
                />
              </td>
            </tr>
            <tr>
              <td>Adicionar Arquivo</td>
              <td>
                <input type="file" onChange={handleAdicionarArquivo} />
              </td>
            </tr>
            {arquivos.length > 0 && (
              <tr>
                <td>Arquivos Anexados</td>
                <td>
                  {arquivos.map((arquivo, index) => (
                    <div key={index} className="arquivo">
                      <span>{arquivo.name}</span>
                      <button onClick={() => handleEliminarArquivo(index)}>Remover</button>
                      <a href={URL.createObjectURL(arquivo)} target="_blank" rel="noopener noreferrer">
                        Visualizar
                      </a>
                    </div>
                  ))}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="botoes">
          <button onClick={handleSalvar}>Salvar</button>
          <button onClick={() => onEliminar(dadosDisputa.id)}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

export default DisputasModal;
