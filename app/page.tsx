'use client';

import { useState } from 'react';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const preguntar = async () => {
    setLoading(true);
    setResponse('');
    try {
      const res = await fetch('/api/bedrock-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: input }),
      });

      const data = await res.json();
      setResponse(data.response || data.error);
    } catch (error) {
      setResponse('Error al contactar con el agente.');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-xl mx-auto mt-10 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Chat con el Agente IA 🤖</h1>
      <textarea
        className="w-full border p-2 rounded mb-4"
        rows={4}
        placeholder="Escribe tu pregunta..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={preguntar}
        disabled={loading || !input.trim()}
      >
        {loading ? 'Consultando...' : 'Preguntar'}
      </button>

      {response && (
        <div className="mt-6 p-4 bg-gray-100 rounded border">
          <strong>Respuesta:</strong>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
