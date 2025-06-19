'use client';

import { useState } from 'react';
import Image from 'next/image';
import ChatPanel from './components/ChatPanel';
import ReportPanel from './components/ReportPanel';

export default function HomePage() {
  const [modo, setModo] = useState<'chat' | 'informe'>('chat');

  return (
    <div className="flex h-screen bg-gray-100 p-4">
      {/* Lado izquierdo */}
      <div className="w-1/3 bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center">
        <Image src="/evolutio-logo.png" alt="Evolutio Logo" width={180} height={80} />

        <div className="mt-8 flex gap-2">
          <button
            className={`px-4 py-1 rounded ${modo === 'chat' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setModo('chat')}
          >
            Chat
          </button>
          <button
            className={`px-4 py-1 rounded ${modo === 'informe' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setModo('informe')}
          >
            Informe
          </button>
        </div>
      </div>

      {/* Lado derecho */}
      <div className="w-2/3 p-6 bg-white rounded-2xl shadow-md flex flex-col">
        {modo === 'chat' ? <ChatPanel /> : <ReportPanel />}
      </div>
    </div>
  );
}
