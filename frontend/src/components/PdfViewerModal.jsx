import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function PdfViewerModal({ docId, filename, onClose }) {
  const [fileUrl, setFileUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docId) return;

    const fetchFile = async () => {
      try {
        const response = await api.get(`/documents/${docId}/file`, {
          responseType: 'blob'
        });
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = URL.createObjectURL(blob);
        setFileUrl(url);

        if (filename.endsWith('.txt') || filename.endsWith('.log') || filename.endsWith('.md')) {
          const text = await response.data.text();
          setTextContent(text);
        }
      } catch (err) {
        console.error('Failed to load document file:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFile();

    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [docId, filename]);

  if (!docId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/50 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">{filename}</h3>
              <p className="text-[10px] text-slate-400 font-mono">Document Preview</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {fileUrl && (
              <a
                href={fileUrl}
                download={filename}
                className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-mono"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 bg-slate-950 p-4 overflow-auto flex items-center justify-center">
          {loading ? (
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading Document Content...</span>
            </div>
          ) : textContent ? (
            <pre className="w-full h-full p-4 bg-slate-900 text-slate-300 font-mono text-xs overflow-auto rounded-xl border border-slate-800 whitespace-pre-wrap">
              {textContent}
            </pre>
          ) : fileUrl ? (
            <iframe
              src={fileUrl}
              className="w-full h-full rounded-xl border border-slate-800 bg-white"
              title="PDF Preview"
            />
          ) : (
            <div className="text-slate-400 text-sm font-mono">Unable to preview document format.</div>
          )}
        </div>
      </div>
    </div>
  );
}
