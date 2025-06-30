// InfoClubes.jsx
import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { FaPaperclip } from 'react-icons/fa';

export default function InfoClubes() {
  const [clubes, setClubes] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [nota, setNota] = useState('');
  const [ficheiros, setFicheiros] = useState({});

  const handleExpand = (index) => {
    setExpanded(expanded === index ? null : index);
  };

  const handleFileChange = (e, index) => {
    const files = e.target.files;
    setFicheiros({ ...ficheiros, [index]: files });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Info Clubes</h1>
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
          {clubes.map((clube, index) => (
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
