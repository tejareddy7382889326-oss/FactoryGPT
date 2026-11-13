import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Database, 
  Loader2,
  HardDrive
} from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import PdfViewerModal from '../components/PdfViewerModal';

export default function UploadScreen() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      toast.error('Failed to load document list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    setUploading(true);
    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Successfully uploaded and indexed ${res.data.length} document(s)!`);
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId, filename) => {
    if (!window.confirm(`Are you sure you want to delete '${filename}'?`)) return;

    try {
      await api.delete(`/documents/${docId}`);
      toast.success(`Deleted '${filename}' from vector database`);
      fetchDocuments();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const handleReindexAll = async () => {
    setReindexing(true);
    try {
      const res = await api.post('/documents/reindex');
      toast.success(res.data.message);
      fetchDocuments();
    } catch (err) {
      toast.error('Failed to re-index documents');
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-cyan-400" />
              Document Upload & Vector Knowledge Base
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload equipment manuals, maintenance logs, and SOPs (PDF, DOCX, TXT). Files are chunked and embedded into ChromaDB.
            </p>
          </div>

          <button
            onClick={handleReindexAll}
            disabled={reindexing}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
            <span>{reindexing ? 'Re-indexing...' : 'Re-index Vector KB'}</span>
          </button>
        </div>

        {/* Drag & Drop Upload Dropzone */}
        <div className="glass-panel p-8 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 transition-colors text-center relative overflow-hidden group">
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.log,.csv,.md"
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={uploading}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-800/50 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              {uploading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-200">
                {uploading ? 'Parsing & Indexing Files into ChromaDB...' : 'Drag & drop machine manuals or click to browse'}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Supported: PDF, DOCX, TXT (Max size: 50MB per file)
              </p>
            </div>
          </div>
        </div>

        {/* Uploaded Documents List */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 p-5">
          <h2 className="text-sm font-semibold text-slate-200 font-mono mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            Indexed Knowledge Base Documents ({documents.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-cyan-400 font-mono text-sm gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading document repository...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-mono">
              No documents uploaded yet. Drag and drop files above to populate the knowledge base.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Document Name</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">File Size</th>
                    <th className="py-3 px-4">Vector Chunks</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-950/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-xs">{doc.filename}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        <span className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                          {doc.file_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {(doc.file_size / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                        {doc.chunk_count} chunks
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          Indexed
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Preview File"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* PDF / File Viewer Modal */}
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
