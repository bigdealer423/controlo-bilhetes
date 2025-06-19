import React, { useState } from 'react';
import './DisputasModal.css';  // Importe o arquivo CSS aqui


function DisputasModal({ visivel, fechar, dadosDisputa, onSalvar, onEliminar }) {
  const [campoCobrança, setCampoCobrança] = useState(dadosDisputa.cobranca || '');
  const [campoDataDisputa, setCampoDataDisputa] = useState(dadosDisputa.dataDisputa || '');
  const [campoTexto, setCampoTexto] = useState(dadosDisputa.texto || '');
  const [arquivos, setArquivos] = useState([]);

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
        
        <div className="campo">
          <label>Cobrança</label>
          <input
            type="text"
            value={campoCobrança}
            onChange={(e) => setCampoCobrança(e.target.value)}
          />
        </div>

        <div className="campo">
          <label>Data da Disputa</label>
          <input
            type="date"
            value={campoDataDisputa}
            onChange={(e) => setCampoDataDisputa(e.target.value)}
          />
        </div>

        <div className="campo">
          <label>Texto Adicional</label>
          <textarea
            value={campoTexto}
            onChange={(e) => setCampoTexto(e.target.value)}
            rows="5"
          />
        </div>

        <div className="campo">
          <label>Adicionar Arquivo</label>
          <input type="file" onChange={handleAdicionarArquivo} />
        </div>

        <div className="arquivos">
          <h3>Arquivos Anexados</h3>
          {arquivos.map((arquivo, index) => (
            <div key={index} className="arquivo">
              <span>{arquivo.name}</span>
              <button onClick={() => handleEliminarArquivo(index)}>Remover</button>
              <a href={URL.createObjectURL(arquivo)} target="_blank" rel="noopener noreferrer">
                Visualizar
              </a>
            </div>
          ))}
        </div>

        <div className="botoes">
          <button onClick={handleSalvar}>Salvar</button>
          <button onClick={() => onEliminar(dadosDisputa.id)}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

export default DisputasModal;
