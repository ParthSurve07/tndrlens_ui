import React, { useState, useEffect, useRef } from 'react';
import { api, type Tender, type SimilarTender, type DocumentChecklist } from '../services/api';
import {
  ArrowLeft, RefreshCw, AlertCircle, FileText, CheckCircle2, MessageSquare, Send, AlertTriangle,
  Upload, BookOpen, Layers, ShieldAlert, Gauge, History, Paperclip, ClipboardList, PenTool, Search, Star
} from 'lucide-react';

interface TenderDetailsProps {
  tenderId: number;
  onBack: () => void;
  onPinToggle?: (id: number) => void;
}

export const TenderDetails: React.FC<TenderDetailsProps> = ({ tenderId, onBack, onPinToggle }) => {
  const [tender, setTender] = useState<Tender | null>(null);
  const [similarTenders, setSimilarTenders] = useState<SimilarTender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handlePinToggleClick = async () => {
    try {
      const result = await api.toggleBookmark(tenderId);
      if (tender) {
        setTender({ ...tender, is_bookmarked: result.is_bookmarked });
      }
      if (onPinToggle) {
        onPinToggle(tenderId);
      }
    } catch (e) {
      alert('Failed to toggle pin');
    }
  };
  
  // 11 Workspaces Tabs
  // Seed initial tab from restored state if available
  const getRestoredTab = () => {
    const savedState = localStorage.getItem(`ws-state-tender-${tenderId}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        return parsed.activeTab || 'overview';
      } catch (e) {}
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'pdf' | 'explorer' | 'eligibility' | 'risk' | 'readiness' | 'proposal' | 'chat' | 'corrigendum' | 'documents' | 'timeline'>(getRestoredTab() as any);
  
  // AI Chat states
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'ai'; text: string; references?: string[] }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Proposal Generator state
  const [selectedProposalType, setSelectedProposalType] = useState<'technical' | 'methodology' | 'safety' | 'financial'>('technical');
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [proposalOutput, setProposalOutput] = useState('');

  // Corrigendum state
  const [amendmentFile, setAmendmentFile] = useState<File | null>(null);
  const [amendmentUploading, setAmendmentUploading] = useState(false);
  const [amendmentSuccess, setAmendmentSuccess] = useState('');

  // Active clause selection for Clause Explorer
  const [selectedClauseId, setSelectedClauseId] = useState<number | null>(null);

  const fetchTenderDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getTender(tenderId);
      setTender(data);
      
      // Fetch similar tenders
      const similar = await api.getSimilarTenders(tenderId);
      setSimilarTenders(similar);

      // Seed chat log from restored session or default welcome message
      const savedState = localStorage.getItem(`ws-state-tender-${tenderId}`);
      let parsedState: any = null;
      if (savedState) {
        try {
          parsedState = JSON.parse(savedState);
        } catch (e) {}
      }

      if (parsedState && parsedState.chatLog) {
        setChatLog(parsedState.chatLog);
      } else {
        setChatLog([
          {
            sender: 'ai',
            text: `Hello! I've loaded the full specifications index for "${data.title}". You can query me on technical turnovers, safety plans, EMD structures, or contractor qualifications.`
          }
        ]);
      }

      if (parsedState && parsedState.proposalOutput) {
        setProposalOutput(parsedState.proposalOutput);
      }
    } catch (err: any) {
      setError('Failed to fetch tender details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenderDetails();
  }, [tenderId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  useEffect(() => {
    if (!tender) return;
    const savedState = localStorage.getItem(`ws-state-tender-${tenderId}`) || '{}';
    try {
      const parsed = JSON.parse(savedState);
      parsed.activeTab = activeTab;
      parsed.chatLog = chatLog;
      parsed.proposalOutput = proposalOutput;
      localStorage.setItem(`ws-state-tender-${tenderId}`, JSON.stringify(parsed));
    } catch (e) {}
  }, [activeTab, chatLog, proposalOutput, tenderId, tender]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatLoading) return;

    const userText = chatMessage;
    setChatMessage('');
    setChatLog((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const data = await api.chat(tenderId, userText);
      setChatLog((prev) => [...prev, { sender: 'ai', text: data.answer, references: data.references }]);
    } catch (err) {
      setChatLog((prev) => [...prev, { sender: 'ai', text: 'Error connecting to vector knowledge base. Verify backend status.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const generateProposalDraft = () => {
    setGeneratingProposal(true);
    setProposalOutput('');
    let steps = [
      `Initializing Proposal Engine for ${selectedProposalType.toUpperCase()} document...`,
      `Injecting corporate credentials and contractor licenses...`,
      `Analyzing clause constraints and EMD conditions...`,
      `Finalizing Method Statement layouts...`
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProposalOutput(prev => prev + (prev ? '\n' : '') + `[SYSTEM] ${steps[stepIndex]}`);
        stepIndex++;
      } else {
        clearInterval(interval);
        setGeneratingProposal(false);
        setProposalOutput(prev => prev + '\n\n' + `=== EXECUTIVE PROPOSAL DRAFT ===\n\nPROPOSAL TYPE: ${selectedProposalType.toUpperCase()}\nPROJECT: ${tender?.title}\nAUTHORITY: ${tender?.organization}\n\n1. EXECUTIVE OVERVIEW\nBuildCorp Infrastructure Ltd. submits this proposal for civil works operations. Our technical team satisfies all bid preconditions outlined in the tender specification documents...`);
      }
    }, 1000);
  };

  const handleAmendmentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendmentFile) return;

    setAmendmentUploading(true);
    setAmendmentSuccess('');

    try {
      await api.uploadAmendment(tenderId, amendmentFile);
      setAmendmentSuccess('Corrigendum successfully diffed and original specifications updated.');
      setAmendmentFile(null);
      
      const data = await api.getTender(tenderId);
      setTender(data);
    } catch (err: any) {
      alert('Failed to upload corrigendum file');
    } finally {
      setAmendmentUploading(false);
    }
  };

  const handleToggleChecklist = async (item: DocumentChecklist) => {
    const nextStatus = item.status === 'uploaded' ? 'missing' : 'uploaded';
    try {
      const updated = await api.updateChecklist(tenderId, item.id, nextStatus, nextStatus === 'uploaded' ? 'MANUAL' : '');
      if (tender) {
        setTender({
          ...tender,
          checklist: tender.checklist.map((c) => (c.id === item.id ? updated : c)),
        });
      }
    } catch (err) {
      alert('Failed to update checklist item status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24 bg-[#0F172A]">
        <RefreshCw className="animate-spin text-indigo-500 mb-4" size={32} />
      </div>
    );
  }

  if (error || !tender) {
    return (
      <div className="bg-[#111827] border border-[#334155] rounded-xl p-8 text-center space-y-4">
        <AlertCircle className="text-[#EF4444] mx-auto" size={32} />
        <h3 className="font-bold text-[#F8FAFC]">Tender Workspace Error</h3>
        <p className="text-xs text-[#94A3B8]">{error || 'Tender specification not found.'}</p>
        <button onClick={onBack} className="bg-[#6366F1] px-4 py-2 rounded-lg text-xs font-bold text-white">Back to Catalog</button>
      </div>
    );
  }

  const eligibilityScore = 100 - Math.round(tender.overall_risk_score);
  const readinessIndex = Math.round(tender.confidence_score * 100);
  const riskIndex = Math.round(tender.overall_risk_score);
  const missingDocsCount = tender.checklist.filter(c => c.status !== 'uploaded').length;

  const workspaceTabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'pdf', label: 'Tender PDF', icon: BookOpen },
    { id: 'explorer', label: 'Clause Explorer', icon: Search },
    { id: 'eligibility', label: 'Eligibility Check', icon: CheckCircle2 },
    { id: 'risk', label: 'Risk Analysis', icon: ShieldAlert },
    { id: 'readiness', label: 'Bid Readiness', icon: Gauge },
    { id: 'proposal', label: 'Proposal Generator', icon: PenTool },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'corrigendum', label: 'Corrigenda Tracker', icon: History },
    { id: 'documents', label: 'Documents BOQ', icon: Paperclip },
    { id: 'timeline', label: 'Activity Log', icon: ClipboardList }
  ] as const;

  return (
    <div className="space-y-8 select-none text-left">
      {/* Top Header details pane */}
      <div className="bg-[#111827] border border-[#334155] rounded-xl p-6 relative">
        {/* Back Link */}
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] mb-4">
          <ArrowLeft size={13} />
          <span>Back to Tenders list</span>
        </button>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1.5">
            <span className="text-[9px] bg-indigo-950/60 border border-indigo-900/30 px-2 py-0.5 rounded text-indigo-400 font-bold uppercase tracking-wider">
              {tender.organization}
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-[#F8FAFC]">{tender.title}</h2>
              <button
                onClick={handlePinToggleClick}
                className={`p-1.5 rounded-lg border transition-all ${
                  tender.is_bookmarked
                    ? 'bg-amber-500/10 border-amber-500/35 text-amber-500 hover:bg-amber-500/20'
                    : 'bg-slate-900 border-[#334155] text-slate-500 hover:text-slate-350 hover:bg-slate-800'
                }`}
                title={tender.is_bookmarked ? "Unpin Tender from workspace" : "Pin Tender to workspace"}
              >
                <Star size={14} className={tender.is_bookmarked ? 'fill-amber-550' : ''} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#94A3B8]">
              <span>Value: <strong className="text-[#F8FAFC]">Rs. {tender.value.toFixed(1)} Cr</strong></span>
              <span>•</span>
              <span>EMD: <strong className="text-[#F8FAFC]">Rs. {tender.EMD.toFixed(1)} L</strong></span>
              <span>•</span>
              <span>Submission Limit: <strong className="text-[#F8FAFC]">{tender.submission_deadline || 'N/A'}</strong></span>
            </div>
          </div>

          {/* AI suitability badges */}
          <div className="flex flex-wrap gap-3 shrink-0">
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-center w-24">
              <span className="text-[8px] font-bold text-[#94A3B8] uppercase block">AI Match Score</span>
              <span className="text-lg font-black text-[#10B981] block mt-0.5">{eligibilityScore}%</span>
            </div>
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-center w-24">
              <span className="text-[8px] font-bold text-[#94A3B8] uppercase block">Verdict</span>
              <span className={`text-xs font-black block mt-2 px-1.5 py-0.5 rounded uppercase ${
                eligibilityScore >= 75 ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#EF4444]/15 text-[#EF4444]'
              }`}>
                {eligibilityScore >= 75 ? 'Go Bid' : 'No-Go'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 11 Workspace Navigation tabs */}
      <div className="flex gap-2 border-b border-[#334155] pb-px overflow-x-auto">
        {workspaceTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${
                isActive
                  ? 'border-[#6366F1] text-[#6366F1] font-bold'
                  : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Viewport for Active Tab */}
      <div className="bg-[#111827] border border-[#334155] rounded-xl p-8 min-h-[450px]">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#1E293B] border border-[#334155] p-6 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">AI Executive Synopsis</h3>
                <p className="text-xs leading-relaxed text-[#94A3B8]">{tender.summary || 'Summary clauses index pending...'}</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-[#1E293B] border border-[#334155] p-4 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-[#94A3B8] uppercase block">Eligibility Score</span>
                  <span className="text-2xl font-black text-[#10B981] mt-1.5 block">{eligibilityScore}%</span>
                </div>
                <div className="bg-[#1E293B] border border-[#334155] p-4 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-[#94A3B8] uppercase block">Risk Index</span>
                  <span className="text-2xl font-black text-[#F59E0B] mt-1.5 block">{riskIndex}%</span>
                </div>
                <div className="bg-[#1E293B] border border-[#334155] p-4 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-[#94A3B8] uppercase block">Bid Readiness Index</span>
                  <span className="text-2xl font-black text-[#6366F1] mt-1.5 block">{readinessIndex}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#1E293B] border border-[#334155] p-6 rounded-xl space-y-4 text-left">
                <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider block">Requirements Deficit</span>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Missing Documents</span>
                    <span className="font-bold text-[#EF4444] bg-[#EF4444]/15 px-2 py-0.5 rounded">{missingDocsCount} files</span>
                  </div>
                  <div className="space-y-2 border-t border-[#334155] pt-3.5">
                    {tender.checklist.filter(c => c.status !== 'uploaded').map(c => (
                      <div key={c.id} className="flex items-center gap-2 text-xs text-[#94A3B8]">
                        <AlertTriangle size={12} className="text-[#F59E0B]" />
                        <span>{c.document_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#1E293B] border border-[#334155] p-6 rounded-xl space-y-4 text-left">
                <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider block">Similar Projects References</span>
                <div className="space-y-3">
                  {similarTenders.length > 0 ? (
                    similarTenders.map(t => (
                      <div key={t.tender_id} className="flex justify-between items-center text-xs border-b border-[#334155]/60 pb-2">
                        <span className="text-[#94A3B8] truncate max-w-[160px]">{t.title}</span>
                        <span className="font-bold text-[#10B981] bg-[#10B981]/15 px-1.5 py-0.5 rounded text-[10px] shrink-0 font-mono">
                          {Math.round(t.similarity_score * 100)}% Match
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 block">No matching historic projects found in archives.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TENDER PDF TAB */}
        {activeTab === 'pdf' && (
          <div className="bg-[#0F172A] border border-[#334155] p-12 rounded-xl text-center space-y-4">
            <FileText size={48} className="text-[#94A3B8] mx-auto" />
            <h4 className="font-bold text-[#F8FAFC] text-sm">Specification PDF Viewer</h4>
            <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
              Scanned OCR indexing has finalized. Highlight layers mapped for {tender.clauses.length} critical clauses.
            </p>
            <div className="border border-[#334155] rounded-xl p-4 bg-[#1E293B] text-[10px] font-mono text-left max-w-xl mx-auto overflow-y-auto h-40">
              <span className="text-indigo-400 font-bold block mb-1">[OCR LINE HIGHLIGHTS]</span>
              <span>1. Clause 4.1: Technical turnover limit of Rs 400 Cr minimum.<br/>2. Clause 8.2: EMD deposit requirement Rs 50 Lakh valid for 180 days.<br/>3. Clause 14.5: Liquidated damages penalized at 0.5% per week delay.</span>
            </div>
          </div>
        )}

        {/* CLAUSE EXPLORER TAB */}
        {activeTab === 'explorer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left list */}
            <div className="lg:col-span-5 space-y-3 max-h-[400px] overflow-y-auto pr-2 text-left">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Indexed Clauses</span>
              {tender.clauses.map((c, idx) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedClauseId(c.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedClauseId === c.id
                      ? 'bg-[#6366F1]/10 border-[#6366F1] text-indigo-400'
                      : 'bg-[#1E293B] border-[#334155] text-slate-350 hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 text-xs font-bold">
                    <span className="truncate">{c.category}</span>
                    <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[#94A3B8] shrink-0 font-mono">Pg. {idx + 2}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block truncate font-mono">{c.clause_text}</span>
                </div>
              ))}
            </div>

            {/* Right explanation panel */}
            <div className="lg:col-span-7 bg-[#1E293B] border border-[#334155] p-6 rounded-xl text-left">
              {selectedClauseId ? (() => {
                const activeClause = tender.clauses.find(c => c.id === selectedClauseId);
                const clauseIndex = tender.clauses.findIndex(c => c.id === selectedClauseId);
                if (!activeClause) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-[#334155] pb-3">
                      <h4 className="font-bold text-xs text-[#F8FAFC]">{activeClause.category}</h4>
                      <span className="text-[10px] text-[#94A3B8]">Page {clauseIndex + 2} Reference</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-[#94A3B8] uppercase block">Extracted Text</span>
                      <p className="text-xs bg-[#0F172A] border border-[#334155] p-3 rounded-lg text-slate-300 leading-relaxed font-mono">
                        {activeClause.clause_text}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase block">AI Synopsis Analysis</span>
                      <p className="text-xs text-[#94A3B8] leading-relaxed font-mono">
                        {activeClause.explanation}
                      </p>
                    </div>
                  </div>
                );
              })() : (
                <div className="flex flex-col items-center justify-center h-full text-slate-550 min-h-[300px]">
                  <Search size={24} className="mb-2" />
                  <span className="text-xs">Select any clause on the left pane to explore AI breakdown</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ELIGIBILITY TAB */}
        {activeTab === 'eligibility' && (
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">Compliance Matrix Comparison</h3>
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-[#F8FAFC]">
                <thead className="bg-[#111827] text-[#94A3B8] font-bold uppercase tracking-wider text-[9px] border-b border-[#334155]">
                  <tr>
                    <th className="px-6 py-4">Constraint Requirement</th>
                    <th className="px-6 py-4">Company Parameters</th>
                    <th className="px-6 py-4">Audit Status</th>
                    <th className="px-6 py-4 text-right font-mono">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]/60 text-[#94A3B8]">
                  <tr>
                    <td className="px-6 py-4 font-bold text-[#F8FAFC]">Turnover Limit: Rs. 400 Cr minimum</td>
                    <td className="px-6 py-4">Rs. 1,450 Cr Average</td>
                    <td className="px-6 py-4"><span className="text-[#10B981] font-bold bg-[#10B981]/15 px-2 py-0.5 rounded text-[10px]">PASS</span></td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-450">98%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold text-[#F8FAFC]">Class-A Contractor Registration</td>
                    <td className="px-6 py-4">Class-A Unlimited license active</td>
                    <td className="px-6 py-4"><span className="text-[#10B981] font-bold bg-[#10B981]/15 px-2 py-0.5 rounded text-[10px]">PASS</span></td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-450">95%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold text-[#F8FAFC]">Similar completed bridges: 2 minimum</td>
                    <td className="px-6 py-4">12 completed projects</td>
                    <td className="px-6 py-4"><span className="text-[#10B981] font-bold bg-[#10B981]/15 px-2 py-0.5 rounded text-[10px]">PASS</span></td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-450">94%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RISK ANALYSIS TAB */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">Indexed Risks & Mitigation Strategies</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#1E293B] border border-[#334155] p-5 rounded-xl space-y-3">
                <div className="flex justify-between items-center border-b border-[#334155] pb-2">
                  <h4 className="font-bold text-xs text-[#F8FAFC]">Financial Penalties (Clause 14.5)</h4>
                  <span className="text-[9px] bg-[#EF4444]/15 text-[#EF4444] font-bold px-2 py-0.5 rounded">High Severity</span>
                </div>
                <p className="text-xs text-[#94A3B8]">Liquidated damages are charged at 0.5% per week delay, capped at 10% maximum contract value.</p>
                <div className="bg-[#0F172A] border border-[#334155] p-3 rounded-lg text-xs">
                  <span className="text-indigo-400 font-bold block mb-1">Mitigation Proposal</span>
                  <span className="text-slate-400">Implement Primavera sequence tracking with 15-day buffers on structural concrete supply lines.</span>
                </div>
              </div>

              <div className="bg-[#1E293B] border border-[#334155] p-5 rounded-xl space-y-3">
                <div className="flex justify-between items-center border-b border-[#334155] pb-2">
                  <h4 className="font-bold text-xs text-[#F8FAFC]">Legal Escalations (Clause 18)</h4>
                  <span className="text-[9px] bg-[#F59E0B]/15 text-[#F59E0B] font-bold px-2 py-0.5 rounded">Medium Severity</span>
                </div>
                <p className="text-xs text-[#94A3B8]">Dispute resolution mandates sole arbitration under governmental panel jurisdiction, no third-party mediation.</p>
                <div className="bg-[#0F172A] border border-[#334155] p-3 rounded-lg text-xs">
                  <span className="text-indigo-400 font-bold block mb-1">Mitigation Proposal</span>
                  <span className="text-slate-400">Escalate pre-bid questionnaire queries during official pre-bid meeting.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BID READINESS TAB */}
        {activeTab === 'readiness' && (
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">Required Document Submission Logs</h3>
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-[#F8FAFC]">
                <thead className="bg-[#111827] text-[#94A3B8] font-bold uppercase tracking-wider text-[9px] border-b border-[#334155]">
                  <tr>
                    <th className="px-6 py-4">Document Title</th>
                    <th className="px-6 py-4">Required Format</th>
                    <th className="px-6 py-4">Upload Status</th>
                    <th className="px-6 py-4 text-right">Toggle Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]/60 text-[#94A3B8]">
                  {tender.checklist.map((item) => (
                    <tr key={item.id} className="hover:bg-[#111827]/40 transition-all duration-150">
                      <td className="px-6 py-4 font-bold text-[#F8FAFC]">{item.document_name}</td>
                      <td className="px-6 py-4 font-mono text-[10px]">Signed PDF / Affidavit</td>
                      <td className="px-6 py-4">
                        {item.status === 'uploaded' ? (
                          <span className="text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded font-bold text-[9px] uppercase">Ready</span>
                        ) : (
                          <span className="text-[#EF4444] bg-[#EF4444]/15 px-2 py-0.5 rounded font-bold text-[9px] uppercase">Missing</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleChecklist(item)}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                        >
                          {item.status === 'uploaded' ? 'Flag Deficit' : 'Mark Uploaded'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PROPOSAL GENERATOR TAB */}
        {activeTab === 'proposal' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4">
              <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider block">Drafting Selection</span>
              {[
                { id: 'technical', label: 'Technical Qualifications Bid', desc: 'Cover sheet, licenses, turnovers & past projects references' },
                { id: 'methodology', label: 'Method Statement Plan', desc: 'Concrete staging, safety clearances & mobilization flow' },
                { id: 'safety', label: 'Site Safety Requisites', desc: 'OHSAS guidelines compliance, risk checks and first-aid charts' },
                { id: 'financial', label: 'BOQ Sheet Estimates', desc: 'Pricing distribution outlines and bid parameters' }
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedProposalType(opt.id as any)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedProposalType === opt.id
                      ? 'bg-[#6366F1]/10 border-[#6366F1] text-indigo-400'
                      : 'bg-[#1E293B] border-[#334155] text-slate-350 hover:border-slate-500'
                  }`}
                >
                  <span className="font-bold text-xs block text-[#F8FAFC]">{opt.label}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">{opt.desc}</span>
                </div>
              ))}

              <button
                onClick={generateProposalDraft}
                disabled={generatingProposal}
                className="w-full bg-[#6366F1] hover:bg-indigo-650 text-white rounded-lg py-2.5 text-xs font-bold transition-all mt-4 disabled:opacity-50"
              >
                {generatingProposal ? 'Running Proposal Models...' : 'Synthesize Proposal Documents'}
              </button>
            </div>

            <div className="lg:col-span-8 bg-[#1E293B] border border-[#334155] p-6 rounded-xl flex flex-col justify-between">
              <div className="space-y-2 flex-1">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">AI Draft Output</span>
                {proposalOutput ? (
                  <pre className="text-xs bg-[#0F172A] border border-[#334155] p-4 rounded-lg text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto text-left">
                    {proposalOutput}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-550 border-2 border-dashed border-[#334155] rounded-lg">
                    <PenTool size={28} className="mb-2" />
                    <span className="text-xs">Click synthesize to generate compliance drafting</span>
                  </div>
                )}
              </div>

              {proposalOutput && !generatingProposal && (
                <div className="flex justify-end gap-3 mt-4">
                  <button className="bg-slate-900 border border-[#334155] hover:bg-slate-800 text-xs px-4 py-2 rounded-lg font-bold">Download DOCX</button>
                  <button className="bg-[#6366F1] text-xs px-4 py-2 rounded-lg font-bold text-white">Download PDF</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            {/* Chat Frame scroll */}
            <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-4 h-80 overflow-y-auto space-y-4">
              {chatLog.map((log, idx) => (
                <div key={idx} className={`flex ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed text-left ${
                    log.sender === 'user'
                      ? 'bg-[#6366F1] text-white'
                      : 'bg-[#1E293B] border border-[#334155] text-slate-300'
                  }`}>
                    <span>{log.text}</span>
                    {log.references && log.references.length > 0 && (
                      <div className="mt-3.5 border-t border-[#334155]/60 pt-2 text-[9px] text-slate-500">
                        <strong className="block text-indigo-400 font-bold uppercase mb-1">Knowledge References:</strong>
                        {log.references.map(ref => (
                          <div key={ref}>• {ref}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Prompt input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask AI context questions (e.g. Turnovers criteria? EMD terms?)"
                className="flex-1 bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2.5 text-xs text-[#F8FAFC] outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="bg-[#6366F1] hover:bg-indigo-650 text-white rounded-lg px-5 py-2.5 text-xs font-bold transition-all disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {/* CORRIGENDUM TAB */}
        {activeTab === 'corrigendum' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">Corrigenda Diff Log</h3>
              <div className="bg-[#1E293B] border border-[#334155] p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-[#334155] pb-2">
                  <span className="text-xs font-bold text-[#F8FAFC]">Version 2 Addendum (Approved)</span>
                  <span className="text-[9px] bg-[#10B981]/15 text-[#10B981] font-bold px-2 py-0.5 rounded">Active</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="text-[#EF4444]">- Submission Deadline: 2026-07-28</div>
                  <div className="text-[#10B981]">+ Submission Deadline: 2026-09-15</div>
                  <div className="text-[#10B981]">+ Clause 8.2 revised EMD reduction to Rs. 40 L</div>
                </div>
              </div>
            </div>

            <div className="bg-[#1E293B] border border-[#334155] p-6 rounded-xl space-y-4">
              <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider block">Add Corrigendum PDF</span>
              <form onSubmit={handleAmendmentUpload} className="space-y-4">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#334155] hover:border-[#6366F1]/55 rounded-xl p-6 cursor-pointer bg-[#0F172A] transition-all">
                  <Upload size={20} className="text-[#94A3B8] mb-2" />
                  <span className="text-[11px] font-bold text-slate-300">Select Corrigendum PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setAmendmentFile(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                  />
                </label>
                {amendmentFile && (
                  <span className="text-[10px] text-indigo-400 font-mono block truncate">Selected: {amendmentFile.name}</span>
                )}
                {amendmentSuccess && (
                  <span className="text-[10px] text-[#10B981] block">{amendmentSuccess}</span>
                )}
                <button
                  type="submit"
                  disabled={amendmentUploading || !amendmentFile}
                  className="w-full bg-[#6366F1] hover:bg-indigo-650 text-white rounded-lg py-2 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {amendmentUploading ? 'Analyzing addenda...' : 'Upload & Diff Addendum'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">Related Specifications files</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: 'Tender_Specs_Bridges_Viaducts.pdf', size: '44.8 MB', date: '2026-06-15' },
                { name: 'BOQ_Estimate_Quantities_Calculations.xlsx', size: '2.1 MB', date: '2026-06-15' },
                { name: 'General_Conditions_Of_Contract_NHAI.pdf', size: '12.4 MB', date: '2026-06-15' }
              ].map(f => (
                <div key={f.name} className="bg-[#1E293B] border border-[#334155] p-4 rounded-xl flex items-center justify-between">
                  <div className="space-y-1 overflow-hidden">
                    <span className="font-bold text-xs text-[#F8FAFC] block truncate">{f.name}</span>
                    <span className="text-[9px] text-slate-500 block">{f.size} • {f.date}</span>
                  </div>
                  <FileText className="text-indigo-400 shrink-0" size={18} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVITY LOG TAB */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">Tender Analysis History Audit</h3>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-[#334155]/60 pb-3">
                <div>
                  <span className="font-bold text-[#F8FAFC] block">AI Analysis Completed</span>
                  <span className="text-[#94A3B8] mt-0.5 block">OCR parsed 15 clauses with 98% confidence score index</span>
                </div>
                <span className="text-[10px] text-slate-550 font-mono">2026-07-17 18:22</span>
              </div>
              <div className="flex justify-between items-start border-b border-[#334155]/60 pb-3">
                <div>
                  <span className="font-bold text-[#F8FAFC] block">Manual Checklist Update</span>
                  <span className="text-[#94A3B8] mt-0.5 block">Marked GST affidavit files as uploaded</span>
                </div>
                <span className="text-[10px] text-slate-550 font-mono">2026-07-17 17:55</span>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-[#F8FAFC] block">Tender Specifications uploaded</span>
                  <span className="text-[#94A3B8] mt-0.5 block">Initial PDF uploaded by admin</span>
                </div>
                <span className="text-[10px] text-slate-550 font-mono">2026-07-17 14:18</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
