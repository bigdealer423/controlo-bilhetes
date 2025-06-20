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

  // Carregar disputas do backend
  useEffect(() => {
    fetch("https://controlo-bilhetes.onrender.com/disputas")
      .then((res) => res.json())
      .then((data) => {
        console.log("Disputas recebidas:", data); // Adicione essa linha para verificar a resposta
        setDisputas(data);
      })
      .catch((err) => console.error("Erro ao buscar disputas:", err));

    // Carregar dados do modal do localStorage
    const dadosModal = localStorage.getItem("modalEditado");
    if (dadosModal) {
      setRegistoEditado(JSON.parse(dadosModal));
    }
  }, []);

  // Função para abrir o modal com os dados da disputa
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

    // Salvar os dados do modal no localStorage
    localStorage.setItem("modalEditado", JSON.stringify(dadosModal));
  };

  // Função para fechar o modal
  const fecharModal = () => {
    setModalAberto(false);
    localStorage.removeItem("modalEditado"); // Remover os dados do localStorage
  };

  // Atualizar campos do estado com a edição
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegistoEditado((prevState) => {
      const updatedState = { ...prevState, [name]: value };
      // Atualizar no localStorage
      localStorage.setItem("modalEditado", JSON.stringify(updatedState));
      return updatedState;
    });
  };

  // Lidar com a mudança de arquivos
  const handleFileChange = (e) => {
    const newFiles = e.target.files;
    setRegistoEditado((prevState) => {
      const updatedState = {
        ...prevState,
        arquivos: [...prevState.arquivos, ...newFiles],
      };
      // Atualizar no localStorage
      localStorage.setItem("modalEditado", JSON.stringify(updatedState));
      return updatedState;
    });
  };

  // Função que salva a edição e faz a requisição para o backend
  const salvarEdicao = () => {
    if (!registoEditado.id_venda) {
      console.error("ID da venda não encontrado.");
      return;
    }

    const formData = new FormData();
    formData.append("data_disputa", registoEditado.data_disputa);
    formData.append("cobranca", registoEditado.cobranca);
    formData.append("texto_adicional", registoEditado.texto_adicional);

    // Adicionar os arquivos ao FormData
    registoEditado.arquivos.forEach((file) => {
      formData.append("arquivos", file);  // "arquivos" deve ser um campo de lista no backend
    });

    // Enviar a requisição
    fetch(
      `https://controlo-bilhetes.onrender.com/disputas/${registoEditado.id_venda}`,
      {
        method: "PUT",
        body: formData,
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Erro ao atualizar disputa: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Resposta da API:", data);
        // Atualizar o estado com a resposta da API
        setDisputas((prevDisputas) =>
          prevDisputas.map((disputa) =>
            disputa.id_venda === registoEditado.id_venda
              ? { ...disputa, ...registoEditado }
              : disputa
          )
        );
        fecharModal();
      })
      .catch((err) => {
        console.error("Erro ao atualizar disputa:", err);
      });
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
              <th className="p-2">Estádio</th>
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
