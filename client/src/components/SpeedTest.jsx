import React, { useState } from "react";
import axios from "axios";
import { Zap, Database, Trash2, Activity } from "lucide-react";

const SpeedTest = () => {
  const [directResult, setDirectResult] = useState(null);
  const [redisResult, setRedisResult] = useState(null);

  // Independent loading states
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [loadingRedis, setLoadingRedis] = useState(false);
  const [error, setError] = useState("");

  // API base is read from Vite env var in production. Fallback to a relative `/api` for safety.
  // VITE_API_BASE should be the full API base (including /api), e.g. https://api.example.com/api
  const API_BASE = (import.meta.env.VITE_API_BASE || "/api") + "/speed";

  const fetchDirect = async () => {
    setLoadingDirect(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_BASE}/fetch-direct`);
      setDirectResult(data);
    } catch (err) {
      setError("Failed to fetch from DB endpoint. Is backend running?");
    } finally {
      setLoadingDirect(false);
    }
  };

  const fetchRedis = async () => {
    setLoadingRedis(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_BASE}/fetch-redis`);
      setRedisResult(data);
    } catch (err) {
      setError("Failed to fetch from Redis endpoint");
    } finally {
      setLoadingRedis(false);
    }
  };

  const clearCache = async () => {
    try {
      await axios.post(`${API_BASE}/clear-cache`);
      setRedisResult(null);
      alert("Cache Cleared! Next Redis fetch will be a MISS.");
    } catch (err) {
      alert("Failed to clear cache");
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-8 shadow-xl">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
        <Activity className="w-5 h-5 text-purple-400" />
        Performance Benchmark
      </h2>

      {error && (
        <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-sm border border-red-500/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Standard DB Card */}
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" /> Standard Database
            </h3>
            {directResult && (
              <span className="text-red-400 font-bold text-lg animate-in fade-in">
                {directResult.timeTaken}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mb-4">
            Fetching directly an API.
          </p>
          <button
            onClick={fetchDirect}
            disabled={loadingDirect}
            className={`w-full py-2.5 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2
              ${
                loadingDirect
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-slate-700 hover:bg-slate-600 text-white"
              }
            `}
          >
            {loadingDirect ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                Testing...
              </>
            ) : (
              "Test DB Speed"
            )}
          </button>
        </div>

        {/* Redis Card */}
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 hover:border-green-500/30 transition relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-400" /> Redis Cache
            </h3>
            {redisResult && (
              <span className="text-green-400 font-bold text-lg animate-in fade-in">
                {redisResult.timeTaken}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mb-4">
            Fetches from high-speed memory cache.
          </p>
          <div className="flex gap-2">
            <button
              onClick={fetchRedis}
              disabled={loadingRedis}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2
                ${
                  loadingRedis
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20"
                }
              `}
            >
              {loadingRedis ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Testing...
                </>
              ) : (
                "Test Cache Speed"
              )}
            </button>
            <button
              onClick={clearCache}
              disabled={loadingRedis}
              className="px-3 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg transition"
              title="Clear Cache"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeedTest;
