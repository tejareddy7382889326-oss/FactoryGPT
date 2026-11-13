import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FileSpreadsheet, Download, Loader2, CheckCircle2, Wrench, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';

export default function ReportsScreen() {
  const [title, setTitle] = useState('Routine Equipment Diagnostic & Maintenance Report');
  const [equipmentName, setEquipmentName] = useState('CNC Milling Machine (Spindle-Pro 5000)');
  const [reportType, setReportType] = useState('maintenance');
  const [notes, setNotes] = useState('Spindle bearing inspection completed. Coolant level topped up. No abnormal vibration detected during post-service 15-minute test run.');
  const [generating, setGenerating] = useState(false);
  const [lastReport, setLastReport] = useState(null);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!title || !equipmentName) {
      toast.error('Please provide report title and equipment name');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post('/reports/generate', {
        title,
        equipment_name: equipmentName,
        report_type: reportType,
        notes
      });

      setLastReport(res.data);
      toast.success('PDF Maintenance Report generated successfully!');
    } catch (err) {
      toast.error('Failed to generate PDF report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950">
      <Navbar />

      <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
            Maintenance & Troubleshooting PDF Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate formal industrial compliance PDF reports combining technician field notes, equipment metadata, and AI troubleshooting transcripts.
          </p>
        </div>

        {/* Report Generator Form */}
        <form onSubmit={handleGenerateReport} className="bg-slate-900/80 rounded-2xl border border-slate-800/80 p-6 space-y-5 shadow-xl">
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300">Report Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CNC Spindle Maintenance & Calibration"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Equipment / Machine Name</label>
              <input
                type="text"
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                placeholder="e.g. Conveyor Drive Assembly #4"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Report Category</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-cyan-300 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="maintenance">Preventative Maintenance</option>
                <option value="troubleshooting">Emergency Troubleshooting</option>
                <option value="safety">Safety Audit & Compliance</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300">Technician Field Notes & Actions Taken</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe work performed, parts replaced, torque specs, or post-service test results..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 text-sm transition-all"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compiling PDF Report...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                <span>Generate PDF Report</span>
              </>
            )}
          </button>
        </form>

        {/* Download Result Banner */}
        {lastReport && (
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-5 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/50 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-emerald-300">Report Ready for Download</h3>
                <p className="text-xs text-slate-400 font-mono">Report ID: {lastReport.report_id}</p>
              </div>
            </div>

            <a
              href={lastReport.download_url}
              download
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-md shadow-emerald-950"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
