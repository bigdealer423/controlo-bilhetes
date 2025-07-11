import { useEffect, useState } from "react";
import { FaUpload } from "react-icons/fa";
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
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-white dark:bg-gray-900 dark:text-gray-100 rounded shadow-lg transition-colors duration-300">
            <h1 className="text-2xl font-bold mb-4">🛡️ Disputas</h1>

            <div className="overflow-x-auto w-full">
                <table className="min-w-full border border-gray-300 dark:border-gray-600 text-sm text-left text-gray-900 dark:text-gray-100 transition-colors duration-300">
                    <thead className="bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
                        <tr>
                            <th className="p-2">ID Venda</th>
                            <th className="p-2">Data Venda</th>
                            <th className="p-2">Data Evento</th>
                            <th className="p-2">Evento</th>
                            <th className="p-2">Bilhete</th>
                            <th className="p-2">Ganho (€)</th>
                            <th className="p-2">Estado</th>
                            <th className="p-2">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {disputas.map((d) => (
                            <tr key={d.id} className="border-t bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="p-2">{d.id_venda}</td>
                                <td className="p-2">
                                    {d.data_venda ? new Date(d.data_venda).toLocaleDateString("pt-PT") : ""}
                                </td>
                                <td className="p-2">
                                    {d.data_evento ? new Date(d.data_evento).toLocaleDateString("pt-PT") : ""}
                                </td>
                                <td className="p-2">{d.evento}</td>
                                <td className="p-2">{d.estadio}</td>
                                <td className="p-2">{d.ganho} €</td>
                                <td className="p-2">
                                    <select
                                        value={d.estado}
                                        onChange={(e) => atualizarEstado(d.id, e.target.value)}
                                        className="border p-1 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    >
                                        <option value="Disputa">Disputa</option>
                                        <option value="Pago">Pago</option>
                                        <option value="Entregue">Entregue</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                </td>
                                <td className="p-2 flex flex-wrap gap-2">
                                    <Popover>
                                        <PopoverTrigger className="text-blue-600 dark:text-blue-400 hover:underline">📝 Nota</PopoverTrigger>
                                        <PopoverContent className="p-3 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded w-80">
                                            <textarea
                                                value={notaEdit[d.id] || d.nota_disputa || ""}
                                                onChange={(e) => setNotaEdit(prev => ({ ...prev, [d.id]: e.target.value }))}
                                                placeholder="Adicionar detalhes..."
                                                className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white mb-2"
                                            />
                                            <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Etiquetas:</label>
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
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                                            >
                                                Guardar Nota
                                            </button>
                                        </PopoverContent>
                                    </Popover>
                                    <label className="cursor-pointer text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <FaUpload />
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => uploadFicheiros(d.id, e.target.files)}
                                        />
                                        Anexar
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
