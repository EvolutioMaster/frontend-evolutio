'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'agent', text: '¡Hola! ¿Cómo puedo ayudarte hoy con TotalEnergies?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/bedrock-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: input })
      });

      const data = await res.json();
      const botMessage = { role: 'agent', text: data.response || 'No response received.' };
      setMessages(prev => [...prev, botMessage]);
    } catch {
      setMessages(prev => [...prev, { role: 'agent', text: 'Error contacting agent.' }]);
    } finally {
      setLoading(false);
    }
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
        <h2 className="text-lg font-semibold mb-2">Chatbot</h2>

        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-md w-fit max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white self-end ml-auto'
                  : 'bg-gray-100 text-black'
              }`}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="bg-gray-100 p-3 rounded-md w-fit text-sm italic text-gray-500">
              Thinking...
            </div>
          )}
        </div>

        <form className="flex" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Type a message"
            className="flex-1 border border-gray-300 rounded-l-md px-4 py-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md"
            disabled={loading}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}


