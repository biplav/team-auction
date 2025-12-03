'use client';

import { useEffect, useState } from 'react';

export default function TestGAPage() {
  const [gaStatus, setGaStatus] = useState<string>('Checking...');
  const [measurementId, setMeasurementId] = useState<string>('');

  useEffect(() => {
    // Check if gtag is loaded
    const checkGA = () => {
      if (typeof window !== 'undefined') {
        const hasGtag = typeof (window as any).gtag !== 'undefined';
        const envId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

        setGaStatus(hasGtag ? '✅ Google Analytics is LOADED' : '❌ Google Analytics is NOT loaded');
        setMeasurementId(envId || '❌ Not configured in environment');
      }
    };

    // Wait for scripts to load
    setTimeout(checkGA, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Google Analytics Test Page</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">GA Status:</h2>
            <p className="text-lg">{gaStatus}</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Measurement ID:</h2>
            <p className="text-lg font-mono bg-gray-100 p-2 rounded">
              {measurementId}
            </p>
          </div>

          <div className="border-t pt-4 mt-4">
            <h2 className="text-xl font-semibold mb-2">How to Fix:</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to Railway Dashboard</li>
              <li>Click Variables tab</li>
              <li>Add: <code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_GA_MEASUREMENT_ID</code></li>
              <li>Value: Your G-XXXXXXXXXX ID</li>
              <li>Redeploy the service</li>
            </ol>
          </div>

          <div className="border-t pt-4 mt-4">
            <h2 className="text-xl font-semibold mb-2">Check Browser Console:</h2>
            <p className="text-sm text-gray-600 mb-2">
              Press F12, go to Console tab, and type:
            </p>
            <code className="block bg-gray-900 text-green-400 p-3 rounded">
              window.gtag
            </code>
            <p className="text-sm text-gray-600 mt-2">
              Should show: <code className="bg-gray-100 px-2 py-1 rounded">ƒ gtag()&#123;[native code]&#125;</code>
            </p>
          </div>
        </div>

        <div className="mt-6">
          <a
            href="/"
            className="text-blue-600 hover:underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
