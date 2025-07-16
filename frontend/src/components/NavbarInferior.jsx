import { FaListUl, FaCalendarAlt, FaInfoCircle, FaShoppingCart, FaExclamationTriangle, FaUser } from "react-icons/fa";

export default function NavbarInferior() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 z-50 md:hidden shadow-md">
      <button className="flex flex-col items-center text-xs text-gray-700">
        <FaListUl size={20} />
        <span>Vendas</span>
      </button>
      <button className="flex flex-col items-center text-xs text-gray-700">
        <FaCalendarAlt size={20} />
        <span>Eventos</span>
      </button>
      <button className="flex flex-col items-center text-xs text-gray-700">
        <FaInfoCircle size={20} />
        <span>Clubes</span>
      </button>
      <button className="flex flex-col items-center text-xs text-gray-700">
        <FaShoppingCart size={20} />
        <span>Compras</span>
      </button>
      <button className="flex flex-col items-center text-xs text-gray-700">
        <FaExclamationTriangle size={20} />
        <span>Disputas</span>
      </button>
      <button className="flex flex-col items-center text-xs text-gray-700">
        <FaUser size={20} />
        <span>Perfil</span>
      </button>
    </div>
  );
}
