import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, ExternalLink, Bookmark } from 'lucide-react';

export default function CitationBadge({ sources, onPreviewDoc }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 border-t border-slate-800/80 pt-2.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-950/40 border border-cyan-800/40 px-3 py-1.5 rounded-lg w-full justify-between"
      >
        <span className="flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
          Retrieved Citations ({sources.length} sources used)
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2 text-xs">
          {sources.map((src, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-slate-300 hover:border-cyan-500/40 transition-all"
            >
              <div className="flex items-center justify-between font-mono text-[11px] text-cyan-300 mb-1">
                <span className="flex items-center gap-1 font-semibold truncate max-w-[280px]">
                  <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {src.document_name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
                    Page {src.page || 1}
                  </span>
                  {src.score > 0 && (
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-1.5 py-0.5 rounded text-[10px]">
                      Match: {Math.round(src.score * 100)}%
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed line-clamp-3 bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                "{src.content_snippet}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
