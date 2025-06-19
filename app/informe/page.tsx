'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function InformePage() {
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
    } catch (err) {
      setMarkdown('⚠️ Error al generar el informe.');
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 p-4">
      <div className="w-1/3 flex items-center justify-center bg-white rounded-2xl shadow-md p-4">
        <Image
          src="/evolutio-logo.png"
          alt="Evolutio Logo"
          width={180}
          height={80}
        />
      </div>

      <div className="w-2/3 p-6 bg-white rounded-2xl shadow-md flex flex-col">
        <h2 className="text-lg font-semibold mb-4">Generador de Informes 📄</h2>

        <input
          className="border rounded p-2 w-full mb-4"
          placeholder="Ej: informe sobre servicios de TotalEnergies"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 w-fit"
          onClick={generarInforme}
          disabled={loading || !input.trim()}
        >
          {loading ? 'Generando...' : 'Generar Informe'}
        </button>

        {markdown && (
          <div className="mt-6 whitespace-pre-wrap border p-4 bg-gray-50 rounded text-sm">
            {markdown}
          </div>
        )}
      </div>
    </div>
  );
}
