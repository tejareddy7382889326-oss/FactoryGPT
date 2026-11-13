import React from 'react';
import { Database, ShieldCheck, Zap } from 'lucide-react';
import ModelSelector from './ModelSelector';

export default function Navbar({ selectedModel, setSelectedModel, stats }) {
  return (
    <header className="h-16 bg-slate-900/60 border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-200 tracking-wide">
          Industrial Assistant Workspace
        </h2>
        <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
          <Zap className="w-3 h-3 text-cyan-400" />
          RAG Active
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Vector DB status indicator */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/60">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Vector Chunks:</span>
          <span className="text-emerald-400 font-bold">{stats?.total_chunks || 0}</span>
        </div>

        {/* Model Selector */}
        {selectedModel && setSelectedModel && (
          <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />
        )}
      </div>
    </header>
  );
}
