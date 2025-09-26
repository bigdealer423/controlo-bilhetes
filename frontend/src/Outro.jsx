import { useState, useEffect } from "react";

function MonitorWidget() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState(null);

  async function start() {
    await fetch("/api/monitor/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    loadStatus();
  }

  async function stop() {
    await fetch("/api/monitor/stop", { method: "POST" });
    loadStatus();
  }

  async function loadStatus() {
    const res = await fetch("/api/monitor/status");
    const data = await res.json();
    setStatus(data);
  }

  useEffect(() => {
    loadStatus();
    const id = setInterval(loadStatus, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-4 border rounded bg-gray-800 text-white">
      <h3 className="text-lg font-bold mb-2">Monitor Benfica</h3>
      <input
        type="text"
        placeholder="URL do jogo"
        value={url}
        onChange={e => setUrl(e.target.value)}
        className="w-full p-2 text-black"
      />
      <div className="mt-2 flex gap-2">
        <button onClick={start} className="bg-green-600 px-3 py-1 rounded">▶️ Iniciar</button>
        <button onClick={stop} className="bg-red-600 px-3 py-1 rounded">⏹️ Parar</button>
      </div>
      {status && (
        <div className="mt-3 text-sm">
          <p>Ativo: {status.running ? "✅" : "❌"}</p>
          <p>URL: {status.url || "—"}</p>
          <p>Última diferença: {status.last_result?.diff_pct ?? "—"} %</p>
        </div>
      )}
    </div>
  );
}

export default MonitorWidget;
