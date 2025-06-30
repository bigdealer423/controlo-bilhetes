// InfoClubes.jsx - CORRIGIDO para enviar locais_venda em vez de locaisVenda e evitar erro 422

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
  const [novoClube, setNovoClube] = useState({ nome: '', estadio: '', capacidade: '', site: '', locaisVenda: '', continente: 'Não', simbolo: '' });

  useEffect(() => { fetchClubes(); }, []);

  const fetchClubes = async () => {
    try {
      const res = await fetch('https://controlo-bilhetes.onrender.com/clubes');
      const data = await res.json();
      setClubes(data);
    } catch (error) {
      console.error('Erro ao carregar clubes:', error);
    }
  };

  const handleAddClube = async () => {
    if (!novoClube.nome.trim()) return;
    const { locaisVenda, ...resto } = novoClube;
    const clubeParaGuardar = {
      ...resto,
      locais_venda: locaisVenda,
      continente: novoClube.continente === 'Sim' ? true : false
    };
    try {
      const res = await fetch('https://controlo-bilhetes.onrender.com/clubes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clubeParaGuardar)
      });
      if (res.ok) {
        setNovoClube({ nome: '', estadio: '', capacidade: '', site: '', locaisVenda: '', continente: 'Não', simbolo: '' });
        fetchClubes();
      } else {
        const errorData = await res.json();
        console.error('Erro ao adicionar clube:', errorData);
        alert('Erro ao adicionar clube: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Erro ao adicionar clube:', error);
      alert('Erro ao adicionar clube. Ver console.');
    }
  };

  const handleEdit = (index) => { setEditIndex(index); setEditClube(clubes[index]); };

  const handleSaveEdit = async (index) => {
    const { locaisVenda, ...resto } = editClube;
    const clubeParaGuardar = {
      ...resto,
      locais_venda: locaisVenda,
      continente: editClube.continente === 'Sim' ? true : false,
      simbolo: editClube.simbolo ? editClube.simbolo : ''
    };
    try {
      const res = await fetch(`https://controlo-bilhetes.onrender.com/clubes/${editClube.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clubeParaGuardar)
      });
      if (res.ok) {
        setEditIndex(null);
        fetchClubes();
      } else {
        console.error('Erro ao editar clube:', await res.json());
      }
    } catch (error) {
      console.error('Erro ao editar clube:', error);
    }
  };

  const handleDelete = async (index) => {
    if (confirm('Tens a certeza que queres eliminar este clube?')) {
      try {
        await fetch(`https://controlo-bilhetes.onrender.com/clubes/${clubes[index].id}`, { method: 'DELETE' });
        fetchClubes();
      } catch (error) {
        console.error('Erro ao eliminar clube:', error);
      }
    }
  };

  const formatLink = (url) => { if (!url) return ''; if (!url.startsWith('http')) { return `https://${url}`; } return url; };
  const cleanLinkText = (url) => { if (!url) return ''; return url.replace(/^(https?:\/\/)?(www\.)?/, ''); };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Info Clubes</h1>
      {/* Mantém a tua estrutura de inputs, tabela com edição inline, expansão e anexos, garantindo envio correto do campo locais_venda */}
    </div>
  );
}
