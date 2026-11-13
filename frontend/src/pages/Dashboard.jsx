import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  Database, 
  Cpu, 
  ArrowRight, 
  Wrench, 
  AlertTriangle, 
  ShieldCheck, 
  Plus,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [recentConvs, setRecentConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, docsRes, convsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/documents'),
        api.get('/chat/conversations')
      ]);
      setStats(statsRes.data);
      setRecentDocs(docsRes.data.slice(0, 5));
      setRecentConvs(convsRes.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const quickPrompts = [
    { title: "Machine Overheating", query: "Why is Machine A overheating?", icon: AlertTriangle, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
    { title: "Error Code E102", query: "What does Error E102 mean and how do I fix it?", icon: Wrench, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
    { title: "Conveyor Belt Replacement", query: "How do I replace the conveyor belt? Show steps.", icon: RefreshCw, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
    { title: "Safety Precautions", query: "Show maintenance safety precautions for equipment.", icon: ShieldCheck, color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  ];

  const handleLaunchPrompt = (query) => {
    navigate('/chat', { state: { initialQuery: query } });
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Navbar stats={stats} />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 rounded-2xl border border-slate-800 flex items-center justify-between shadow-xl">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Factory Industrial Maintenance Portal
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Ask natural language questions against indexed equipment manuals, SOPs, and error logs using zero-hallucination Retrieval-Augmented Generation.
            </p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all shrink-0 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat Query</span>
          </button>
        </div>

        {/* Knowledge Base Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
              <span>INDEXED DOCUMENTS</span>
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{stats?.total_documents || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Uploaded manuals & SOPs</p>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
              <span>VECTOR CHUNKS</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-400">{stats?.total_chunks || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">ChromaDB embeddings</p>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
              <span>AI CONVERSATIONS</span>
              <MessageSquare className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{stats?.total_conversations || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">{stats?.total_messages || 0} messages generated</p>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
              <span>DEFAULT MODEL</span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-sm font-bold text-cyan-300 font-mono truncate">DeepSeek V3</p>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              OpenRouter Active
            </p>
          </div>
        </div>

        {/* Quick Maintenance Presets */}
        <div>
          <h2 className="text-sm font-semibold text-slate-300 font-mono tracking-wide mb-3 uppercase flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            Quick Maintenance Presets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickPrompts.map((preset, idx) => {
              const Icon = preset.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleLaunchPrompt(preset.query)}
                  className="glass-card p-4 rounded-xl text-left flex flex-col justify-between h-32 hover:scale-[1.02] transition-transform group"
                >
                  <div className={`w-8 h-8 rounded-lg ${preset.color} flex items-center justify-center border`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                      {preset.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                      <span>Launch Diagnosis</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Split: Recent Documents & Recent Conversations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Indexed Documents Table Preview */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Indexed Knowledge Base Files
              </h2>
              <button
                onClick={() => navigate('/upload')}
                className="text-xs text-cyan-400 hover:underline font-mono"
              >
                View All ({recentDocs.length})
              </button>
            </div>

            {recentDocs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-mono">
                No documents uploaded yet. Go to Upload screen to add PDF/DOCX/TXT files.
              </div>
            ) : (
              <div className="space-y-2">
                {recentDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/50 flex items-center justify-center font-bold text-xs shrink-0">
                        {doc.file_type}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-slate-200 truncate">{doc.filename}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {(doc.file_size / 1024).toFixed(1)} KB • {doc.chunk_count} vector chunks
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 border border-emerald-800/50 px-2 py-0.5 rounded-full font-mono">
                      Indexed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Conversations */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                Recent Maintenance Chats
              </h2>
              <button
                onClick={() => navigate('/chat')}
                className="text-xs text-cyan-400 hover:underline font-mono"
              >
                Go to Chat
              </button>
            </div>

            {recentConvs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-mono">
                No recent chat sessions. Start a new conversation!
              </div>
            ) : (
              <div className="space-y-2">
                {recentConvs.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => navigate('/chat', { state: { conversationId: conv.id } })}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex items-center justify-between hover:border-cyan-500/40 cursor-pointer transition-colors"
                  >
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-slate-200 truncate">{conv.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Model: {conv.model_used.split('/')[1] || conv.model_used}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
