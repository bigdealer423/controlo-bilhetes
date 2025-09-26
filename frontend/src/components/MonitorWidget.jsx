import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://controlo-bilhetes.onrender.com";

export default function MonitorWidget() {
  const [url, setUrl] = useState("");
  const [targetH2, setTargetH2] = useState("Bancada Emirates");
  const [targetExtra, setTargetExtra] = useState("Piso 0 Inf");
  const [waitSelector, setWaitSelector] = useState("");        // opcional
  const [selector, setSelector] = useState("#content-wrapper"); // opcional -> onde tirar o print
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imgBust, setImgBust] = useState(Date.now());          // cache-buster da imagem

  async function call(path, options) {
    const res = await fetch(`${API_BASE}/api/monitor/${path}`, {
      // ⚠️ evita enviar cookies até o CORS estar 100% afinado
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    // mostra erro útil em vez de "Failed to fetch"
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${text || "sem corpo"}`);
    }
    // algumas rotas devolvem empty; tenta JSON mas faz fallback
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  async function start() {
    if (!url.trim()) {
      alert("Coloca a URL do jogo.");
      return;
    }
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
          // 👇 novos campos para clicar na bancada certa e esperar
          target_h2: targetH2 || null,
          target_extra: targetExtra || null,
          wait_selector: waitSelector || null,
          extra_wait_ms: 1200,
          selector: selector || null,
        }),
      });
      await loadStatus(true);
    } catch (e) {
      console.error(e);
      alert(`Erro a iniciar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function stop() {
    setLoading(true);
    try {
      await call("stop", { method: "POST" });
      await loadStatus(true);
    } catch (e) {
      console.error(e);
      alert(`Erro a parar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadStatus(bumpImage = false) {
    try {
      const data = await call("status", { method: "GET" });
      setStatus(data);
      if (bumpImage) setImgBust(Date.now()); // força refresh do screenshot
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadStatus(false);
    const id = setInterval(() => loadStatus(false), 5000);
    return () => clearInterval(id);
  }, []);

  const latestImgUrl = `${API_BASE}/api/monitor/screenshot/latest?ts=${imgBust}`;

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-3">🎟️ Monitor Benfica</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL do jogo"
          className="w-full p-2 rounded text-black"
        />
        <input
          type="text"
          value={selector}
          onChange={(e) => setSelector(e.target.value)}
          placeholder="CSS do elemento a ‘fotografar’ (ex: #content-wrapper)"
          className="w-full p-2 rounded text-black"
        />
        <input
          type="text"
          value={targetH2}
          onChange={(e) => setTargetH2(e.target.value)}
          placeholder='Texto do <h2> (ex: "Bancada Emirates")'
          className="w-full p-2 rounded text-black"
        />
        <input
          type="text"
          value={targetExtra}
          onChange={(e) => setTargetExtra(e.target.value)}
          placeholder='Texto extra (ex: "Piso 0 Inf")'
          className="w-full p-2 rounded text-black"
        />
        <input
          type="text"
          value={waitSelector}
          onChange={(e) => setWaitSelector(e.target.value)}
          placeholder="Seletor que aparece depois do clique (opcional)"
          className="w-full p-2 rounded text-black md:col-span-2"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={start}
          disabled={loading}
          className="bg-green-600 px-3 py-1 rounded"
          title="Iniciar monitor"
        >
          ▶️ Iniciar
        </button>
        <button
          onClick={stop}
          disabled={loading}
          className="bg-red-600 px-3 py-1 rounded"
          title="Parar monitor"
        >
          ⏹️ Parar
        </button>
        <button
          onClick={() => { setImgBust(Date.now()); }}
          className="bg-blue-600 px-3 py-1 rounded"
          title="Atualizar imagem"
        >
          🔄 Atualizar screenshot
        </button>
      </div>

      {status && (
        <div className="text-sm space-y-1 mb-3">
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

      {/* screenshot atual */}
      <div className="w-full border rounded-lg bg-black/20 p-2">
        <img
          src={latestImgUrl}
          alt="Último screenshot do monitor"
          className="w-full h-auto rounded"
          onError={() => {
            // não quebra o layout, só avisa na consola
            console.warn("Screenshot ainda não disponível.");
          }}
          onClick={() => window.open(latestImgUrl, "_blank", "noopener,noreferrer")}
        />
      </div>
    </div>
  );
}
