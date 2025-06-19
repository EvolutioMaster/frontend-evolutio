"use client";
import { useState } from "react";

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    { role: "agent", text: "¡Hola! ¿Cómo puedo ayudarte hoy con TotalEnergies?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/bedrock-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText: input }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: data.response || "No response received." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "❌ Error al contactar con el agente." },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-md w-fit max-w-[80%] ${
              m.role === "user"
                ? "bg-blue-500 text-white self-end ml-auto"
                : "bg-gray-100"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="italic text-gray-400">pensando…</div>
        )}
      </div>

      <div className="flex">
        <input
          className="flex-1 border rounded-l-md px-4 py-2"
          placeholder="Escribe tu pregunta…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-r-md disabled:opacity-50"
          disabled={loading || !input.trim()}
          onClick={sendMessage}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}