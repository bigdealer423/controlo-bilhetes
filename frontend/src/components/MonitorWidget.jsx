import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://controlo-bilhetes.onrender.com";

export default function MonitorWidget() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function call(path, options) {
    const res = await fetch(`${API_BASE}/api/monitor/${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    return res.json();
  }

  async function start() {
    setLoading(true);
    try {
      await call("start", {
        method: "POST",
        body: JSON.stringify({
          url,
          quantity: 2,
          interval_s: 60,
          diff_threshold: 0.1,
          non_red: true,
          non_red_threshold: 0.5,
        }),
      });
      await loadStatus();
    } finally {
      setLoading(false);
    }
  }

  async function stop() {
    setLoading(true);
    try {
      await call("stop", { method: "POST" });
      await loadStatus();
    } finally {
      setLoading(false);
    }
  }

  async function loadStatus() {
    const data = await call("status", { method: "GET" });
    setStatus(data);
  }

  useEffect(() => {
    loadStatus();
    const id = setInterval(loadStatus, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-2">🎟️ Monitor Benfica</h2>

      <input
        type="text"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="URL do jogo"
        className="w-full p-2 mb-2 rounded text-black"
      />

      <div className="flex gap-2 mb-3">
        <button
          onClick={start}
          disabled={loading}
          className="bg-green-600 px-3 py-1 rounded"
        >
          ▶️ Iniciar
        </button>
        <button
          onClick={stop}
          disabled={loading}
          className="bg-red-600 px-3 py-1 rounded"
        >
          ⏹️ Parar
        </button>
      </div>

      {status && (
        <div className="text-sm">
          <p>Ativo: {status.running ? "🟢 Sim" : "🔴 Não"}</p>
          <p>URL: {status.url || "—"}</p>
          <p>Última diferença: {status.last_result?.diff_pct ?? "—"} %</p>
          <p>Não-vermelho: {status.last_result?.non_red_pct ?? "—"} %</p>
          {status.last_result?.overlay && (
            <a
              href={`${API_BASE}/monitor-out/${status.last_result.overlay.split("/").pop()}`}
              target="_blank"
              rel="noreferrer"
              className="underline text-blue-400"
            >
              Ver overlay
            </a>
          )}
        </div>
      )}
    </div>
  );
}
