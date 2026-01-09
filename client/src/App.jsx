import React, { useState } from 'react';

const App = () => {
  const [directResult, setDirectResult] = useState(null);
  const [redisResult, setRedisResult] = useState(null);
  
  // SEPARATE LOADING STATES (Crucial so one button doesn't freeze the other)
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [loadingRedis, setLoadingRedis] = useState(false);
  
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:5001/api';

  const fetchDirect = async () => {
    setLoadingDirect(true);
    setError('');
    // We do NOT setDirectResult(null) here to avoid the UI "blinking" empty
    
    try {
      const res = await fetch(`${API_BASE}/fetch-direct`);
      if (!res.ok) throw new Error('Failed to fetch from backend');
      
      const data = await res.json();
      setDirectResult(data);
    } catch (err) {
      console.error(err);
      setError('Error: Could not connect to backend. Is it running on port 5001?');
    } finally {
      setLoadingDirect(false);
    }
  };

  const fetchRedis = async () => {
    setLoadingRedis(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/fetch-redis`);
      if (!res.ok) throw new Error('Failed to fetch from backend');

      const data = await res.json();
      setRedisResult(data);
    } catch (err) {
      console.error(err);
      setError('Error: Could not connect to backend. Is Redis connected?');
    } finally {
      setLoadingRedis(false);
    }
  };

  const clearCache = async () => {
    try {
        await fetch(`${API_BASE}/clear-cache`, { method: 'POST' });
        setRedisResult(null);
        alert('Cache Cleared!');
    } catch(err) {
        alert("Failed to clear cache. Backend might be down.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-900 text-white font-sans">
      <h1 className="text-4xl font-bold mb-8 text-blue-400">Redis Performance Demo 🚀</h1>

      {error && (
        <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-6 border border-red-500/50">
            {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
        
        {/* Left Box: Database Simulator */}
        <div className="flex-1 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl hover:border-gray-600 transition">
          <h2 className="text-2xl font-bold text-red-400 mb-4">🐢 Standard Database</h2>
          
          {/* THE TEXT YOU WANTED BACK */}
          <p className="text-gray-400 mb-6 text-sm">
            Fetching directly an API.
          </p>
          
          <button 
            onClick={fetchDirect} 
            disabled={loadingDirect}
            className={`w-full py-3 rounded-lg font-bold mb-6 transition flex items-center justify-center gap-2
              ${loadingDirect ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}
            `}
          >
            {loadingDirect ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Fetching...
              </>
            ) : (
              'Fetch from DB'
            )}
          </button>
          
          {directResult && (
            <div className="bg-gray-900 p-4 rounded-lg border border-red-500/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Latency:</span>
                <span className="text-3xl font-bold text-red-500">{directResult.timeTaken}</span>
              </div>
              <div className="text-xs text-gray-500">Source: {directResult.source}</div>
            </div>
          )}
        </div>

        {/* Right Box: Redis Cache */}
        <div className="flex-1 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl hover:border-gray-600 transition">
          <h2 className="text-2xl font-bold text-green-400 mb-4">⚡ Redis Cache</h2>
          <p className="text-gray-400 mb-6 text-sm">
            First fetch is slow (Cache Miss), subsequent fetches are instant (Cache Hit).
          </p>
          <div className="flex gap-2 mb-6">
            <button 
                onClick={fetchRedis} 
                disabled={loadingRedis}
                className={`flex-1 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2
                  ${loadingRedis ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}
                `}
            >
                {loadingRedis ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Fetching...
                  </>
                ) : (
                  'Fetch from Redis'
                )}
            </button>
            <button 
                onClick={clearCache}
                disabled={loadingRedis}
                className="px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-2xl transition disabled:opacity-50"
                title="Clear Cache"
            >
                🗑️
            </button>
          </div>

          {redisResult && (
            <div className={`bg-gray-900 p-4 rounded-lg border ${redisResult.source.includes('Cache') ? 'border-green-500/50' : 'border-yellow-500/50'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Latency:</span>
                <span className={`text-3xl font-bold ${redisResult.source.includes('Cache') ? 'text-green-400' : 'text-yellow-400'}`}>
                    {redisResult.timeTaken}
                </span>
              </div>
              <div className="text-xs text-gray-500 flex justify-between">
                  <span>Source: {redisResult.source}</span>
                  {redisResult.source.includes('Cache') && <span className="text-green-400 font-bold">HIT 🔥</span>}
              </div>
            </div>
          )}
        </div>

      </div>
      
      <p className="mt-8 text-gray-500 text-sm">
        Tip: Click "Fetch from Redis" twice. First time is a miss (slow), second time is a hit (instant).
      </p>
    </div>
  );
};

export default App;