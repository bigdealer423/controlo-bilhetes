import { useEffect, useState } from "react";
import { FaUpload, FaFileAlt } from "react-icons/fa";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { MultiSelect } from "react-multi-select-component";

export default function Disputas() {
    const [disputas, setDisputas] = useState([]);
    const [notaEdit, setNotaEdit] = useState({});
    const [selectedEtiquetas, setSelectedEtiquetas] = useState({});
    const etiquetasOpcoes = [
        { label: "Cobrança em disputa", value: "Cobrança em disputa" },
        { label: "Cliente contactado", value: "Cliente contactado" },
        { label: "A aguardar viagogo", value: "A aguardar viagogo" },
    ];

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
                    etiquetas_disputa: selectedEtiquetas[id]?.map(e => e.value).join(", ") || ""
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
        <div className="p-4 dark:bg-gray-900 min-h-screen">
            <h1 className="text-xl font-bold mb-4 dark:text-white">🛡️ Disputas</h1>
            <table className="min-w-full border dark:border-gray-700 text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                        <th className="p-2 border dark:border-gray-700">ID</th>
                        <th className="p-2 border dark:border-gray-700">Evento</th>
                        <th className="p-2 border dark:border-gray-700">Ganho</th>
                        <th className="p-2 border dark:border-gray-700">Estado</th>
                        <th className="p-2 border dark:border-gray-700">Notas</th>
                        <th className="p-2 border dark:border-gray-700">Ficheiros</th>
                    </tr>
                </thead>
                <tbody>
                    {disputas.map((d) => (
                        <tr key={d.id} className="dark:hover:bg-gray-800">
                            <td className="p-2 border dark:border-gray-700">{d.id}</td>
                            <td className="p-2 border dark:border-gray-700">{d.evento}</td>
                            <td className="p-2 border dark:border-gray-700">{d.ganho}€</td>
                            <td className="p-2 border dark:border-gray-700">
                                <select
                                    value={d.estado}
                                    onChange={(e) => atualizarEstado(d.id, e.target.value)}
                                    className="p-1 rounded dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="Disputa">Disputa</option>
                                    <option value="Pago">Pago</option>
                                    <option value="Cancelado">Cancelado</option>
                                    <option value="Entregue">Entregue</option>
                                </select>
                            </td>
                            <td className="p-2 border dark:border-gray-700">
                                // Substituir o MultiSelect anterior por este bloco

                                <Popover>
                                    <PopoverTrigger className="p-1 text-blue-600 dark:text-blue-400 hover:underline">📝 Editar</PopoverTrigger>
                                    <PopoverContent className="p-2 bg-white dark:bg-gray-900 border dark:border-gray-700 w-72">
                                        <textarea
                                            value={notaEdit[d.id] || d.nota_disputa || ""}
                                            onChange={(e) => setNotaEdit(prev => ({ ...prev, [d.id]: e.target.value }))}
                                            placeholder="Adicionar detalhes..."
                                            className="w-full p-1 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded mb-2"
                                        />
                                        <div className="mb-2">
                                            <label className="block text-sm mb-1 dark:text-white">Etiquetas:</label>
                                            <select
                                                multiple
                                                className="w-full p-1 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded"
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
                                        </div>
                                        <button
                                            onClick={() => guardarNota(d.id)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded w-full"
                                        >
                                            Guardar Nota
                                        </button>
                                    </PopoverContent>
                                </Popover>

                            </td>
                            <td className="p-2 border dark:border-gray-700">
                                <label className="cursor-pointer">
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
    );
}
