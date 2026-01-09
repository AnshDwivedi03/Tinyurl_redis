import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link2, BarChart2, Trash2, LogOut, ExternalLink, Activity, Zap, TrendingUp, Copy } from 'lucide-react';
import SpeedTest from './components/SpeedTest';

axios.defaults.withCredentials = true;
// Ensure these match your backend port (usually 5000 for the URL shortener)
const API_BASE = 'http://localhost:5000/api';
const REDIRECT_BASE = 'http://localhost:5000';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState([]);
  const [trending, setTrending] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [lastLatency, setLastLatency] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch trending/urls only after we know we are authenticated
  useEffect(() => {
    if (user) {
      fetchUrls();
      fetchTrending();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/auth/me`);
      setUser(data);
    } catch (e) { 
      setUser(null); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchUrls = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/url/analytics`);
      setUrls(data);
    } catch (e) { console.error(e); }
  };

  const fetchTrending = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/url/trending`);
      setTrending(data);
    } catch (e) { console.error(e); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = authMode === 'signin' ? '/auth/signin' : '/auth/signup';
      const { data } = await axios.post(`${API_BASE}${endpoint}`, { email, password });
      setUser(data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    setLastLatency(null);
    try {
      const { data } = await axios.post(`${API_BASE}/url/shorten`, { originalUrl: newUrl });
      setNewUrl('');
      fetchUrls();
      if (data.processTime) setLastLatency(data.processTime);
    } catch (err) { alert('Failed to shorten URL'); }
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API_BASE}/url/${id}`);
    fetchUrls();
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;

  // --- LOGIN SCREEN (Centered) ---
  if (!user) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-blue-600 rounded-full shadow-lg shadow-blue-600/20">
              <Link2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center text-white mb-2">
            {authMode === 'signin' ? 'Welcome Back' : 'Join NanoLink'}
          </h2>
          <p className="text-slate-400 text-center mb-8">
            High-performance URL analytics platform
          </p>
          {error && <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-center border border-red-500/20">{error}</div>}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">Email</label>
              <input 
                type="email" 
                required 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">Password</label>
              <input 
                type="password" 
                required 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-blue-600/20">
              {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} className="text-slate-400 hover:text-white text-sm transition">
              {authMode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm sticky top-4 z-10">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">NanoLink<span className="text-blue-500">Pro</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:block">{user.email}</span>
            <button onClick={async () => { await axios.post(`${API_BASE}/auth/signout`); setUser(null); }} className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-700/50 px-3 py-2 rounded-lg transition">
              <LogOut size={18} /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* Shortener Card */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Activity className="text-blue-400 w-5 h-5"/> Create Short Link</h2>
              <form onSubmit={handleShorten} className="flex flex-col sm:flex-row gap-4">
                <input required type="url" placeholder="Paste your long URL here..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition shadow-lg shadow-blue-600/20 whitespace-nowrap">Shorten URL</button>
              </form>
              {lastLatency && (
                <div className="mt-4 inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-sm border border-green-500/20 animate-in fade-in slide-in-from-top-2">
                  <Zap size={14} className="fill-green-400" /> Processed in <strong>{lastLatency}ms</strong>
                </div>
              )}
            </div>

            {/* Speed Test Component */}
            <SpeedTest />

            {/* Links List */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
               <div className="p-4 border-b border-slate-700 font-semibold bg-slate-800/80 backdrop-blur-md">Your Active Links</div>
               {urls.length === 0 ? (
                 <div className="p-8 text-center text-slate-500">No links created yet.</div>
               ) : (
                 <div className="divide-y divide-slate-700">
                   {urls.map(url => (
                     <div key={url._id} className="p-4 hover:bg-slate-700/30 transition group flex items-center justify-between">
                       <div className="flex-1 min-w-0 pr-4">
                         <div className="flex items-center gap-2 mb-1">
                           <a href={`${REDIRECT_BASE}/${url.shortCode}`} target="_blank" rel="noreferrer" className="text-blue-400 font-bold text-lg tracking-tight hover:underline flex items-center gap-1">
                             {REDIRECT_BASE}/{url.shortCode} <ExternalLink size={12}/>
                           </a>
                           <button onClick={() => navigator.clipboard.writeText(`${REDIRECT_BASE}/${url.shortCode}`)} className="text-slate-500 hover:text-white p-1 rounded transition" title="Copy"><Copy size={12}/></button>
                         </div>
                         <div className="text-slate-500 text-xs truncate" title={url.originalUrl}>{url.originalUrl}</div>
                       </div>
                       <div className="flex items-center gap-4">
                         <div className="text-center px-3 py-1 bg-slate-900 rounded-lg border border-slate-700">
                           <div className="text-lg font-bold text-white">{url.clicks}</div>
                           <div className="text-[10px] text-slate-500 uppercase tracking-wider">Clicks</div>
                         </div>
                         <button onClick={() => handleDelete(url._id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition"><Trash2 size={18}/></button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="text-purple-400 w-5 h-5"/> Global Trending</h3>
              <div className="space-y-4">
                {trending.length === 0 ? <div className="text-slate-500 text-sm">No data yet.</div> : trending.map((t, i) => (
                  <div key={t._id} className="flex justify-between items-center text-sm group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-slate-600 font-mono text-xs">#{i+1}</span>
                      <a href={`${REDIRECT_BASE}/${t.shortCode}`} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-blue-400 transition truncate block">{REDIRECT_BASE}/{t.shortCode}</a>
                    </div>
                    <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-xs font-mono">{t.clicks}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;