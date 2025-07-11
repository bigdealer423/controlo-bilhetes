import { useState, useEffect } from "react";
import { FaUpload, FaChevronDown, FaChevronUp, FaFileAlt } from "react-icons/fa";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Disputas() {
    const [disputas, setDisputas] = useState([]);
    const [notaEdit, setNotaEdit] = useState({});
    const [selectedEtiquetas, setSelectedEtiquetas] = useState({});
    const [expandedRow, setExpandedRow] = useState(null);
    const [ficheiros, setFicheiros] = useState({});

    const fetchDisputas = async () => {
        try {
            const res = await fetch("https://controlo-bilhetes.onrender.com/listagem_vendas?estado=Disputa");
            const data = await res.json();
            setDisputas(data);

                // ✅ Pré-carregar etiquetas de cada disputa:
            const etiquetasMap = {};
            data.forEach(d => {
                etiquetasMap[d.id] = d.etiquetas_disputa
                    ? d.etiquetas_disputa.split(",").map(e => e.trim())
                    : [];
            });
            setSelectedEtiquetas(etiquetasMap);
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
        await fetch(`/listagem_vendas/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: novoEstado }),
        });
        fetchDisputas();
    };

    const guardarNota = async (id) => {
    try {
        await fetch(`https://controlo-bilhetes.onrender.com/listagem_vendas/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nota_disputa: notaEdit[id],
                etiquetas_disputa: selectedEtiquetas[id]?.join(", ") || ""
            }),
        });
        toast.success("Nota guardada com sucesso.");
    } catch (error) {
        console.error("Erro ao guardar nota:", error);
        toast.error("Erro ao guardar nota.");
    }
};


    const uploadFicheiros = async (id, files) => {
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append("files", file));
        await fetch(`/upload_disputa/${id}`, { method: "POST", body: formData });
        alert("Ficheiros enviados com sucesso.");
    };

    const toggleExpandRow = async (id) => {
        if (expandedRow === id) {
            setExpandedRow(null);
        } else {
            setExpandedRow(id);
            // Opcional: Carregar ficheiros anexados
            try {
                const res = await fetch(`/listar_ficheiros_disputa/${id}`);
                const data = await res.json();
                setFicheiros(prev => ({ ...prev, [id]: data }));
            } catch {
                setFicheiros(prev => ({ ...prev, [id]: [] }));
            }
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-white dark:bg-gray-900 dark:text-gray-100 rounded shadow-lg transition-colors duration-300">
            <h1 className="text-2xl font-bold mb-4">🛡️ Disputas</h1>
            <div className="overflow-x-auto w-full">
                <table className="min-w-full border border-gray-300 dark:border-gray-600 text-sm text-left text-gray-900 dark:text-gray-100">
                    <thead className="bg-gray-100 dark:bg-gray-800">
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
                            <>
                                <tr key={d.id} className="border-t bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="p-2">{d.id_venda}</td>
                                    <td className="p-2">{d.data_venda ? new Date(d.data_venda).toLocaleDateString("pt-PT") : ""}</td>
                                    <td className="p-2">{d.data_evento ? new Date(d.data_evento).toLocaleDateString("pt-PT") : ""}</td>
                                    <td className="p-2">{d.evento}</td>
                                    <td className="p-2">{d.estadio}</td>
                                    <td className="p-2">{d.ganho} €</td>
                                    <td className="p-2">
                                        <select
                                            value={d.estado}
                                            onChange={(e) => atualizarEstado(d.id, e.target.value)}
                                            className="border p-1 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        >
                                            {["Disputa", "Pago", "Entregue", "Cancelado"].map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <button
                                            onClick={() => toggleExpandRow(d.id)}
                                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                            {expandedRow === d.id ? <FaChevronUp /> : <FaChevronDown />}
                                            Detalhes
                                        </button>
                                    </td>
                                </tr>
                                {expandedRow === d.id && (
                                    <tr className="bg-gray-50 dark:bg-gray-800 border-b">
                                        <td colSpan={8} className="p-4">
                                            <div className="flex flex-col gap-2">
                                                <textarea
                                                    rows={5} // 🚀 Aumenta altura
                                                    value={notaEdit[d.id] || d.nota_disputa || ""}
                                                    onChange={(e) => setNotaEdit(prev => ({ ...prev, [d.id]: e.target.value }))}
                                                    placeholder="Adicionar detalhes..."
                                                    className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded mb-3 text-sm md:text-base"
                                                />

                                                <select
                                                    multiple
                                                    size={6} // 🚩 define 6 linhas visíveis
                                                    className="w-full p-2 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded mb-3 text-sm md:text-base"
                                                    style={{ height: '140px' }} // 🚀 força altura real
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
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => guardarNota(d.id)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                                    >
                                                        Guardar Nota
                                                    </button>
                                                    <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1">
                                                        <FaUpload />
                                                        Anexar Ficheiros
                                                        <input
                                                            type="file"
                                                            multiple
                                                            className="hidden"
                                                            onChange={(e) => uploadFicheiros(d.id, e.target.files)}
                                                        />
                                                    </label>
                                                </div>
                                                {ficheiros[d.id]?.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="font-semibold">📂 Ficheiros anexados:</p>
                                                        <ul className="list-disc ml-5">
                                                            {ficheiros[d.id].map((file, idx) => (
                                                                <li key={idx}>
                                                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                                                        <FaFileAlt /> {file.nome}
                                                                    </a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
