import React, { useState, useEffect } from 'react';
import { api, type Tender } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Trash2,
  ArrowUpRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  onSelectTender: (id: number) => void;
  forceSubTab?: 'dashboard' | 'catalog' | 'discovery';
  onPinToggle?: (id: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectTender, forceSubTab, onPinToggle }) => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Discovery Portal & SubTabs
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'catalog' | 'discovery' | 'saved'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(1000);
  const [discoveryTenders, setDiscoveryTenders] = useState<any[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  const fetchTenders = async () => {
    try {
      setLoading(true);
      const data = await api.getTenders();
      setTenders(data);
      if (data.length === 0) {
        setActiveSubTab('discovery');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscovery = async () => {
    try {
      setDiscoveryLoading(true);
      const data = await api.getDiscoveryTenders(searchQuery, deptFilter, minVal, maxVal);
      setDiscoveryTenders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const fetchSaved = async () => {
    try {
      // Reload overall tenders which captures bookmark adjustments
      const data = await api.getTenders();
      setTenders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBookmark = async (id: number, isDiscovery = false) => {
    try {
      const result = await api.toggleBookmark(id);
      
      // Update bookmarked status in discovery states
      if (isDiscovery) {
        setDiscoveryTenders(prev => prev.map(t => {
          if (t.id === id) {
            return { ...t, is_bookmarked: result.is_bookmarked, id: result.id };
          }
          // If we imported it, match title
          return t;
        }));
      }
      
      // Refresh saved bids list
      fetchSaved();
      fetchTenders();
      if (onPinToggle) {
        onPinToggle(id);
      }
    } catch (err) {
      alert('Failed to toggle bookmark');
    }
  };

  const handleImportDiscovery = async (discoveryTender: any) => {
    // Map discovery item to corresponding demo template file upload to simulate parsing & analysis
    let templateName = 'general';
    const titleLower = discoveryTender.title.toLowerCase();
    if (titleLower.includes('metro') || titleLower.includes('railway') || titleLower.includes('signalling')) {
      templateName = 'metro';
    } else if (titleLower.includes('highway') || titleLower.includes('road')) {
      templateName = 'highway';
    } else if (titleLower.includes('retrofitting') || titleLower.includes('hospital') || titleLower.includes('court')) {
      templateName = 'hospital';
    }

    setActiveSubTab('catalog');
    triggerDemoUpload(templateName);
  };

  useEffect(() => {
    fetchTenders();
    fetchSaved();
    fetchDiscovery();
  }, []);

  useEffect(() => {
    if (forceSubTab) {
      setActiveSubTab(forceSubTab as any);
    }
  }, [forceSubTab]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this tender?')) return;
    try {
      await api.deleteTender(id);
      setTenders(tenders.filter((t) => t.id !== id));
    } catch (err) {
      alert('Failed to delete tender');
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const newTender = await api.uploadTender(file);
      setTenders([newTender, ...tenders]);
      setUploadSuccess(`Tender "${newTender.title}" successfully processed!`);
      setTimeout(() => setUploadSuccess(''), 4000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process tender PDF');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Helper to trigger simulated demo uploads instantly
  const triggerDemoUpload = (templateName: string) => {
    let filename = 'General_Construction_Tender.pdf';
    if (templateName === 'metro') filename = 'Delhi_Metro_Line-9_Viaduct_Tender.pdf';
    if (templateName === 'highway') filename = 'NHAI_Dwarka_Expressway_Highway_Tender.pdf';
    if (templateName === 'hospital') filename = 'PWD_Mumbai_Government_Hospital_Block_Tender.pdf';

    const mockBlob = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' });
    const mockFile = new File([mockBlob], filename, { type: 'application/pdf' });
    handleFileUpload(mockFile);
  };

  // Calculate statistics
  const totalValue = tenders.reduce((sum, t) => sum + (t.value || 0), 0);
  const avgRisk = tenders.length
    ? Math.round(tenders.reduce((sum, t) => sum + (t.overall_risk_score || 0), 0) / tenders.length)
    : 0;
  const avgEligibility = tenders.length ? Math.round(100 - avgRisk) : 0;
  const avgReadiness = tenders.length
    ? Math.round(tenders.reduce((sum, t) => sum + (t.bid_readiness_score || 0), 0) / tenders.length)
    : 0;
  const upcomingTenders = tenders
    .filter((t) => {
      if (!t.submission_deadline) return false;
      const deadline = new Date(t.submission_deadline);
      return !Number.isNaN(deadline.getTime()) && deadline.getTime() >= Date.now();
    })
    .sort((a, b) => new Date(a.submission_deadline).getTime() - new Date(b.submission_deadline).getTime())
    .slice(0, 4);
  const recentTenders = [...tenders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  
  // Format data for Recharts
  const chartData = tenders.slice(0, 8).map((t) => ({
    name: t.title.length > 20 ? t.title.substring(0, 18) + '...' : t.title,
    value: t.value,
    eligibility: 100 - t.overall_risk_score,
  })).reverse();

  // Helper to color eligibility score badge
  const getEligibilityBadge = (score: number) => {
    if (score >= 80) return <span className="eligibility-badge eligibility-good">{score}%</span>;
    if (score >= 50) return <span className="eligibility-badge eligibility-warn">{score}%</span>;
    return <span className="eligibility-badge eligibility-risk">{score}%</span>;
  };

  return (
    <div className="dashboard-shell flex-1 bg-slate-900 text-slate-100 select-none">
      <div className="w-full max-w-none space-y-8">
        
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Tender overview</h2>
            <p className="text-sm text-slate-400">Review analyzed opportunities, eligibility, and submission deadlines.</p>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all duration-150 ${
              activeSubTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all duration-150 ${
              activeSubTab === 'catalog'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Analyzed tenders ({tenders.length})
          </button>
          <button
            onClick={() => {
              setActiveSubTab('discovery');
              fetchDiscovery();
            }}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all duration-150 ${
              activeSubTab === 'discovery'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Tender discovery
          </button>
          <button
            onClick={() => {
              setActiveSubTab('saved');
              fetchSaved();
            }}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all duration-150 ${
              activeSubTab === 'saved'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Saved tenders ({tenders.filter(t => t.is_bookmarked).length})
          </button>
        </div>

        {/* Tab Content Rendering */}
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="dashboard-command-grid">
              <div className="min-w-0 space-y-5">
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="dashboard-panel p-5 text-left">
                    <p className="text-sm text-slate-500">Analyzed tenders</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-100">{tenders.length}</p>
                    <p className="mt-2 text-xs text-slate-500">In your workspace</p>
                  </div>
                  <div className="dashboard-panel p-5 text-left">
                    <p className="text-sm text-slate-500">Average eligibility</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-100">{tenders.length ? `${avgEligibility}%` : '—'}</p>
                    <p className="mt-2 text-xs text-slate-500">Based on analyzed clauses</p>
                  </div>
                  <div className="dashboard-panel p-5 text-left">
                    <p className="text-sm text-slate-500">Average bid readiness</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-100">{tenders.length ? `${avgReadiness}%` : '—'}</p>
                    <p className="mt-2 text-xs text-slate-500">Checklist and profile match</p>
                  </div>
                  <div className="dashboard-panel p-5 text-left">
                    <p className="text-sm text-slate-500">Total tender value</p>
                    <p className="mt-2 whitespace-nowrap text-2xl font-semibold text-slate-100">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr</p>
                    <p className="mt-2 text-xs text-slate-500">Across analyzed tenders</p>
                  </div>
                </div>

                <section className="dashboard-panel p-6 text-left">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">Tender value by opportunity</h3>
                      <p className="mt-1 text-xs text-slate-500">Contract values from your analyzed tenders</p>
                    </div>
                    <span className="text-xs text-slate-500">Value (₹ Cr)</span>
                  </div>
                  {chartData.length ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid vertical={false} strokeDasharray="2 4" stroke="var(--border-color)" />
                          <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }} />
                          <Bar dataKey="value" fill="var(--accent-color)" radius={[4, 4, 0, 0]} name="Tender value" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center text-sm text-slate-500">Tender values will appear here after analysis.</div>
                  )}
                </section>

                <section className="dashboard-panel overflow-hidden text-left">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">Recent tenders</h3>
                      <p className="mt-1 text-xs text-slate-500">Latest documents added to your workspace</p>
                    </div>
                    <button onClick={() => setActiveSubTab('catalog')} className="text-sm font-medium text-indigo-400 hover:underline">View all</button>
                  </div>
                  {recentTenders.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px] text-left text-sm">
                        <thead className="dashboard-table-header text-xs text-slate-500">
                          <tr><th className="px-5 py-3 font-medium">Tender</th><th className="px-5 py-3 font-medium">Agency</th><th className="px-5 py-3 font-medium">Deadline</th><th className="px-5 py-3 font-medium">Eligibility</th><th className="px-5 py-3 text-right font-medium">Value</th></tr>
                        </thead>
                        <tbody>
                          {recentTenders.map((tender) => (
                            <tr key={tender.id} onClick={() => onSelectTender(tender.id)} className="dashboard-table-row cursor-pointer border-t border-slate-800">
                              <td className="max-w-[280px] truncate px-5 py-3.5 font-medium text-slate-200">{tender.title}</td>
                              <td className="max-w-[180px] truncate px-5 py-3.5 text-slate-500">{tender.organization || '—'}</td>
                              <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{tender.submission_deadline || '—'}</td>
                              <td className="px-5 py-3.5">{getEligibilityBadge(100 - Math.round(tender.overall_risk_score || 0))}</td>
                              <td className="whitespace-nowrap px-5 py-3.5 text-right font-medium text-slate-200">₹{(tender.value || 0).toLocaleString('en-IN')} Cr</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-5 py-10 text-center">
                      <h4 className="text-sm font-medium text-slate-200">No tenders analyzed yet</h4>
                      <p className="mt-1 text-sm text-slate-500">Upload a tender or browse available opportunities to get started.</p>
                    </div>
                  )}
                </section>
              </div>

              <aside className="min-w-0 space-y-5 text-left">
                <section className="dashboard-panel p-5 space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">Upcoming deadlines</h3>
                    <p className="mt-1 text-xs text-slate-500">Sorted by submission date</p>
                  </div>
                  {upcomingTenders.length ? (
                    <div className="divide-y divide-slate-800">
                      {upcomingTenders.map((tender) => (
                        <button key={tender.id} onClick={() => onSelectTender(tender.id)} className="flex w-full items-center justify-between gap-3 py-3 text-left first:pt-0 last:pb-0">
                          <span className="truncate text-sm font-medium text-slate-200">{tender.title}</span>
                          <span className="shrink-0 text-xs text-slate-500">{new Date(tender.submission_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="py-2 text-sm text-slate-500">No upcoming deadlines in analyzed tenders.</p>
                  )}
                </section>

                <section className="dashboard-panel p-5 space-y-3">
                  <h3 className="text-base font-semibold text-slate-100">Quick actions</h3>
                  <button onClick={() => setActiveSubTab('catalog')} className="dashboard-action w-full text-left">
                    <span className="flex items-center gap-3"><Upload size={16} />Upload a tender</span><ArrowUpRight size={15} />
                  </button>
                  <button onClick={() => { setActiveSubTab('discovery'); fetchDiscovery(); }} className="dashboard-action w-full text-left">
                    <span className="flex items-center gap-3"><FileText size={16} />Find opportunities</span><ArrowUpRight size={15} />
                  </button>
                </section>
              </aside>
            </div>
          </div>
        )}
        {activeSubTab === 'catalog' && (
          <>
            {/* Upload Action Panel */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />
              
              {uploadError && (
                <div className="bg-rose-950/40 border border-rose-900/50 rounded-2xl p-4 mb-6 flex items-center gap-3 text-rose-300 text-xs">
                  <XCircle size={16} />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-2xl p-4 mb-6 flex items-center gap-3 text-emerald-300 text-xs">
                  <CheckCircle2 size={16} />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {uploading ? (
                <div className="flex items-center gap-3 py-8" role="status" aria-live="polite">
                  <RefreshCw className="animate-spin text-indigo-500" size={20} />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Processing tender</h4>
                    <p className="mt-1 text-sm text-slate-500">Extracting requirements and checking eligibility. This may take a moment.</p>
                  </div>
                </div>
              ) : (
                <label className="theme-dropzone flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 cursor-pointer group transition-all duration-200">
                  <Upload className="text-slate-500 group-hover:text-indigo-400 transition-colors mb-3 group-hover:scale-110 duration-200" size={32} />
                  <span className="text-sm font-bold text-slate-200 group-hover:text-white">Upload Tender Document PDF</span>
                  <span className="text-xs text-slate-500 mt-1">Select scanned or standard specifications (Up to 100MB)</span>
                  <input type="file" accept=".pdf" onChange={onFileChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Dashboard Statistics & Analytics Chart */}
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <RefreshCw className="animate-spin text-indigo-500" size={24} />
              </div>
            ) : (
              <>
                {tenders.length > 0 ? (
                  <>
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Metric Cards */}
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Inspected Bids</span>
                        <h3 className="text-2xl font-bold text-slate-100 mt-2">{tenders.length}</h3>
                        <span className="text-[10px] text-slate-500 mt-1 block">Full explainable clause breakdown generated</span>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tender Volume Scanned</span>
                        <h3 className="text-2xl font-bold text-indigo-400 mt-2">Rs. {totalValue.toFixed(1)} Cr</h3>
                        <span className="text-[10px] text-slate-500 mt-1 block">Total project contract value scanned</span>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Average Bid Risk Rating</span>
                        <h3 className="text-2xl font-bold text-rose-455 mt-2">{avgRisk}%</h3>
                        <span className="text-[10px] text-slate-500 mt-1 block">Refined compliance and tech scores</span>
                      </div>
                    </div>

                    {/* Recharts Analytics Chart */}
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-6">Tender Scale Comparison (Crores)</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                              labelStyle={{ color: '#f8fafc', fontWeight: 'bold', fontSize: 11 }}
                              itemStyle={{ fontSize: 11 }}
                            />
                            <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Project Value (Cr)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Tender List Table */}
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                      <div className="px-6 py-5 border-b border-slate-800">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Processed Bids Catalog</h3>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-350">
                          <thead className="bg-slate-900/40 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-6 py-4">Tender Specifications</th>
                              <th className="px-6 py-4">Government Agency</th>
                              <th className="px-6 py-4">Contract Value</th>
                              <th className="px-6 py-4">EMD Allocation</th>
                              <th className="px-6 py-4">Eligibility Audit</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900">
                            {tenders.map((tender) => {
                              const eligibility = 100 - Math.round(tender.overall_risk_score);
                              return (
                                <tr
                                  key={tender.id}
                                  onClick={() => onSelectTender(tender.id)}
                                  className="hover:bg-slate-900/30 transition-all duration-150 group cursor-pointer"
                                >
                                  <td className="px-6 py-5">
                                    <div className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                                      {tender.title}
                                      {tender.is_bookmarked && (
                                        <span className="text-[8px] text-indigo-450 bg-indigo-950/60 border border-indigo-900/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Saved</span>
                                      )}
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-1.5 flex items-center gap-2">
                                      <span>Deadline: {tender.submission_deadline || 'N/A'}</span>
                                      <span>•</span>
                                      <span className="text-[9px] bg-slate-900/80 px-2 py-0.5 rounded border border-slate-850 font-bold text-indigo-400 uppercase">Confidence: {Math.round(tender.confidence_score * 100)}%</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5 text-slate-400 truncate max-w-xs">{tender.organization}</td>
                                  <td className="px-6 py-5 font-bold text-slate-200">Rs. {tender.value.toFixed(1)} Cr</td>
                                  <td className="px-6 py-5 text-slate-450 font-mono">Rs. {tender.EMD.toFixed(1)} L</td>
                                  <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                      {getEligibilityBadge(eligibility)}
                                      <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900 hidden sm:block shrink-0">
                                        <div
                                          className={`h-full rounded-full ${
                                            eligibility >= 80 ? 'bg-emerald-500' : eligibility >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                          }`}
                                          style={{ width: `${eligibility}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => handleToggleBookmark(tender.id)}
                                        className={`p-2 rounded-lg transition-colors ${tender.is_bookmarked ? 'text-indigo-400 hover:bg-slate-900' : 'text-slate-600 hover:text-indigo-400 hover:bg-slate-900'}`}
                                        title={tender.is_bookmarked ? "Remove Bookmark" : "Save / Bookmark"}
                                      >
                                        ★
                                      </button>
                                      <button
                                        onClick={(e) => handleDelete(tender.id, e)}
                                        className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-950/20 rounded-lg transition-colors"
                                        title="Delete Tender"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                      <button
                                        onClick={() => onSelectTender(tender.id)}
                                        className="p-2 text-indigo-400 group-hover:translate-x-0.5 transition-transform"
                                      >
                                        <ArrowUpRight size={15} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="theme-empty-state flex flex-col items-center justify-center border rounded-3xl py-20">
                    <FileText size={48} className="text-slate-700 mb-4" />
                    <h3 className="font-bold text-slate-300 text-sm">No Inspected Tenders Yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm text-center leading-relaxed">
                      Upload a tender PDF or browse the discovery portal to get started.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* TAB 2: Discovery Portal */}
        {activeSubTab === 'discovery' && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 relative">
              <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider border-b border-slate-800 pb-3">Open Portals Discovery Engine</h3>
              
              <div className="grid md:grid-cols-4 gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Keywords (e.g. signal, satellite)"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
                
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="">All Departments</option>
                  <option value="ISRO">ISRO</option>
                  <option value="Railways">Indian Railways</option>
                  <option value="NHAI">NHAI</option>
                  <option value="PWD">PWD</option>
                </select>

                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={minVal}
                    onChange={(e) => setMinVal(Number(e.target.value))}
                    placeholder="Min Value (Cr)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
                  />
                  <span className="text-slate-500 text-xs">-</span>
                  <input
                    type="number"
                    value={maxVal}
                    onChange={(e) => setMaxVal(Number(e.target.value))}
                    placeholder="Max Value (Cr)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
                  />
                </div>

                <button
                  onClick={fetchDiscovery}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-bold transition-all"
                >
                  Search Government Tenders
                </button>
              </div>
            </div>

            {discoveryLoading ? (
              <div className="flex justify-center p-12">
                <RefreshCw className="animate-spin text-indigo-500" size={24} />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {discoveryTenders.length > 0 ? (
                  discoveryTenders.map((tender) => (
                    <div key={tender.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-bold text-sm text-slate-200 leading-snug">{tender.title}</h4>
                          <button
                            onClick={() => handleToggleBookmark(tender.id, true)}
                            className={`text-lg transition-colors ${tender.is_bookmarked ? 'text-indigo-400' : 'text-slate-700 hover:text-indigo-400'}`}
                            title="Save Tender"
                          >
                            ★
                          </button>
                        </div>
                        <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase block mb-3">{tender.organization}</span>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">{tender.summary}</p>
                        
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 bg-slate-900/40 p-2.5 rounded-lg mb-4">
                          <div>
                            <span className="block text-slate-600 uppercase font-bold">Cost</span>
                            <span className="font-semibold text-slate-300">Rs. {tender.value} Cr</span>
                          </div>
                          <div>
                            <span className="block text-slate-600 uppercase font-bold">EMD</span>
                            <span className="font-semibold text-slate-300">Rs. {tender.EMD} L</span>
                          </div>
                          <div>
                            <span className="block text-slate-600 uppercase font-bold">Deadline</span>
                            <span className="font-semibold text-slate-300">{tender.submission_deadline}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        {tender.status === 'analyzed' ? (
                          <button
                            onClick={() => onSelectTender(tender.id)}
                            className="w-full bg-slate-900 hover:bg-slate-850 text-indigo-400 border border-indigo-950 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                          >
                            View Eligibility Report
                          </button>
                        ) : (
                          <button
                            onClick={() => handleImportDiscovery(tender)}
                            className="w-full bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                          >
                            <Sparkles size={12} />
                            Import & Analyze eligibility
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 bg-slate-950 border border-slate-850 rounded-2xl py-16 text-center text-xs text-slate-500">
                    No active tenders match your discovery search filters.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Saved Bids */}
        {activeSubTab === 'saved' && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Bookmarked & Saved Tenders</h3>
              <p className="text-xs text-slate-400 mt-1">Inspected tenders that you saved or bookmarked for easy reference.</p>
            </div>

            {tenders.filter(t => t.is_bookmarked).length > 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <tbody className="divide-y divide-slate-800">
                    {tenders.filter(t => t.is_bookmarked).map((tender) => {
                      const eligibility = 100 - Math.round(tender.overall_risk_score);
                      return (
                        <tr
                          key={tender.id}
                          onClick={() => onSelectTender(tender.id)}
                          className="hover:bg-slate-900/40 cursor-pointer transition-colors duration-150 group"
                        >
                          <td className="px-6 py-5">
                            <div className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                              {tender.title}
                              <span className="text-[10px] text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-900/50 font-bold">Bookmarked</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">Deadline: {tender.submission_deadline} | Agency: {tender.organization}</div>
                          </td>
                          <td className="px-6 py-5 font-semibold text-slate-200">Rs. {tender.value.toFixed(1)} Cr</td>
                          <td className="px-6 py-5">{getEligibilityBadge(eligibility)}</td>
                          <td className="px-6 py-5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBookmark(tender.id);
                              }}
                              className="p-2 text-indigo-400 hover:bg-slate-800 rounded-lg"
                              title="Remove Bookmark"
                            >
                              ★
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-850 rounded-2xl py-16 text-center text-xs text-slate-500">
                You haven't bookmarked any bids yet. Use Discovery or Catalog list stars to bookmark tenders.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
