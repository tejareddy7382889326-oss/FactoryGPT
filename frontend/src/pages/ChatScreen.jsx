import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { 
  Send, 
  Square, 
  Copy, 
  Check, 
  Search, 
  Plus, 
  Trash2, 
  Cpu, 
  Bot, 
  User, 
  FileSpreadsheet, 
  AlertTriangle, 
  Wrench, 
  RefreshCw, 
  ShieldCheck, 
  Loader2,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import CitationBadge from '../components/CitationBadge';
import PdfViewerModal from '../components/PdfViewerModal';

export default function ChatScreen() {
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('deepseek/deepseek-chat-v3');
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  // PDF Preview State
  const [previewDoc, setPreviewDoc] = useState(null);

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Fetch Conversation History List
  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations', {
        params: searchHistory ? { search: searchHistory } : {}
      });
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [searchHistory]);

  // Handle Initial State from Dashboard navigation or location
  useEffect(() => {
    if (location.state?.conversationId) {
      loadConversation(location.state.conversationId);
    } else if (location.state?.initialQuery) {
      handleSendQuery(location.state.initialQuery);
    }
  }, [location.state]);

  const loadConversation = async (convId) => {
    try {
      const res = await api.get(`/chat/conversations/${convId}`);
      setCurrentConvId(res.data.id);
      setSelectedModel(res.data.model_used);
      setMessages(res.data.messages);
    } catch (err) {
      toast.error('Failed to load conversation history');
    }
  };

  const handleStartNewChat = () => {
    setCurrentConvId(null);
    setMessages([]);
    setInputQuery('');
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/conversations/${convId}`);
      toast.success('Conversation deleted');
      if (currentConvId === convId) {
        handleStartNewChat();
      }
      fetchConversations();
    } catch (err) {
      toast.error('Failed to delete conversation');
    }
  };

  const handleSendQuery = async (queryToSend) => {
    const query = queryToSend || inputQuery;
    if (!query.trim() || loading) return;

    setInputQuery('');
    setLoading(true);

    // Optimistic User Message UI
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      content: query,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    abortControllerRef.current = new AbortController();

    try {
      const res = await api.post('/chat/query', {
        message: query,
        conversation_id: currentConvId,
        model: selectedModel,
        top_k: 5
      }, {
        signal: abortControllerRef.current.signal
      });

      setCurrentConvId(res.data.conversation_id);
      
      // Update with confirmed messages from backend
      setMessages((prev) => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        res.data.user_message,
        res.data.assistant_message
      ]);

      fetchConversations();
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        toast.error('AI Generation stopped by user.');
      } else {
        toast.error('Failed to get answer from AI pipeline');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleCopyCode = (text, msgId) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    toast.success('Answer copied to clipboard!');
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleGenerateReportFromChat = async () => {
    if (!currentConvId || messages.length === 0) {
      toast.error('No active conversation to export as report.');
      return;
    }
    try {
      const firstUserMsg = messages.find(m => m.role === 'user')?.content || 'Maintenance Issue';
      const res = await api.post('/reports/generate', {
        title: `AI Troubleshooting Log - ${firstUserMsg.slice(0, 30)}`,
        equipment_name: "Factory Equipment / Machine A",
        report_type: "troubleshooting",
        conversation_id: currentConvId,
        notes: "Exported directly from AI Maintenance Assistant chat session."
      });

      toast.success('Maintenance report generated!');
      window.open(res.data.download_url, '_blank');
    } catch (err) {
      toast.error('Failed to generate PDF report');
    }
  };

  const quickPresets = [
    { label: "Why is Machine A overheating?", icon: AlertTriangle },
    { label: "What does Error E102 mean?", icon: Wrench },
    { label: "How do I replace conveyor belt?", icon: RefreshCw },
    { label: "Show safety precautions", icon: ShieldCheck },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      <Navbar selectedModel={selectedModel} setSelectedModel={setSelectedModel} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Conversation History Sidebar */}
        <div className="w-72 bg-slate-900/90 border-r border-slate-800/80 flex flex-col h-full">
          <div className="p-3 space-y-2 border-b border-slate-800/80">
            <button
              onClick={handleStartNewChat}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-md shadow-cyan-950"
            >
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </button>

            {/* History Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-[11px] text-slate-500 font-mono text-center py-6">
                No past conversations
              </p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between group transition-all ${
                    currentConvId === conv.id
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 font-medium'
                      : 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate pr-2">{conv.title}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
          {/* Top Chat Action Bar */}
          {currentConvId && (
            <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Active Session: <span className="text-slate-200 font-semibold">{currentConvId.slice(0, 8)}...</span>
              </span>

              <button
                onClick={handleGenerateReportFromChat}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export PDF Report</span>
              </button>
            </div>
          )}

          {/* Messages Stream Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center shadow-xl shadow-cyan-500/20 text-slate-950 mb-4 animate-glow">
                  <Bot className="w-8 h-8 text-slate-950" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Industrial AI Maintenance Assistant
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Ask questions about equipment diagnostics, error codes, safety precautions, or component replacement. Responses are generated strictly from indexed factory documentation.
                </p>

                {/* Quick Preset Prompts */}
                <div className="grid grid-cols-2 gap-2.5 mt-6 w-full">
                  {quickPresets.map((preset, idx) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendQuery(preset.label)}
                        className="p-3 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left text-xs text-slate-300 flex items-center gap-2 transition-all hover:scale-[1.01]"
                      >
                        <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`flex gap-4 max-w-4xl mx-auto ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/50 text-cyan-400 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed max-w-[85%] relative group shadow-md ${
                      msg.role === 'user'
                        ? 'bg-cyan-600 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div>
                        <div className="prose prose-invert max-w-none text-slate-200 text-sm">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>

                        {/* Citations Expandable */}
                        <CitationBadge sources={msg.sources} />

                        {/* Copy Answer Action */}
                        <div className="mt-3 pt-2 border-t border-slate-800/40 flex items-center justify-end">
                          <button
                            onClick={() => handleCopyCode(msg.content, msg.id || idx)}
                            className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 font-mono transition-colors"
                          >
                            {copiedMsgId === (msg.id || idx) ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                      U
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-4 max-w-4xl mx-auto justify-start">
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/50 text-cyan-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs font-mono text-cyan-400 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Searching ChromaDB vector store & querying OpenRouter ({selectedModel.split('/')[1] || selectedModel})...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <div className="p-4 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-md">
            <div className="max-w-4xl mx-auto relative">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery();
                }}
                className="flex items-center gap-2 bg-slate-950 border border-slate-800 focus-within:border-cyan-500/50 rounded-2xl p-2 shadow-xl"
              >
                <input
                  type="text"
                  placeholder="Ask a technical question about factory manuals, error codes, SOPs..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-transparent px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />

                {loading ? (
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputQuery.trim()}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-slate-950 font-bold p-2.5 rounded-xl transition-all shadow-md shadow-cyan-950"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer Drawer Modal */}
      {previewDoc && (
        <PdfViewerModal
          docId={previewDoc.id}
          filename={previewDoc.filename}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
