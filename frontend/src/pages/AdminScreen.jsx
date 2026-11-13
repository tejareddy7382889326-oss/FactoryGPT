import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, Database, RefreshCw, Trash2, Cpu, CheckCircle, Server, Activity } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';

export default function AdminScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load system diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleClearVectorDb = async () => {
    if (!window.confirm("WARNING: Are you sure you want to clear the vector database? All indexed vector embeddings will be wiped!")) return;

    setActionLoading(true);
    try {
      await api.delete('/admin/clear-vector-db');
      toast.success('Vector database cleared successfully!');
      fetchStats();
    } catch (err) {
      toast.error('Failed to clear vector database');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRebuildIndex = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/admin/rebuild-index');
      toast.success(res.data.message);
      fetchStats();
    } catch (err) {
      toast.error('Failed to rebuild vector index');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Navbar stats={stats} />

      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            System Administration & Vector DB Diagnostics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage vector storage, rebuild document indexes, check OpenRouter API status, and perform system maintenance.
          </p>
        </div>

        {/* System Health Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800/50 text-emerald-400 flex items-center justify-center shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-mono text-slate-400">VECTOR DB ENGINE</p>
              <p className="text-lg font-bold text-white mt-0.5">ChromaDB Persistent</p>
              <p className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {stats?.total_chunks || 0} Total Embeddings
              </p>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800/50 text-cyan-400 flex items-center justify-center shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-mono text-slate-400">LLM PROVIDER</p>
              <p className="text-lg font-bold text-white mt-0.5">OpenRouter API</p>
              <p className="text-[11px] text-cyan-300 font-mono mt-1 truncate max-w-[180px]">
                {stats?.active_model || 'deepseek/deepseek-chat-v3'}
              </p>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-800/50 text-purple-400 flex items-center justify-center shrink-0">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-mono text-slate-400">METRICS & LOGS</p>
              <p className="text-lg font-bold text-white mt-0.5">{stats?.total_conversations || 0} Sessions</p>
              <p className="text-[11px] text-purple-300 font-mono mt-1">
                {stats?.total_messages || 0} RAG Messages Served
              </p>
            </div>
          </div>
        </div>

        {/* Administration Actions */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 p-6 space-y-6 shadow-xl">
          <h2 className="text-sm font-semibold text-slate-200 font-mono tracking-wide uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Knowledge Base Maintenance Tasks
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rebuild Vector Index */}
            <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  Rebuild Vector Index
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Re-parses all uploaded PDF, DOCX, and TXT files, regenerates dense embeddings using sentence-transformers, and updates ChromaDB.
                </p>
              </div>

              <button
                onClick={handleRebuildIndex}
                disabled={actionLoading}
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
                <span>Rebuild All Embeddings</span>
              </button>
            </div>

            {/* Clear Vector DB */}
            <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Wipe Vector Store
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Permanently purges all vector chunks from ChromaDB. Uploaded raw document files will remain stored in the repository.
                </p>
              </div>

              <button
                onClick={handleClearVectorDb}
                disabled={actionLoading}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear ChromaDB Vector Collection</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
