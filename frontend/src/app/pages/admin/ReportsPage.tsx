import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Filter, Search, Loader2,
  Calendar, PhoneIncoming, Users, BarChart3, ShieldCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [calls, setCalls] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getCallsLog(500);
      setCalls(data);
    } catch (e) {
      console.error('Error loading calls log:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCalls = calls.filter((c: any) =>
    c.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.performance && c.performance.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addPdfHeader = (doc: jsPDF, title: string) => {
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(124, 58, 237);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('AI CRM PRO', 14, 15);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(title, 14, 25);
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 200);
    doc.text(`Export du ${new Date().toLocaleDateString('fr-FR')} - ${new Date().toLocaleTimeString('fr-FR')}`, 14, 31);
  };

  const exportCallsPdf = async () => {
    setExporting('calls');
    try {
      const doc = new jsPDF();
      addPdfHeader(doc, 'Journal des Appels');
      autoTable(doc, {
        startY: 40,
        head: [['ID', 'Agent', 'Date', 'Sentiment', 'Score %', 'Performance', 'Motif Refus']],
        body: filteredCalls.map(c => [
          c.call_id,
          c.agent_name,
          new Date(c.call_date).toLocaleString('fr-FR'),
          c.sentiment,
          c.score_percentage,
          c.performance || '-',
          c.refusal_reason || '-'
        ]),
        headStyles: { fillColor: [124, 58, 237], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 255] },
        styles: { fontSize: 7, cellPadding: 3 },
      });
      doc.save(`rapport_appels_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF Appels exporté');
    } catch { toast.error('Erreur export PDF'); }
    finally { setExporting(null); }
  };

  const exportAgentsPdf = async () => {
    setExporting('agents');
    try {
      const agents = await api.getAgentsPerformance();
      const doc = new jsPDF();
      addPdfHeader(doc, 'Performance Agents');
      autoTable(doc, {
        startY: 40,
        head: [['Agent', 'Score Qualité', 'Taux Conversion', 'Total Appels']],
        body: (agents || []).map((a: any) => [
          a.agent_name || a.name || '-',
          `${Math.round(a.score_percentage || 0)}%`,
          `${a.conversion_rate || 0}%`,
          a.total_calls || 0
        ]),
        headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 255, 248] },
        styles: { fontSize: 8, cellPadding: 3 },
      });
      doc.save(`rapport_agents_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF Agents exporté');
    } catch { toast.error('Erreur export PDF'); }
    finally { setExporting(null); }
  };

  const exportQualityPdf = async () => {
    setExporting('quality');
    try {
      const evals = await api.getAllEvaluations();
      const doc = new jsPDF();
      addPdfHeader(doc, 'Rapport Qualité');
      autoTable(doc, {
        startY: 40,
        head: [['ID', 'Agent', 'Date', 'Score', 'Décision', 'Évaluateur']],
        body: (evals || []).map((e: any) => [
          e.id,
          e.agent_id || '-',
          e.eval_date ? new Date(e.eval_date).toLocaleDateString('fr-FR') : '-',
          e.overall_score || '-',
          e.decision || '-',
          e.evaluator_name || '-'
        ]),
        headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 245, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
      });
      doc.save(`rapport_qualite_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF Qualité exporté');
    } catch { toast.error('Erreur export PDF'); }
    finally { setExporting(null); }
  };

  const exportAttendancePdf = async () => {
    setExporting('attendance');
    try {
      const report = await api.getAttendanceReport();
      const data = Array.isArray(report) ? report : (report as any)?.records || [];
      const doc = new jsPDF();
      addPdfHeader(doc, 'Rapport Pointage & Présences');
      autoTable(doc, {
        startY: 40,
        head: [['Agent', 'Statut', 'Temps Travail', 'Temps Pause', 'Type Pause']],
        body: data.map((a: any) => [
          a.name || a.username || '-',
          a.status === 'clocked_in' ? 'En poste' : a.status === 'on_break' ? 'En pause' : 'Hors ligne',
          a.total_work_time || '00:00',
          a.total_break_time || '00:00',
          a.break_type || '-'
        ]),
        headStyles: { fillColor: [245, 158, 11], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 251, 235] },
        styles: { fontSize: 8, cellPadding: 3 },
      });
      doc.save(`rapport_pointage_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF Pointage exporté');
    } catch { toast.error('Erreur export PDF'); }
    finally { setExporting(null); }
  };

  const exportOverviewPdf = async () => {
    setExporting('overview');
    try {
      const overview = await api.getAnalyticsOverview();
      const doc = new jsPDF();
      addPdfHeader(doc, 'Rapport Vue d\'Ensemble');

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('KPIs Globaux', 14, 45);

      const kpis = [
        ['Score Qualité Moyen', `${Math.round(overview.global_score || 0)}%`],
        ['Taux de Conformité', `${Math.round(overview.compliance_rate || 0)}%`],
        ['Alertes Critiques', `${overview.critical_alerts || 0}`],
        ['Total Appels', `${overview.total_calls || 0}`],
      ];

      autoTable(doc, {
        startY: 50,
        head: [['Indicateur', 'Valeur']],
        body: kpis,
        headStyles: { fillColor: [124, 58, 237], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
      });

      doc.save(`rapport_overview_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF Overview exporté');
    } catch { toast.error('Erreur export PDF'); }
    finally { setExporting(null); }
  };

  const exportCSV = () => {
    const headers = ["ID", "Agent", "Date", "Sentiment", "Score %", "Performance", "Motif Refus"];
    const rows = filteredCalls.map(c => [
      c.call_id, c.agent_name, c.call_date, c.sentiment,
      c.score_percentage, c.performance || "-", c.refusal_reason || "-"
    ]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_crm_ai_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-muted-foreground">Extraction des logs MySQL...</span>
      </div>
    );
  }

  const EXPORT_BUTTONS = [
    { key: 'calls', label: 'Appels PDF', icon: PhoneIncoming, action: exportCallsPdf, color: 'from-emerald-500 to-teal-600' },
    { key: 'agents', label: 'Agents PDF', icon: Users, action: exportAgentsPdf, color: 'from-emerald-500 to-teal-600' },
    { key: 'quality', label: 'Qualité PDF', icon: ShieldCheck, action: exportQualityPdf, color: 'from-blue-500 to-cyan-600' },
    { key: 'attendance', label: 'Pointage PDF', icon: Calendar, action: exportAttendancePdf, color: 'from-amber-500 to-orange-600' },
    { key: 'overview', label: 'Overview PDF', icon: BarChart3, action: exportOverviewPdf, color: 'from-rose-500 to-pink-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
            Rapports & <span className="text-primary">Exports</span>
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Exportez et analysez l'historique complet des interactions
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl hover:bg-muted transition-all text-xs font-bold uppercase tracking-widest"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* PDF Export Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {EXPORT_BUTTONS.map(btn => (
          <button
            key={btn.key}
            onClick={btn.action}
            disabled={exporting !== null}
            className={`relative flex flex-col items-center gap-2 p-4 bg-gradient-to-br ${btn.color} rounded-2xl text-white shadow-lg hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {exporting === btn.key ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <btn.icon className="w-5 h-5" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {exporting === btn.key ? 'Export...' : btn.label}
            </span>
          </button>
        ))}
      </div>

      {/* Calls Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <PhoneIncoming className="w-4 h-4" />
            {filteredCalls.length} Appels trouvés
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un agent ou performance..."
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-4 font-medium">ID</th>
                <th className="text-left p-4 font-medium">Agent</th>
                <th className="text-left p-4 font-medium">Date & Heure</th>
                <th className="text-left p-4 font-medium">Sentiment</th>
                <th className="text-left p-4 font-medium">Score Qualité</th>
                <th className="text-left p-4 font-medium">Performance</th>
                <th className="text-left p-4 font-medium">Qualification</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalls.map((c, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-xs text-muted-foreground">#{c.call_id}</td>
                  <td className="p-4 font-semibold text-foreground">{c.agent_name}</td>
                  <td className="p-4 text-muted-foreground whitespace-nowrap">
                    {new Date(c.call_date).toLocaleString('fr-FR')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.sentiment === 'POSITIVE' ? 'bg-emerald-500/10 text-emerald-500' :
                      c.sentiment === 'NEGATIVE' ? 'bg-red-500/10 text-red-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {c.sentiment}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-muted rounded-full">
                        <div className={`h-full rounded-full ${
                          c.score_percentage >= 80 ? 'bg-emerald-500' :
                          c.score_percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`} style={{ width: `${c.score_percentage}%` }} />
                      </div>
                      <span className="font-bold">{c.score_percentage}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-foreground">{c.performance || "-"}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-bold ${
                      c.qualification_match ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {c.qualification_match ? "Conforme" : "Incohérent"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
