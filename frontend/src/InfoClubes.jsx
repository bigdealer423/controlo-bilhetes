// InfoClubes.jsx
import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiPlus, FiSearch } from 'react-icons/fi';
import { FaPaperclip } from 'react-icons/fa';

export default function InfoClubes() {
  const [clubes, setClubes] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [nota, setNota] = useState('');
  const [ficheiros, setFicheiros] = useState({});
  const [filtros, setFiltros] = useState({ clube: '', estadio: '', continente: '' });
  const [novoClube, setNovoClube] = useState({ nome: '', estadio: '', capacidade: '', site: '', locaisVenda: '', continente: false });

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
    setNovoClube({ nome: '', estadio: '', capacidade: '', site: '', locaisVenda: '', continente: false });
  };

  const clubesFiltrados = clubes.filter(c =>
    c.nome.toLowerCase().includes(filtros.clube.toLowerCase()) &&
    c.estadio.toLowerCase().includes(filtros.estadio.toLowerCase()) &&
    (filtros.continente === '' || (filtros.continente === 'Sim' ? c.continente : !c.continente))
  );

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Info Clubes</h1>

      <div className="flex flex-col md:flex-row md:items-end gap-2 mb-4">
        <input type="text" placeholder="Filtrar Clube" value={filtros.clube} onChange={e => setFiltros({ ...filtros, clube: e.target.value })} className="border p-2 rounded w-full md:w-auto" />
        <input type="text" placeholder="Filtrar Estádio" value={filtros.estadio} onChange={e => setFiltros({ ...filtros, estadio: e.target.value })} className="border p-2 rounded w-full md:w-auto" />
        <select value={filtros.continente} onChange={e => setFiltros({ ...filtros, continente: e.target.value })} className="border p-2 rounded w-full md:w-auto">
          <option value="">Todos</option>
          <option value="Sim">Continente</option>
          <option value="Não">Ilhas</option>
        </select>
      </div>

      <div className="mb-4 border p-4 rounded bg-gray-50">
        <h2 className="font-semibold mb-2 flex items-center gap-2"><FiPlus /> Adicionar Clube</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
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
            <th className="p-2 border"></th>
          </tr>
        </thead>
        <tbody>
          {clubesFiltrados.map((clube, index) => (
            <>
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-2 border text-center">{clube.nome}</td>
                <td className="p-2 border text-center">{clube.estadio}</td>
                <td className="p-2 border text-center">{clube.capacidade}</td>
                <td className="p-2 border text-center">
                  <a href={clube.site} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Site</a>
                </td>
                <td className="p-2 border text-center">{clube.locaisVenda}</td>
                <td className="p-2 border text-center">{clube.continente ? 'Sim' : 'Não'}</td>
                <td className="p-2 border text-center">
                  <button onClick={() => handleExpand(index)} className="text-blue-600">
                    {expanded === index ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </td>
              </tr>
              {expanded === index && (
                <tr className="bg-gray-50">
                  <td colSpan={7} className="p-4">
                    <div className="flex flex-col gap-4">
                      <textarea
                        className="border p-2 w-full rounded"
                        rows={4}
                        placeholder="Notas sobre este clube..."
                        value={nota}
                        onChange={(e) => setNota(e.target.value)}
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <FaPaperclip /> Anexar ficheiros (PDF, imagens)
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileChange(e, index)}
                        />
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
