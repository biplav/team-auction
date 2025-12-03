'use client';

import { useEffect, useState } from 'react';
import { createSocketClient } from '@/lib/socket-client';

export default function TestSocketPage() {
  const [status, setStatus] = useState<string>('Connecting...');
  const [socketUrl, setSocketUrl] = useState<string>('');
  const [socketId, setSocketId] = useState<string>('');
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    setSocketUrl(envUrl || 'Same origin (no NEXT_PUBLIC_SOCKET_URL set)');

    const socket = createSocketClient();

    socket.on('connect', () => {
      setStatus('✅ Connected');
      setSocketId(socket.id || 'unknown');
      addEvent('Connected to socket server');
    });

    socket.on('connect_error', (error) => {
      setStatus('❌ Connection Error');
      addEvent(`Connection error: ${error.message}`);
    });

    socket.on('disconnect', (reason) => {
      setStatus('❌ Disconnected');
      addEvent(`Disconnected: ${reason}`);
    });

    socket.on('reconnect', (attemptNumber) => {
      setStatus('✅ Reconnected');
      addEvent(`Reconnected after ${attemptNumber} attempts`);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      setStatus('🔄 Reconnecting...');
      addEvent(`Reconnection attempt ${attemptNumber}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const addEvent = (event: string) => {
    setEvents(prev => [`${new Date().toLocaleTimeString()}: ${event}`, ...prev].slice(0, 10));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Socket.io Connection Test</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Connection Status:</h2>
            <p className="text-2xl font-bold">{status}</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Socket ID:</h2>
            <p className="font-mono bg-gray-100 p-2 rounded">
              {socketId || 'Not connected'}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Socket URL Configuration:</h2>
            <p className="font-mono bg-gray-100 p-2 rounded text-sm break-all">
              {socketUrl}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Event Log:</h2>
            <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm max-h-64 overflow-y-auto">
              {events.length > 0 ? (
                events.map((event, idx) => (
                  <div key={idx}>{event}</div>
                ))
              ) : (
                <div className="text-gray-500">No events yet...</div>
              )}
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h2 className="text-xl font-semibold mb-2">Expected Configuration:</h2>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="font-semibold mb-2">For Railway Deployment:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_SOCKET_URL</code> should be <strong>empty</strong> or <strong>not set</strong></li>
                <li>Socket will connect to same server at path <code className="bg-gray-100 px-2 py-1 rounded">/api/socket</code></li>
                <li>Your server.js handles both Next.js and Socket.io</li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h2 className="text-xl font-semibold mb-2">Troubleshooting:</h2>
            <div className="space-y-2 text-sm">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="font-semibold">If you see "Connection Error":</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Check Railway variables - remove or empty <code className="bg-gray-100 px-1">NEXT_PUBLIC_SOCKET_URL</code></li>
                  <li>Ensure server.js is running (check Railway logs)</li>
                  <li>Redeploy after removing the variable</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <a href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
