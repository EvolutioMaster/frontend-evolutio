"use client";

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function ReportGenerator() {
  const [input, setInput] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);

  const generarInforme = async () => {
    setLoading(true);
    setMarkdown('');
    try {
      const res = await fetch('/api/bedrock-informe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: input }),
      });

      const data = await res.json();
      setMarkdown(data.markdown || '⚠️ No se generó contenido.');
    } catch (error) {
      setMarkdown('❌ Error al generar el informe.');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Generador de Informes 📄</h1>

      <input
        className="border rounded p-2 w-full mb-4"
        placeholder="Ej: Informe sobre contratos de TotalEnergies"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={generarInforme}
        disabled={loading || !input.trim()}
      >
        {loading ? 'Generando...' : 'Generar Informe'}
      </button>

      {markdown && (
        <div className="mt-6 prose prose-sm sm:prose lg:prose-lg max-w-none bg-gray-50 p-4 rounded">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
