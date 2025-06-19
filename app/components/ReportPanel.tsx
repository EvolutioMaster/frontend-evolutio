"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function ReportPanel() {
  const [input, setInput] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);

  const generarInforme = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setMarkdown("");

    try {
      const res = await fetch("/api/bedrock-informe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText: input }),
      });
      const data = await res.json();
      setMarkdown(data.markdown || "⚠️ No se generó contenido.");
    } catch {
      setMarkdown("❌ Error al generar el informe.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <textarea
        className="border rounded p-2 w-full mb-4"
        rows={3}
        placeholder="Ej: Informe sobre contratos activos…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 w-fit mb-4"
        disabled={loading || !input.trim()}
        onClick={generarInforme}
      >
        {loading ? "Generando…" : "Generar Informe"}
      </button>

      <div className="flex-1 overflow-y-auto whitespace-pre-wrap bg-gray-50 p-4 rounded text-sm">
        {markdown ? <ReactMarkdown>{markdown}</ReactMarkdown> : <span className="text-gray-400">El informe aparecerá aquí…</span>}
      </div>
    </div>
  );
}
