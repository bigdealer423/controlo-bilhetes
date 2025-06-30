// InfoClubes.jsx
import React from 'react';
import { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiPlus, FiEdit, FiTrash } from 'react-icons/fi';
import { FaPaperclip } from 'react-icons/fa';

export default function InfoClubes() {
  const [clubes, setClubes] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [notas, setNotas] = useState('');
  const [ficheiros, setFicheiros] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [editClube, setEditClube] = useState({});
  const [novoClube, setNovoClube] = useState({ nome: '', estadio: '', capacidade: '', site: '', locais_venda: '', continente: false });

  useEffect(() => {
    fetchClubes();
}, []);

const fetchClubes = async () => {
    try {
        const res = await fetch("https://controlo-bilhetes.onrender.com/clubes");
        const data = await res.json();
        setClubes(data);

        // Preencher as notas associadas ao índice
        const notasInicial = {};
        data.forEach((clube, index) => {
            notasInicial[index] = clube.nota || "";
        });
        setNotas(notasInicial);

    } catch (error) {
        console.error("Erro ao carregar clubes:", error);
    }
};


  const handleNotaChange = (index, value) => {
    setNotas({ ...notas, [index]: value });
};

  const handleFileChange = async (e, index, clubeId) => {
    const files = e.target.files;
    setFicheiros({ ...ficheiros, [index]: files });

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
    }

    try {
        const res = await fetch(`https://controlo-bilhetes.onrender.com/clubes/${clubeId}/upload`, {
            method: "POST",
            body: formData,
        });
        if (res.ok) {
            console.log("Ficheiros enviados com sucesso");
        } else {
            console.error(await res.json());
        }
    } catch (error) {
        console.error("Erro ao enviar ficheiros:", error);
    }
};


  const handleAddClube = async () => {
    if (!novoClube.nome.trim()) return;

    try {
        const res = await fetch("https://controlo-bilhetes.onrender.com/clubes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(novoClube),
        });
        if (res.ok) {
            fetchClubes();
            setNovoClube({ nome: "", estadio: "", capacidade: "", site: "", locais_venda: "", continente: false, simbolo: "" });
        } else {
            console.error(await res.json());
        }
    } catch (error) {
        console.error("Erro ao adicionar clube:", error);
    }
};


  const handleEdit = (index) => {
    setEditIndex(index);
    setEditClube(clubes[index]);
  };

  const handleSaveEdit = async (index) => {
    try {
        const clubeId = clubes[index].id;
        const updatedClube = {
            ...editClube,
            nota: notas[index] || "" // <-- inclui nota para guardar no backend
        };

        const res = await fetch(`https://controlo-bilhetes.onrender.com/clubes/${clubeId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedClube),
        });
        if (res.ok) {
            fetchClubes();
            setEditIndex(null);
        } else {
            console.error(await res.json());
        }
    } catch (error) {
        console.error("Erro ao guardar edição:", error);
    }
};


  const handleDelete = async (index) => {
    if (confirm("Tens a certeza que queres eliminar este clube?")) {
        try {
            const clubeId = clubes[index].id;
            const res = await fetch(`https://controlo-bilhetes.onrender.com/clubes/${clubeId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchClubes();
            } else {
                console.error(await res.json());
            }
        } catch (error) {
            console.error("Erro ao eliminar clube:", error);
        }
    }
};

  const handleExpand = (index, clubeId) => {
    if (expanded === index) {
        setExpanded(null);
    } else {
        setExpanded(index);
        carregarFicheiros(index, clubeId); // carregar anexos ao expandir
    }
};


  const carregarFicheiros = async (index, clubeId) => {
    try {
        const res = await fetch(`https://controlo-bilhetes.onrender.com/clubes/${clubeId}/ficheiros`);
        const data = await res.json();
        setFicheiros(prev => ({ ...prev, [index]: data }));
    } catch (error) {
        console.error("Erro ao carregar ficheiros:", error);
    }
};



  const formatLink = (url) => {
    if (!url) return '';
    if (!url.startsWith('http')) {
      return `https://${url}`;
    }
    return url;
  };

  const cleanLinkText = (url) => {
    if (!url) return '';
    return url.replace(/^(https?:\/\/)?(www\.)?/, '');
  };

  const handleDeleteFile = async (clubeId, filename, index) => {
  if (!confirm(`Tens a certeza que queres eliminar o ficheiro "${filename}"?`)) return;

  try {
    const res = await fetch(
      `https://controlo-bilhetes.onrender.com/clubes/${clubeId}/ficheiros?filename=${encodeURIComponent(filename)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      // Atualizar lista local sem recarregar tudo:
      setFicheiros(prev => {
        const updated = { ...prev };
        updated[index] = updated[index].filter(f => f !== filename);
        return updated;
      });
    } else {
      const error = await res.json();
      alert("Erro ao eliminar: " + error.detail);
    }
  } catch (error) {
    console.error("Erro ao eliminar ficheiro:", error);
    alert("Erro ao eliminar ficheiro.");
  }
};


  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Info Clubes</h1>

          {/* Formulário para preencher campos antes de adicionar */}
    <div className="mb-4 grid grid-cols-1 md:grid-cols-6 gap-2">
      <input
        type="text"
        placeholder="Nome do Clube"
        value={novoClube.nome}
        onChange={e => setNovoClube({ ...novoClube, nome: e.target.value })}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="Estádio"
        value={novoClube.estadio}
        onChange={e => setNovoClube({ ...novoClube, estadio: e.target.value })}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="Capacidade"
        value={novoClube.capacidade}
        onChange={e => setNovoClube({ ...novoClube, capacidade: e.target.value })}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="Site"
        value={novoClube.site}
        onChange={e => setNovoClube({ ...novoClube, site: e.target.value })}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="Locais Venda"
        value={novoClube.locais_venda}
        onChange={e => setNovoClube({ ...novoClube, locais_venda: e.target.value })}
        className="border p-2 rounded"
      />
      <select
        value={novoClube.continente ? 'Sim' : 'Não'}
        onChange={e => setNovoClube({ ...novoClube, continente: e.target.value === 'Sim' })}
        className="border p-2 rounded"
      >
        <option>Sim</option>
        <option>Não</option>
       </select>
    <input
      type="text"
      placeholder="URL do símbolo"
      value={novoClube.simbolo || ''}
      onChange={e => setNovoClube({ ...novoClube, simbolo: e.target.value })}
      className="border p-2 rounded"
    />
  </div>
  
  <button
    onClick={handleAddClube}
    className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  >
    Adicionar Clube
  </button>

      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Nome</th>
            <th className="p-2 border">Estádio</th>
            <th className="p-2 border">Capacidade</th>
            <th className="p-2 border">Site</th>
            <th className="p-2 border">Locais Venda</th>
            <th className="p-2 border">Continente?</th>
            <th className="p-2 border">Ações</th>
          </tr>
        </thead>
        <tbody>
  {clubes.map((clube, index) => (
    <React.Fragment key={index}>
      <tr className="border-b hover:bg-gray-50">
        {/* Nome e logo */}
        <td className="p-2 border text-center flex items-center justify-center gap-2">
          {editIndex === index ? (
            <>
              <input
                type="text"
                placeholder="URL símbolo"
                value={editClube.simbolo || ''}
                onChange={e => setEditClube({ ...editClube, simbolo: e.target.value })}
                className="border p-1 rounded w-24"
              />
              <input
                type="text"
                placeholder="Nome"
                value={editClube.nome}
                onChange={e => setEditClube({ ...editClube, nome: e.target.value })}
                className="border p-1 rounded w-full"
              />
            </>
          ) : (
            <>
              {clube.simbolo && (
                <img src={clube.simbolo} alt="Logo" className="w-6 h-6 object-contain" />
              )}
              {clube.nome}
            </>
          )}
        </td>

        {/* Estádio */}
        <td className="p-2 border text-center">
          {editIndex === index ? (
            <input
              type="text"
              value={editClube.estadio}
              onChange={e => setEditClube({ ...editClube, estadio: e.target.value })}
              className="border p-1 rounded w-full"
            />
          ) : (
            clube.estadio
          )}
        </td>

        {/* Capacidade */}
        <td className="p-2 border text-center">
          {editIndex === index ? (
            <input
              type="text"
              value={editClube.capacidade}
              onChange={e => setEditClube({ ...editClube, capacidade: e.target.value })}
              className="border p-1 rounded w-full"
            />
          ) : (
            clube.capacidade
          )}
        </td>

        {/* Site */}
        <td className="p-2 border text-center">
          {editIndex === index ? (
            <input
              type="text"
              value={editClube.site}
              onChange={e => setEditClube({ ...editClube, site: e.target.value })}
              className="border p-1 rounded w-full"
            />
          ) : clube.site ? (
            <a href={formatLink(clube.site)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              {cleanLinkText(clube.site)}
            </a>
          ) : null}
        </td>

        {/* Locais Venda */}
        <td className="p-2 border text-center">
          {editIndex === index ? (
            <input
              type="text"
              value={editClube.locais_venda}
              onChange={e => setEditClube({ ...editClube, locais_venda: e.target.value })}
              className="border p-1 rounded w-full"
            />
          ) : clube.locais_venda ? (
            <a href={formatLink(clube.locais_venda)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              {cleanLinkText(clube.locais_venda)}
            </a>
          ) : null}
        </td>

        {/* Continente */}
        <td className="p-2 border text-center">
          {editIndex === index ? (
            <select
              value={editClube.continente ? 'Sim' : 'Não'}
              onChange={e => setEditClube({ ...editClube, continente: e.target.value === 'Sim' })}
              className="border p-1 rounded w-full"
            >
              <option>Sim</option>
              <option>Não</option>
            </select>
          ) : (
            clube.continente ? 'Sim' : 'Não'
          )}
        </td>

        {/* Ações */}
        <td className="p-2 border text-center flex gap-2 justify-center">
          {editIndex === index ? (
            <button onClick={() => handleSaveEdit(index)} className="text-green-600"><FiPlus /></button>
          ) : (
            <button onClick={() => handleEdit(index)} className="text-blue-600"><FiEdit /></button>
          )}
          <button onClick={() => handleDelete(index)} className="text-red-600"><FiTrash /></button>
          <button onClick={() => handleExpand(index, clubes[index].id)} className="text-gray-600">
            {expanded === index ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </td>
      </tr>

      {/* Expansão de notas e anexos */}
      {expanded === index && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="p-4">
            <div className="flex flex-col gap-4">
              <textarea
                className="border p-2 w-full rounded"
                rows={4}
                placeholder="Notas sobre este clube..."
                value={notas[index] || ""}
                onChange={(e) => handleNotaChange(index, e.target.value)}
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <FaPaperclip /> Anexar ficheiros (PDF, imagens)
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileChange(e, index, clubes[index].id)}
                />
              </label>

              {/* Ficheiros locais selecionados mas ainda não enviados */}
              {ficheiros[index] && !Array.isArray(ficheiros[index]) && (
                <ul className="list-disc ml-6">
                  {Array.from(ficheiros[index]).map((file, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                      {file.name}
                    </li>
                  ))}
                </ul>
              )}

              {/* Ficheiros guardados no servidor */}
              {Array.isArray(ficheiros[index]) && ficheiros[index].length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="font-semibold">Ficheiros guardados:</p>
                  <ul className="list-disc ml-6">
                    {ficheiros[index].map((file, idx) => (
                      <li key={idx} className="flex items-center justify-between">
                        <a
                          href={`https://controlo-bilhetes.onrender.com/uploads/clubes/${clubes[index].id}/${file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          {file}
                        </a>
                        <button
                          className="text-red-600 text-xs ml-2"
                          onClick={() => handleDeleteFile(clubes[index].id, file, index)}
                        >
                          Eliminar
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  ))}
      </tbody>
    </table>
  </div>
);
}

