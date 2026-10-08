import React, { useEffect, useMemo, useState } from 'react';
import { api, type Tender } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  BarChart4, Download, RefreshCw, ShieldAlert, CalendarClock,
  CircleCheck, Target, FileText, TriangleAlert,
} from 'lucide-react';

const verdictColors: Record<string, string> = {
  Go: '#059669',
  Cautious: '#D97706',
  'No-Go': '#DC2626',
  Unclassified: '#64748B',
};

const currency = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr`;
const percent = (value: number | undefined) => Number.isFinite(value) ? `${Math.round(value as number)}%` : '—';
const riskBand = (risk: number) => risk >= 60 ? 'High' : risk >= 30 ? 'Moderate' : 'Low';

function normalizeVerdict(verdict: string | undefined) {
  const normalized = verdict?.trim().toLowerCase();
  if (!normalized) return 'Unclassified';
  if (normalized.includes('no-go') || normalized.includes('no go')) return 'No-Go';
  if (normalized.includes('cautious')) return 'Cautious';
  if (normalized === 'go' || normalized.includes('recommend')) return 'Go';
  return 'Unclassified';
}

function getPdfText(value: string) {
  return value
    .replace(/₹/g, 'Rs. ')
    .replace(/[–—]/g, '-')
    .replace(/[•·]/g, '-')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapPdfLine(text: string, width = 96) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line && `${line} ${word}`.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function createPdf(lines: string[]) {
  const wrapped = lines.flatMap((line) => wrapPdfLine(line));
  const chunks: string[][] = [];
  for (let index = 0; index < wrapped.length; index += 49) chunks.push(wrapped.slice(index, index + 49));
  const pages = chunks.length ? chunks : [['Tndrlens Analytics Report', 'No analyzed tenders are available.']];
  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 4 + index * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  pages.forEach((pageLines, index) => {
    const pageId = pageIds[index];
    const streamId = pageId + 1;
    const textLines = pageLines.map((line) => `(${getPdfText(line)}) Tj T*`).join('\n');
    const stream = `BT\n/F1 9 Tf\n48 756 Td\n13 TL\n${textLines}\nET`;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`;
    objects[streamId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

export const AnalyticsDashboard: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTenders()
      .then(setTenders)
      .catch((err: Error) => setError(err.message || 'Could not load tender analytics.'))
      .finally(() => setLoading(false));
  }, []);

  const analyzed = useMemo(() => tenders.filter((tender) => tender.status === 'analyzed'), [tenders]);
  const summary = useMemo(() => {
    const readinessValues = analyzed.map((tender) => tender.bid_readiness_score).filter(Number.isFinite);
    const riskValues = analyzed.map((tender) => tender.overall_risk_score).filter(Number.isFinite);
    const totalValue = analyzed.reduce((sum, tender) => sum + (Number.isFinite(tender.value) ? tender.value : 0), 0);
    const avgReadiness = readinessValues.length ? readinessValues.reduce((sum, value) => sum + value, 0) / readinessValues.length : null;
    const avgRisk = riskValues.length ? riskValues.reduce((sum, value) => sum + value, 0) / riskValues.length : null;
    const riskExposure = analyzed.reduce((sum, tender) => sum + (tender.overall_risk_score >= 60 ? tender.value || 0 : 0), 0);
    const verdictCounts = analyzed.reduce<Record<string, number>>((counts, tender) => {
      const verdict = normalizeVerdict(tender.go_no_go_verdict);
      counts[verdict] = (counts[verdict] || 0) + 1;
      return counts;
    }, {});
    const deadlines = analyzed.flatMap((tender) => {
      const timestamp = Date.parse(tender.submission_deadline);
      return Number.isFinite(timestamp) && timestamp >= Date.now() ? [{ tender, timestamp }] : [];
    }).sort((a, b) => a.timestamp - b.timestamp).slice(0, 5);
    return { totalValue, avgReadiness, avgRisk, riskExposure, verdictCounts, deadlines };
  }, [analyzed]);

  const valueData = useMemo(() => [...analyzed]
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 8)
    .map((tender) => ({ name: tender.title.length > 20 ? `${tender.title.slice(0, 19)}…` : tender.title, fullName: tender.title, value: tender.value || 0 })), [analyzed]);

  const readinessData = useMemo(() => [...analyzed]
    .sort((a, b) => (b.bid_readiness_score || 0) - (a.bid_readiness_score || 0))
    .slice(0, 8)
    .map((tender) => ({ name: tender.title.length > 17 ? `${tender.title.slice(0, 16)}…` : tender.title, fullName: tender.title, readiness: tender.bid_readiness_score || 0, risk: tender.overall_risk_score || 0 })), [analyzed]);

  const verdictData = useMemo(() => ['Go', 'Cautious', 'No-Go', 'Unclassified']
    .map((name) => ({ name, value: summary.verdictCounts[name] || 0, color: verdictColors[name] }))
    .filter((item) => item.value > 0), [summary.verdictCounts]);

  const riskData = useMemo(() => {
    const bands = [
      { name: 'Low · under 30%', min: 0, max: 30, fill: '#059669' },
      { name: 'Moderate · 30–59%', min: 30, max: 60, fill: '#D97706' },
      { name: 'High · 60%+', min: 60, max: Infinity, fill: '#DC2626' },
    ];
    return bands.map((band) => ({ name: band.name, count: analyzed.filter((tender) => tender.overall_risk_score >= band.min && tender.overall_risk_score < band.max).length, fill: band.fill }));
  }, [analyzed]);

  const clauseRiskData = useMemo(() => {
    const categories = new Map<string, { total: number; risk: number }>();
    analyzed.forEach((tender) => tender.clauses?.forEach((clause) => {
      const category = clause.category || 'Other';
      const current = categories.get(category) || { total: 0, risk: 0 };
      current.total += 1;
      current.risk += clause.status?.toUpperCase() === 'FAIL' ? 100 : clause.status?.toUpperCase() === 'WARN' ? 50 : 0;
      categories.set(category, current);
    }));
    return [...categories.entries()].map(([name, scores]) => ({ name, risk: Math.round(scores.risk / scores.total), clauses: scores.total }));
  }, [analyzed]);

  const handleDownload = () => {
    const now = new Date();
    const lines = [
      'TNDRLENS - ANALYTICS REPORT',
      `Generated: ${now.toLocaleString()}`,
      `Data scope: ${analyzed.length} analyzed tender${analyzed.length === 1 ? '' : 's'} in this workspace.`,
      '',
      'WORKSPACE SUMMARY',
      `Analyzed tenders: ${analyzed.length}`,
      `Average bid readiness: ${summary.avgReadiness === null ? 'Not available' : `${summary.avgReadiness.toFixed(1)}%`}`,
      `Average bid risk: ${summary.avgRisk === null ? 'Not available' : `${summary.avgRisk.toFixed(1)}%`}`,
      `Total analyzed tender value: ${currency(summary.totalValue)}`,
      `Tender value with high risk (60%+): ${currency(summary.riskExposure)}`,
      '',
      'DECISION DISTRIBUTION',
      ...['Go', 'Cautious', 'No-Go', 'Unclassified'].map((verdict) => `${verdict}: ${summary.verdictCounts[verdict] || 0}`),
      '',
      'TENDER DETAILS',
      'Tender | Organization | Value | Readiness | Risk | Verdict | Submission deadline',
      ...analyzed.map((tender) => [
        tender.title,
        tender.organization || 'Organization not provided',
        currency(tender.value || 0),
        percent(tender.bid_readiness_score),
        percent(tender.overall_risk_score),
        normalizeVerdict(tender.go_no_go_verdict),
        tender.submission_deadline || 'Not provided',
      ].join(' | ')),
      '',
      'Risk level counts classify analyzed tenders by overall risk score: Low <30%, Moderate 30-59%, High 60%+.',
      'This report summarizes workspace records and is intended to support bid review. Verify requirements against each tender document.',
    ];
    const pdf = createPdf(lines);
    const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `tndrlens-analytics-${now.toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (loading) return <div className="flex items-center justify-center p-24"><RefreshCw className="animate-spin text-indigo-500" size={28} /></div>;

  const chartTooltipStyle = { backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' };

  return (
    <div className="space-y-6 text-left">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#334155] pb-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[#6366F1]/20 bg-[#6366F1]/10 p-2.5 text-[#6366F1]"><BarChart4 size={23} /></div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#F8FAFC]">Analytics & reports</h2>
            <p className="mt-1 text-sm text-[#94A3B8]">Tender values, readiness, risk, and submission deadlines from your analyzed workspace records.</p>
          </div>
        </div>
        <button onClick={handleDownload} className="flex items-center gap-2 rounded-lg border border-[#334155] bg-[#111827] px-4 py-2.5 text-sm font-medium text-[#F8FAFC] transition-colors hover:border-[#6366F1]/50 hover:bg-[#1E293B]">
          <Download size={15} /> Download analytics PDF
        </button>
      </header>

      {error && <div role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A3B8]">
        <span>Showing {analyzed.length} analyzed tender{analyzed.length === 1 ? '' : 's'}</span>
        {tenders.length !== analyzed.length && <span>{tenders.length - analyzed.length} pending or failed record{tenders.length - analyzed.length === 1 ? '' : 's'} excluded</span>}
      </div>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { title: 'Analyzed tenders', value: `${analyzed.length}`, note: 'Current workspace', icon: FileText },
          { title: 'Average bid readiness', value: summary.avgReadiness === null ? '—' : percent(summary.avgReadiness), note: 'Mean readiness score', icon: Target },
          { title: 'Average bid risk', value: summary.avgRisk === null ? '—' : percent(summary.avgRisk), note: 'Mean overall risk score', icon: ShieldAlert },
          { title: 'Tender value', value: currency(summary.totalValue), note: 'Combined analyzed value', icon: CircleCheck },
        ].map((card) => {
          const Icon = card.icon;
          return <article key={card.title} className="dashboard-panel p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-[#94A3B8]">{card.title}</span><Icon size={16} className="text-[#6366F1]" /></div>
            <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-[#F8FAFC]">{card.value}</p>
            <p className="mt-1 text-xs text-[#94A3B8]">{card.note}</p>
          </article>;
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="dashboard-panel p-5">
          <div className="mb-4"><h3 className="text-sm font-semibold text-[#F8FAFC]">Tender value by opportunity</h3><p className="mt-1 text-xs text-[#94A3B8]">Top 8 analyzed tenders · ₹ crore</p></div>
          {valueData.length ? <div className="h-64" aria-label="Tender values chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={valueData} margin={{ top: 8, right: 8, left: -16, bottom: 12 }}><CartesianGrid vertical={false} strokeDasharray="3 4" stroke="var(--border-color)" /><XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-14} textAnchor="end" /><YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} /><Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [currency(Number(value)), 'Tender value']} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''} /><Bar dataKey="value" fill="var(--accent-color)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div> : <EmptyChart message="Tender values will appear here after a tender has been analyzed." />}
        </article>

        <article className="dashboard-panel p-5">
          <div className="mb-4"><h3 className="text-sm font-semibold text-[#F8FAFC]">Readiness and risk by tender</h3><p className="mt-1 text-xs text-[#94A3B8]">Scores for the most recently analyzed opportunities</p></div>
          {readinessData.length ? <div className="h-64" aria-label="Tender readiness and risk chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={readinessData} margin={{ top: 8, right: 8, left: -16, bottom: 12 }}><CartesianGrid vertical={false} strokeDasharray="3 4" stroke="var(--border-color)" /><XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-14} textAnchor="end" /><YAxis domain={[0, 100]} stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} /><Tooltip contentStyle={chartTooltipStyle} formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name === 'readiness' ? 'Readiness' : 'Risk']} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''} /><Legend /><Bar dataKey="readiness" name="Readiness" fill="#2563EB" radius={[3, 3, 0, 0]} /><Bar dataKey="risk" name="Risk" fill="#D97706" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div> : <EmptyChart message="Readiness and risk comparisons appear after analysis." />}
        </article>

        <article className="dashboard-panel p-5">
          <div className="mb-4"><h3 className="text-sm font-semibold text-[#F8FAFC]">Go / no-go decisions</h3><p className="mt-1 text-xs text-[#94A3B8]">Verdicts recorded across analyzed tenders</p></div>
          {verdictData.length ? <div className="h-60"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={verdictData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={3}>{verdictData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip contentStyle={chartTooltipStyle} /><Legend /></PieChart></ResponsiveContainer></div> : <EmptyChart message="No decision verdicts are available yet." />}
        </article>

        <article className="dashboard-panel p-5">
          <div className="mb-4"><h3 className="text-sm font-semibold text-[#F8FAFC]">Risk profile</h3><p className="mt-1 text-xs text-[#94A3B8]">Tender counts grouped by overall risk score</p></div>
          {analyzed.length ? <div className="h-60"><ResponsiveContainer width="100%" height="100%"><BarChart data={riskData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><CartesianGrid vertical={false} strokeDasharray="3 4" stroke="var(--border-color)" /><XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} /><Tooltip contentStyle={chartTooltipStyle} /><Bar dataKey="count" name="Tenders" radius={[4, 4, 0, 0]}>{riskData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer></div> : <EmptyChart message="Risk profile will be available after tender analysis." />}
        </article>

        {clauseRiskData.length > 0 && <article className="dashboard-panel p-5 xl:col-span-2">
          <div className="mb-4"><h3 className="text-sm font-semibold text-[#F8FAFC]">Clause review outcomes by category</h3><p className="mt-1 text-xs text-[#94A3B8]">Average issue index derived from clause statuses: fail = 100, warning = 50, pass = 0.</p></div>
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={clauseRiskData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}><CartesianGrid vertical={false} strokeDasharray="3 4" stroke="var(--border-color)" /><XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} /><Tooltip contentStyle={chartTooltipStyle} formatter={(value, _name, item) => [`${value}% (${item.payload.clauses} clauses)`, 'Issue index']} /><Bar dataKey="risk" name="Issue index" fill="#DC2626" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </article>}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="dashboard-panel p-5 xl:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-[#F8FAFC]">Analyzed tender register</h3><p className="mt-1 text-xs text-[#94A3B8]">Current opportunity values, scores, and decisions</p></div><FileText size={17} className="text-[#6366F1]" /></div>
          {analyzed.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="dashboard-table-header text-[#94A3B8]"><tr>{['Tender', 'Value', 'Readiness', 'Risk', 'Decision', 'Deadline'].map((label) => <th key={label} className="px-3 py-2.5 font-medium">{label}</th>)}</tr></thead><tbody>{[...analyzed].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).map((tender) => <tr key={tender.id} className="dashboard-table-row border-t border-[#334155]"><td className="max-w-[280px] truncate px-3 py-3 font-medium text-[#F8FAFC]" title={tender.title}>{tender.title}</td><td className="whitespace-nowrap px-3 py-3 text-[#94A3B8]">{currency(tender.value || 0)}</td><td className="px-3 py-3 text-[#94A3B8]">{percent(tender.bid_readiness_score)}</td><td className="px-3 py-3"><span className={`analytics-risk-badge analytics-risk-${riskBand(tender.overall_risk_score || 0).toLowerCase()}`}>{percent(tender.overall_risk_score)}</span></td><td className="px-3 py-3 text-[#94A3B8]">{normalizeVerdict(tender.go_no_go_verdict)}</td><td className="whitespace-nowrap px-3 py-3 text-[#94A3B8]">{tender.submission_deadline || '—'}</td></tr>)}</tbody></table></div> : <EmptyChart message="Analyzed tenders will appear in this register." />}
        </article>

        <aside className="space-y-4">
          <article className="dashboard-panel p-5">
            <div className="mb-4 flex items-center gap-2"><CalendarClock size={16} className="text-[#6366F1]" /><h3 className="text-sm font-semibold text-[#F8FAFC]">Upcoming deadlines</h3></div>
            {summary.deadlines.length ? <ul className="divide-y divide-[#334155]">{summary.deadlines.map(({ tender, timestamp }) => <li key={tender.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><span className="min-w-0 truncate text-xs text-[#F8FAFC]" title={tender.title}>{tender.title}</span><time className="shrink-0 text-xs text-[#94A3B8]">{new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></li>)}</ul> : <p className="text-xs text-[#94A3B8]">No future submission dates in analyzed tenders.</p>}
          </article>
          <article className="dashboard-panel p-5">
            <div className="mb-2 flex items-center gap-2"><TriangleAlert size={16} className="text-amber-500" /><h3 className="text-sm font-semibold text-[#F8FAFC]">High-risk value</h3></div>
            <p className="text-2xl font-semibold text-[#F8FAFC]">{currency(summary.riskExposure)}</p>
            <p className="mt-1 text-xs text-[#94A3B8]">Combined value where overall risk score is 60% or higher.</p>
          </article>
        </aside>
      </section>
    </div>
  );
};

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-[#334155] px-6 text-center text-xs text-[#94A3B8]">{message}</div>
);
