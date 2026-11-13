import React from 'react';
import { Cpu, ChevronDown } from 'lucide-react';

export const SUPPORTED_MODELS = [
  { id: "deepseek/deepseek-chat-v3", name: "DeepSeek V3 (Industrial Default)" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B" },
];

export default function ModelSelector({ selectedModel, onSelectModel }) {
  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-mono text-[11px] text-slate-400">LLM Provider:</span>
        <select
          value={selectedModel || "deepseek/deepseek-chat-v3"}
          onChange={(e) => onSelectModel(e.target.value)}
          className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer text-xs"
        >
          {SUPPORTED_MODELS.map((model) => (
            <option key={model.id} value={model.id} className="bg-slate-900 text-slate-200">
              {model.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
