// InfoClubes.jsxAdd comment
import { useState } from 'react';
import { useEffect, useState } from 'react';
import { FiChevronDown, FiChevronUp, FiPlus, FiEdit, FiTrash } from 'react-icons/fi';
import { FaPaperclip } from 'react-icons/fa';


  const [ficheiros, setFicheiros] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [editClube, setEditClube] = useState({});
  const [novoClube, setNovoClube] = useState({ nome: '', estadio: '', capacidade: '', site: '', locaisVenda: '', continente: false, simbolo: '' });
  

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
    setFicheiros({ ...ficheiros, [index]: files });
  };

  const handleAddClube = () => {
  const handleAddClube = async () => {
    if (!novoClube.nome.trim()) return;
    setClubes([...clubes, novoClube]);
    setNovoClube({ nome: '', estadio: '', capacidade: '', site: '', locaisVenda: '', continente: false, simbolo: '' });

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

  const handleSaveEdit = (index) => {
    const updatedClubes = [...clubes];
    updatedClubes[index] = editClube;
    setClubes(updatedClubes);
    setEditIndex(null);
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

  const handleDelete = (index) => {
  const handleDelete = async (index) => {
    if (confirm('Tens a certeza que queres eliminar este clube?')) {
      const updatedClubes = clubes.filter((_, i) => i !== index);
      setClubes(updatedClubes);
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



   const cleanLinkText = (url) => {
    if (!url) return '';
    return url.replace(/^(https?:\/\/)?(www\.)?/, '');
  };


  return (

            <option>Sim</option>
            <option>Não</option>
          </select>
          <input type="text" placeholder="URL do símbolo" value={novoClube.simbolo} onChange={e => setNovoClube({ ...novoClube, simbolo: e.target.value })} className="border p-2 rounded" />
        </div>
        <button onClick={handleAddClube} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Adicionar</button>
      </div>

        </thead>
        <tbody>
          {clubes.map((clube, index) => (
            <>
              <tr key={index} className="border-b hover:bg-gray-50">
            <tr key={index} className="border-b hover:bg-gray-50">
              <td className="p-2 border text-center flex items-center gap-2 justify-center">
                {clube.simbolo && <img src={clube.simbolo} alt="simbolo" className="w-6 h-6 object-contain" />}
                {editIndex === index ? (
                  <td className="p-2 border flex items-center gap-2">
                    <input type="text" placeholder="URL símbolo" value={editClube.simbolo} onChange={e => setEditClube({ ...editClube, simbolo: e.target.value })} className="border p-1 rounded w-20" />
                    <input type="text" value={editClube.nome} onChange={e => setEditClube({ ...editClube, nome: e.target.value })} className="border p-1 rounded w-full" />
                  </td>
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
                  <td className="p-2 border text-center flex items-center gap-2 justify-center">
                    {clube.simbolo && <img src={clube.simbolo} alt="simbolo" className="w-6 h-6 object-contain" />}
                    {clube.nome}
                  </td>
                  clube.continente ? 'Sim' : 'Não'
                )}
              </td>
              <td className="p-2 border text-center flex gap-2 justify-center">
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
                  <button onClick={() => handleSaveEdit(index)} className="text-green-600"><FiPlus /></button>
                ) : (
                  <>
                    <td className="p-2 border text-center">{clube.estadio}</td>
                    <td className="p-2 border text-center">{clube.capacidade}</td>
                    <td className="p-2 border text-center">{clube.site && (<a href={formatLink(clube.site)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{cleanLinkText(clube.site)}</a>)}</td>
                    <td className="p-2 border text-center">{clube.locaisVenda && (<a href={formatLink(clube.locaisVenda)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{cleanLinkText(clube.locaisVenda)}</a>)}</td>
                    <td className="p-2 border text-center">{clube.continente ? 'Sim' : 'Não'}</td>
                  </>
                  <button onClick={() => handleEdit(index)} className="text-blue-600"><FiEdit /></button>
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
