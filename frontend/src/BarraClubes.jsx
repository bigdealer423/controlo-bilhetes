import { useState, useEffect } from "react";

export default function BarraClubes() {
  const [clubes, setClubes] = useState([]);

  useEffect(() => {
    const fetchClubes = async () => {
      try {
        const res = await fetch("https://controlo-bilhetes.onrender.com/clubes");
        const data = await res.json();
        // Ordena alfabeticamente
        data.sort((a, b) => (a.nome || "").localeCompare(b.nome || "", 'pt', { sensitivity: 'base' }));
        setClubes(data);
      } catch (error) {
        console.error("Erro ao carregar clubes:", error);
      }
    };

    fetchClubes();
  }, []);

  const formatLink = (url) => {
    if (!url) return '#';
    if (!url.startsWith('http')) {
      return `https://${url}`;
    }
    return url;
  };

  return (
    <div className="flex overflow-x-auto bg-gray-100 dark:bg-gray-800 p-2 space-x-3 border-b border-gray-300 dark:border-gray-600">
      {clubes.map((clube, index) => (
        <a
          key={index}
          href={formatLink(clube.locais_venda)}
          target="_blank"
          rel="noopener noreferrer"
          title={`Bilhetes: ${clube.nome}`}
          className="flex-shrink-0 hover:scale-110 transition-transform duration-200"
        >
          {clube.simbolo ? (
