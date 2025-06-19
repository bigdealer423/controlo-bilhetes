import { useEffect, useState } from "react";

export default function Disputas() {
  const [disputas, setDisputas] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [registoEditado, setRegistoEditado] = useState({
    id_venda: "",
    data_disputa: "",
    cobranca: "",
    texto_adicional: "",
    arquivos: [],
  });

  useEffect(() => {
    // Carregar as disputas do backend
    fetch("https://controlo-bilhetes.onrender.com/disputas")
      .then(res => res.json())
      .then(data => {
        setDisputas(data);
      })
      .catch(err => console.error("Erro ao buscar disputas:", err));

    // Tentar carregar o estado do modal do localStorage
    const dadosModal = localStorage.getItem("modalEditado");
    if (dadosModal) {
      const dados = JSON.parse(dadosModal);
      setRegistoEditado(dados); // Restaurar os dados persistidos
    }
  }, []);

  // Função para abrir o modal com duplo clique na linha
  const abrirModal = (disputa) => {
    const dadosModal = {
      id_venda: disputa.id_venda,
      data_disputa: disputa.data_disputa,
      cobranca: disputa.cobranca,
      texto_adicional: disputa.texto_adicional || "",
      arquivos: disputa.arquivos || [],
    };
    setRegistoEditado(dadosModal);
    setModalAberto(true);

    // Persistir os dados no localStorage sempre que o modal for aberto
    localStorage.setItem("modalEditado", JSON.stringify(dadosModal));
  };

  // Função para fechar o modal
  const fecharModal = () => {
    setModalAberto(false);
    localStorage.removeItem("modalEditado"); // Limpar os dados do localStorage quando fechar o modal
  };

  // Função para atualizar os campos de texto no estado
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegistoEditado((prevState) => {
      const updatedState = { ...prevState, [name]: value };
      // Persistir os dados no localStorage após cada alteração
      localStorage.setItem("modalEditado", JSON.stringify(updatedState));
      return updatedState;
    });
  };

  // Função para lidar com o upload de arquivos
  const handleFileChange = (e) => {
    const newFiles = e.target.files;
    setRegistoEditado((prevState) => {
      const updatedState = {
        ...prevState,
        arquivos: [...prevState.arquivos, ...newFiles],
      };
      // Persistir os arquivos no localStorage
      localStorage.setItem("modalEditado", JSON.stringify(updatedState));
      return updatedState;
    });
  };

  // Função para salvar os dados no backend
  const salvarEdicao = () => {
    const formData = new FormData();
    formData.append("data_disputa", registoEditado.data_disputa);
    formData.append("cobranca", registoEditado.cobranca);
    formData.append("texto_adicional", registoEditado.texto_adicional);

    // Adiciona os arquivos ao FormData
    registoEditado.arquivos.forEach((file) => {
      formData.append("arquivos", file);
    });

    fetch(`https://controlo-bilhetes.onrender.com/disputas/${registoEditado.id_venda}`, {
      method: "PUT",
      body: formData,
    })
      .then(() => {
        // Atualiza a tabela após salvar
        setDisputas((prevDisputas) =>
          prevDisputas.map((disputa) =>
            disputa.id_venda === registoEditado.id_venda
              ? { ...disputa, ...registoEditado }
              : disputa
          )
        );
        fecharModal();
      })
      .catch((err) => console.error("Erro ao atualizar disputa:", err));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Disputas</h1>

      <div className="bg-white shadow-md rounded p-4 mb-6">
        <table className="min-w-full table-auto border text-sm text-left text-gray-600">
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
            </tr>
          </thead>
          <tbody>
            {disputas.map((disputa) => (
              <tr
                key={disputa.id_venda}
                className="border-t cursor-pointer"
                onDoubleClick={() => abrirModal(disputa)} // Duplo clique para abrir o modal
              >
                <td className="p-2">{disputa.id_venda}</td>
                <td className="p-2">{disputa.data_evento}</td>
                <td className="p-2">{disputa.evento}</td>
                <td className="p-2">{disputa.estadio}</td>
                <td className="p-2">{disputa.ganho} €</td>
                <td className="p-2">{disputa.cobranca}</td>
                <td className="p-2">{disputa.estado}</td>
                <td className="p-2">{disputa.data_disputa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded p-6 shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Editar Disputa</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium">Data Disputa</label>
              <input
                type="date"
                name="data_disputa"
                value={registoEditado.data_disputa}
                onChange={handleChange}
                className="input w-full"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium">Cobrança</label>
              <input
                type="number"
                name="cobranca"
                value={registoEditado.cobranca}
                onChange={handleChange}
                className="input w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Texto Adicional</label>
              <textarea
                name="texto_adicional"
                value={registoEditado.texto_adicional}
                onChange={handleChange}
                className="input w-full"
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Anexar Arquivos</label>
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                className="input w-full"
              />
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold">Arquivos Anexados:</h3>
              <ul>
                {registoEditado.arquivos.length > 0 ? (
                  registoEditado.arquivos.map((file, index) => (
                    <li key={index} className="text-sm">
                      <a
                        href={URL.createObjectURL(file)} // Visualizar ou baixar o arquivo
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {file.name}
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500">Nenhum arquivo anexado.</li>
                )}
              </ul>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={salvarEdicao}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Salvar
              </button>
              <button
                onClick={fecharModal}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
