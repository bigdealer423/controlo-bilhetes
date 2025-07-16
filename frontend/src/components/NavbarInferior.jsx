import { Link } from "react-router-dom";
import { FaListUl, FaCalendarAlt, FaInfoCircle, FaShoppingCart, FaExclamationTriangle, FaUser } from "react-icons/fa";

export default function NavbarInferior() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-3 z-50 md:hidden shadow-md h-20">
      <Link to="/listagem-vendas" className="flex flex-col items-center text-xs text-gray-700">
        <FaListUl size={20} />
        <span>Vendas</span>
      </Link>
      <Link to="/eventos" className="flex flex-col items-center text-sm text-gray-700 gap-1">
        <FaCalendarAlt size={20} />
        <span>Eventos</span>
      </Link>
      <Link to="/info-clubes" className="flex flex-col items-center text-sm text-gray-700 gap-1">
        <FaInfoCircle size={20} />
        <span>Clubes</span>
      </Link>
      <Link to="/compras" className="flex flex-col items-center text-sm text-gray-700 gap-1">
        <FaShoppingCart size={20} />
        <span>Compras</span>
      </Link>
      <Link to="/disputas" className="flex flex-col items-center text-sm text-gray-700 gap-1">
        <FaExclamationTriangle size={20} />
        <span>Disputas</span>
      </Link>
      <Link to="/outro" className="flex flex-col items-center text-sm text-gray-700 gap-1">
        <FaUser size={20} />
        <span>Perfil</span>
      </Link>
    </div>
  );
}
