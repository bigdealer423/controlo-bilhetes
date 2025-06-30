// InfoClubes.jsx
import { useEffect, useState } from 'react';
import { FiChevronDown, FiChevronUp, FiPlus, FiEdit, FiTrash } from 'react-icons/fi';
import { FaPaperclip } from 'react-icons/fa';

export default function InfoClubes() {
  const [clubes, setClubes] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [nota, setNota] = useState('');
  const [ficheiros, setFicheiros] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [editClube, setEditClube] = useState({});
  const [novoClube, setNovoClube] = useState({
    nome: '',
    estadio: '',
    capacidade: '',
    site: '',
    locaisVenda: '',
    continente: false,
    simbolo: ''
  });

  useEffect(() => {
    fetchClubes();
  }, []);

  const fetchClubes = async () => {
    try {
      const res = await fetch('https://controlo-bilhetes.onrender.com/clubes');
      const data = await res.json();
      setClubes(data);
    } catch (error) {
      console.error('Erro ao carregar clubes:', error);
    }
  };

  const handleExpand = (index) => {
    setExpanded(expanded === index ? null : index);
  };

  const handleFileChange = (e, index) => {
    const files = e.target.files;
    setFicheiros({ ...ficheiros, [index]: files });
  };

  const handleAddClube = async () => {
    if (!novoClube.nome.trim()) return;

    // Logo automático
    const nomeLower = novoClube.nome.toLowerCase();
    let simbolo = '';
    if (nomeLower.includes('benfica')) simbolo = 'https://upload.wikimedia.org/wikipedia/en/8/89/SL_Benfica_logo.svg';
    if (nomeLower.includes('porto')) simbolo = 'https://upload.wikimedia.org/wikipedia/en/f/f1/FC_Porto.svg';
    if (nomeLower.includes('sporting')) simbolo = 'https://upload.wikimedia.org/wikipedia/en/5/5f/Sporting_CP.svg';

    const clubeParaGuardar = { ...novoClube, simbolo };

    try {
      const res = await fetch('https://controlo-bilhetes.onrender.com/clubes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clubeParaGuardar)
      });
      if (res.ok) {
        setNovoClube({
          nome: '',
          estadio: '',
          capacidade: '',
          site: '',
          locaisVenda: '',
          continente: false,
          simbolo: ''
        });
        fetchClubes();
      }
    } catch (error) {
      console.error('Erro ao adicionar clube:', error);
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditClube(clubes[index]);
  };

  const handleSaveEdit = async (index) => {
    try {
      await fetch(`https://controlo-bilhetes.onrender.com/clubes/${editClube.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editClube)
      });
      setEditIndex(null);
      fetchClubes();
    } catch (error) {
      console.error('Erro ao editar clube:', error);
    }
  };

  const handleDelete = async (index) => {
    if (confirm('Tens a certeza que queres eliminar este clube?')) {
      try {
        await fetch(`https://controlo-bilhetes.onrender.com/clubes/${clubes[index].id}`, {
          method: 'DELETE'
        });
        fetchClubes();
      } catch (error) {
        console.error('Erro ao eliminar clube:', error);
      }
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

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Info Clubes</h1>
      <div className="mb-4 border p-4 rounded bg-gray-50">
        <h2 className="font-semibold mb-2 flex items-center gap-2"><FiPlus /> Adicionar Clube</h2>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          <input type="text" placeholder="Clube" value={novoClube.nome} onChange={e => setNovoClube({ ...novoClube, nome: e.target.value })} className="border p-2 rounded" />
          <input type="text" placeholder="Estádio" value={novoClube.estadio} onChange={e => setNovoClube({ ...novoClube, estadio: e.target.value })} className="border p-2 rounded" />
          <input type="text" placeholder="Capacidade" value={novoClube.capacidade} onChange={e => setNovoClube({ ...novoClube, capacidade: e.target.value })} className="border p-2 rounded" />
          <input type="text" placeholder="Site" value={novoClube.site} onChange={e => setNovoClube({ ...novoClube, site: e.target.value })} className="border p-2 rounded" />
          <input type="text" placeholder="Locais Venda" value={novoClube.locaisVenda} onChange={e => setNovoClube({ ...novoClube, locaisVenda: e.target.value })} className="border p-2 rounded" />
          <select value={novoClube.continente ? 'Sim' : 'Não'} onChange={e => setNovoClube({ ...novoClube, continente: e.target.value === 'Sim' })} className="border p-2 rounded">
            <option>Sim</option>
            <option>Não</option>
          </select>
        </div>
        <button onClick={handleAddClube} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Adicionar</button>
      </div>

      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Clube</th>
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
            <tr key={index} className="border-b hover:bg-gray-50">
              <td className="p-2 border text-center flex items-center gap-2 justify-center">
                {clube.simbolo && <img src={clube.simbolo} alt="simbolo" className="w-6 h-6 object-contain" />}
                {editIndex === index ? (
                  <input type="text" value={editClube.nome} onChange={e => setEditClube({ ...editClube, nome: e.target.value })} className="border p-1 rounded w-full" />
                ) : clube.nome}
              </td>
              {['estadio', 'capacidade', 'site', 'locaisVenda'].map((campo) => (
                <td key={campo} className="p-2 border text-center">
                  {editIndex === index ? (
                    <input
                      type="text"
                      value={editClube[campo]}
                      onChange={e => setEditClube({ ...editClube, [campo]: e.target.value })}
                      className="border p-1 rounded w-full"
                    />
                  ) : campo === 'site' || campo === 'locaisVenda' ? (
                    clube[campo] && <a href={formatLink(clube[campo])} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{cleanLinkText(clube[campo])}</a>
                  ) : (
                    clube[campo]
                  )}
                </td>
              ))}
              <td className="p-2 border text-center">
                {editIndex === index ? (
                  <select value={editClube.continente ? 'Sim' : 'Não'} onChange={e => setEditClube({ ...editClube, continente: e.target.value === 'Sim' })} className="border p-1 rounded w-full">
                    <option>Sim</option>
                    <option>Não</option>
                  </select>
                ) : (
                  clube.continente ? 'Sim' : 'Não'
                )}
              </td>
              <td className="p-2 border text-center flex gap-2 justify-center">
                {editIndex === index ? (
                  <button onClick={() => handleSaveEdit(index)} className="text-green-600"><FiPlus /></button>
                ) : (
                  <button onClick={() => handleEdit(index)} className="text-blue-600"><FiEdit /></button>
                )}
                <button onClick={() => handleDelete(index)} className="text-red-600"><FiTrash /></button>
                <button onClick={() => handleExpand(index)} className="text-gray-600">{expanded === index ? <FiChevronUp /> : <FiChevronDown />}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
