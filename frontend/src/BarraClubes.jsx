import clubesLinks from "./clubesLinks";

export default function BarraClubes() {
  return (
    <div className="flex overflow-x-auto bg-gray-100 dark:bg-gray-800 p-2 space-x-3 border-b border-gray-300 dark:border-gray-600">
      {clubesLinks.map((clube, index) => (
        <a
          key={index}
          href={clube.urlVenda}
          target="_blank"
          rel="noopener noreferrer"
          title={`Ir para bilhetes de ${clube.nome}`}
          className="flex-shrink-0 hover:scale-110 transition-transform duration-200"
        >
          <img
            src={clube.logo}
            alt={clube.nome}
            className="w-10 h-10 object-contain rounded-full shadow-sm"
          />
        </a>
      ))}
    </div>
  );
}
