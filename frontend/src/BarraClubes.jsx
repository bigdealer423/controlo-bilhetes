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
        const clubesFiltrados = data.filter(clube => 
  clube.capacidade && clube.capacidade.endsWith(" ")
);
setClubes(clubesFiltrados);

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
            <img
              src={clube.simbolo}
              alt={clube.nome}
              className="w-5 h-5 object-contain rounded-full shadow-sm bg-white"
            />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-xs text-center p-1">
              {clube.nome.split(" ").slice(0, 2).join("\n")}
            </div>
          )}
        </a>
      ))}
    </div>
  );
}
