
import { FaCog } from "react-icons/fa";

export default function Dashboard() {
  return (
    <div className="p-4">
      <div className="flex justify-end">
        <button className="text-gray-600 hover:text-black">
          <FaCog size={24} />
        </button>
      </div>
      <h1 className="text-xl mt-4">Dashboard</h1>
    </div>
  );
}
