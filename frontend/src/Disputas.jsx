import { useEffect, useState } from "react";
import { FaUpload, FaFileAlt } from "react-icons/fa";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export default function Disputas() {
    const [disputas, setDisputas] = useState([]);
    const [notaEdit, setNotaEdit] = useState({});
    const [selectedEtiquetas, setSelectedEtiquetas] = useState({});

    const fetchDisputas = async () => {
        try {
            const res = await fetch("/listagem_vendas?estado=Disputa");
            const data = await res.json();
            setDisputas(data);
        } catch (error) {
            console.error("Erro ao carregar disputas:", error);
        }
    };

    useEffect(() => {
        fetchDisputas();
        const interval = setInterval(fetchDisputas, 10000);
        return () => clearInterval(interval);
    }, []);

    const atualizarEstado = async (id, novoEstado) => {
        try {
            await fetch(`/listagem_vendas/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: novoEstado }),
            });
            fetchDisputas();
        } catch (error) {
            console.error("Erro ao atualizar estado:", error);
        }
    };

    const guardarNota = async (id) => {
        try {
            await fetch(`/listagem_vendas/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nota_disputa: notaEdit[id],
                    etiquetas_disputa: selectedEtiquetas[id]?.join(", ") || ""
                }),
            });
        } catch (error) {
            console.error("Erro ao guardar nota:", error);
        }
    };

    const uploadFicheiros = async (id, files) => {
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append("files", file));
        try {
            await fetch(`/upload_disputa/${id}`, { method: "POST", body: formData });
            alert("Ficheiros enviados com sucesso.");
        } catch (error) {
            console.error("Erro ao enviar ficheiros:", error);
        }
    };

    return (
        <div className="p-4 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <h1 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">🛡️ Disputas</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full border dark:border-gray-700 text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                            {["ID", "Evento", "Ganho", "Estado", "Notas", "Ficheiros"].map((header) => (
                                <th
                                    key={header}
                                    className="p-2 border text-gray-900 dark:text-gray-200 dark:border-gray-700"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {disputas.map((d) => (
                            <tr key={d.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <td className="p-2 border text-gray-900 dark:text-gray-200 dark:border-gray-700">{d.id}</td>
                                <td className="p-2 border text-gray-900 dark:text-gray-200 dark:border-gray-700">{d.evento}</td>
                                <td className="p-2 border text-gray-900 dark:text-gray-200 dark:border-gray-700">{d.ganho}€</td>
                                <td className="p-2 border dark:border-gray-700">
                                    <select
                                        value={d.estado}
                                        onChange={(e) => atualizarEstado(d.id, e.target.value)}
                                        className="p-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border dark:border-gray-600"
                                    >
                                        {["Disputa", "Pago", "Cancelado", "Entregue"].map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-2 border dark:border-gray-700">
                                    <Popover>
                                        <PopoverTrigger className="p-1 text-blue-600 dark:text-blue-400 hover:underline">📝 Editar</PopoverTrigger>
                                        <PopoverContent className="p-2 bg-white dark:bg-gray-900 border dark:border-gray-700 w-80">
                                            <textarea
                                                value={notaEdit[d.id] || d.nota_disputa || ""}
                                                onChange={(e) => setNotaEdit(prev => ({ ...prev, [d.id]: e.target.value }))}
                                                placeholder="Adicionar detalhes..."
                                                className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white mb-2"
                                            />
                                            <label className="block text-sm mb-1 text-gray-900 dark:text-gray-200">Etiquetas:</label>
                                            <select
                                                multiple
                                                className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white mb-2"
                                                value={selectedEtiquetas[d.id] || []}
                                                onChange={(e) => {
                                                    const options = Array.from(e.target.selectedOptions, option => option.value);
                                                    setSelectedEtiquetas(prev => ({ ...prev, [d.id]: options }));
                                                }}
                                            >
                                                <option value="Cobrança em disputa">Cobrança em disputa</option>
                                                <option value="Cliente contactado">Cliente contactado</option>
                                                <option value="A aguardar viagogo">A aguardar viagogo</option>
                                            </select>
                                            <button
                                                onClick={() => guardarNota(d.id)}
                                                className="w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                                            >
                                                Guardar Nota
                                            </button>
                                        </PopoverContent>
                                    </Popover>
                                </td>
                                <td className="p-2 border dark:border-gray-700">
                                    <label className="cursor-pointer text-blue-600 dark:text-blue-400">
                                        <FaUpload className="inline mr-1" />
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => uploadFicheiros(d.id, e.target.files)}
                                        />
                                    </label>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
