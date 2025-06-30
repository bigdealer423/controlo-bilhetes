// InfoClubes.jsx
import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiPlus, FiEdit, FiTrash } from 'react-icons/fi';
import { FaPaperclip } from 'react-icons/fa';

export default function InfoClubes() {
  const [clubes, setClubes] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [nota, setNota] = useState('');
  const [ficheiros, setFicheiros] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [editClube, setEditClube] = useState({});
  const [novoClube, setNovoClube] = useState({ nome: '', estadio: '', capacidade: '', site: '', locaisVenda: '', continente: false, simbolo: '' });

  const handleExpand = (index) => {
    setExpanded(expanded === index ? null : index);
  };

  const handleFileChange = (e, index) => {
    const files = e.target.files;
    setFicheiros({ ...ficheiros, [index]: files });
  };

  const handleAddClube = () => {
    if (!novoClube.nome.trim()) return;
    setClubes([...clubes, novoClube]);
    setNovoClube({ nome: '', estadio: '', capacidade: '', site: '', locaisVenda: '', continente: false, simbolo: '' });
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditClube(clubes[index]);
  };

  const handleSaveEdit = (index) => {
    const updatedClubes = [...clubes];
    updatedClubes[index] = editClube;
    setClubes(updatedClubes);
    setEditIndex(null);
  };

  const handleDelete = (index) => {
    if (confirm('Tens a certeza que queres eliminar este clube?')) {
      const updatedClubes = clubes.filter((_, i) => i !== index);
      setClubes(updatedClubes);
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
          <input type="text" placeholder="URL do símbolo" value={novoClube.simbolo} onChange={e => setNovoClube({ ...novoClube, simbolo: e.target.value })} className="border p-2 rounded" />
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
            <>
              <tr key={index} className="border-b hover:bg-gray-50">
                {editIndex === index ? (
                  <td className="p-2 border flex items-center gap-2">
                    <input type="text" placeholder="URL símbolo" value={editClube.simbolo} onChange={e => setEditClube({ ...editClube, simbolo: e.target.value })} className="border p-1 rounded w-20" />
                    <input type="text" value={editClube.nome} onChange={e => setEditClube({ ...editClube, nome: e.target.value })} className="border p-1 rounded w-full" />
                  </td>
                ) : (
                  <td className="p-2 border text-center flex items-center gap-2 justify-center">
                    {clube.simbolo && <img src={clube.simbolo} alt="simbolo" className="w-6 h-6 object-contain" />}
                    {clube.nome}
                  </td>
                )}
                {editIndex === index ? (
                  <>
                    <td className="p-2 border"><input type="text" value={editClube.estadio} onChange={e => setEditClube({ ...editClube, estadio: e.target.value })} className="border p-1 rounded w-full" /></td>
                    <td className="p-2 border"><input type="text" value={editClube.capacidade} onChange={e => setEditClube({ ...editClube, capacidade: e.target.value })} className="border p-1 rounded w-full" /></td>
                    <td className="p-2 border"><input type="text" value={editClube.site} onChange={e => setEditClube({ ...editClube, site: e.target.value })} className="border p-1 rounded w-full" /></td>
                    <td className="p-2 border"><input type="text" value={editClube.locaisVenda} onChange={e => setEditClube({ ...editClube, locaisVenda: e.target.value })} className="border p-1 rounded w-full" /></td>
                    <td className="p-2 border">
                      <select value={editClube.continente ? 'Sim' : 'Não'} onChange={e => setEditClube({ ...editClube, continente: e.target.value === 'Sim' })} className="border p-1 rounded w-full">
                        <option>Sim</option>
                        <option>Não</option>
                      </select>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border text-center">{clube.estadio}</td>
                    <td className="p-2 border text-center">{clube.capacidade}</td>
                    <td className="p-2 border text-center">{clube.site && (<a href={formatLink(clube.site)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{cleanLinkText(clube.site)}</a>)}</td>
                    <td className="p-2 border text-center">{clube.locaisVenda && (<a href={formatLink(clube.locaisVenda)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{cleanLinkText(clube.locaisVenda)}</a>)}</td>
                    <td className="p-2 border text-center">{clube.continente ? 'Sim' : 'Não'}</td>
                  </>
                )}
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
              {expanded === index && (
                <tr className="bg-gray-50">
                  <td colSpan={7} className="p-4">
                    <div className="flex flex-col gap-4">
                      <textarea className="border p-2 w-full rounded" rows={4} placeholder="Notas sobre este clube..." value={nota} onChange={(e) => setNota(e.target.value)} />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <FaPaperclip /> Anexar ficheiros (PDF, imagens)
                        <input type="file" accept="application/pdf,image/*" multiple className="hidden" onChange={(e) => handleFileChange(e, index)} />
                      </label>
                      {ficheiros[index] && (
                        <ul className="list-disc ml-6">
                          {Array.from(ficheiros[index]).map((file, idx) => (
                            <li key={idx} className="text-sm text-gray-700">{file.name}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
