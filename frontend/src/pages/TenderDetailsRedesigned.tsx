import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Bookmark, CheckCircle2, CircleAlert, ClipboardCheck, Download,
  FileText, History, LoaderCircle, MessageCircle, Paperclip, Send, ShieldAlert,
  Pencil, Sparkles, Star, Trash2, Upload, UserRound, XCircle,
} from 'lucide-react';
import { api, type Tender, type DocumentChecklist } from '../services/api';

interface TenderDetailsProps {
  tenderId: number;
  onBack: () => void;
  onPinToggle?: (id: number) => void;
}

type TenderTab = 'overview' | 'requirements' | 'pdf' | 'documents' | 'corrigenda' | 'assistant';
type ChatEntry = { sender: 'user' | 'ai'; text: string; references?: string[] };
type ChatSession = { id: string; title: string; updatedAt: number; messages: ChatEntry[] };

const chatStorageKey = (tenderId: number) => `tndrlens:tender-chat:${tenderId}`;
const makeChatSession = (): ChatSession => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: 'New conversation', updatedAt: Date.now(), messages: [] });
const chatDateLabel = (timestamp: number) => new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(new Date(timestamp));

const panelClass = 'rounded-xl border border-slate-border bg-surface';
const subPanelClass = 'rounded-lg border border-slate-border bg-card-bg';

const formatDate = (value?: string) => {
  if (!value) return 'Not provided';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

const parseArray = <T,>(value?: string): T[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
};

const renderAssistantText = (text: string) => text.split('\n').map((line, index) => {
  const content = line.replace(/^\s*[-*]\s+/, '');
  const parts = content.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={partIndex} className="font-semibold text-[var(--text-color)]">{part.slice(2, -2)}</strong>
      : part,
  );
  if (/^\s*[-*]\s+/.test(line)) return <div key={index} className="flex gap-2"><span className="text-accent">•</span><span>{parts}</span></div>;
  return <React.Fragment key={index}>{parts}{index < text.split('\n').length - 1 ? <br /> : null}</React.Fragment>;
});

const statusStyles: Record<string, string> = {
  PASS: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
  FAIL: 'border-rose-500/25 bg-rose-500/10 text-rose-400',
  WARN: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
  uploaded: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
  vault_matched: 'border-sky-500/25 bg-sky-500/10 text-sky-400',
  missing: 'border-rose-500/25 bg-rose-500/10 text-rose-400',
};

export const TenderDetailsRedesigned: React.FC<TenderDetailsProps> = ({ tenderId, onBack, onPinToggle }) => {
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TenderTab>('overview');
  const [selectedClauseId, setSelectedClauseId] = useState<number | null>(null);
  const [requirementFilter, setRequirementFilter] = useState<'all' | 'gaps'>('all');
  const [amendmentFile, setAmendmentFile] = useState<File | null>(null);
  const [amendmentUploading, setAmendmentUploading] = useState(false);
  const [amendmentMessage, setAmendmentMessage] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [renamingChatId, setRenamingChatId] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hydratedChatsForTender = useRef<number | null>(null);
  const activeChat = chatSessions.find((session) => session.id === activeChatId) ?? null;
  const chatLog = activeChat?.messages ?? [];

  useEffect(() => {
    hydratedChatsForTender.current = null;
    let sessions: ChatSession[] = [];
    try {
      const saved = localStorage.getItem(chatStorageKey(tenderId));
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      if (Array.isArray(parsed)) sessions = parsed.filter((item): item is ChatSession => item && typeof item.id === 'string' && typeof item.title === 'string' && Array.isArray(item.messages));
    } catch {
      sessions = [];
    }
    if (!sessions.length) sessions = [makeChatSession()];
    setChatSessions(sessions);
    setActiveChatId(sessions[0].id);
    setChatMessage('');
    hydratedChatsForTender.current = tenderId;
  }, [tenderId]);

  useEffect(() => {
    if (hydratedChatsForTender.current !== tenderId || !chatSessions.length) return;
    try {
      localStorage.setItem(chatStorageKey(tenderId), JSON.stringify(chatSessions));
    } catch {
      // The chat remains usable when browser storage is unavailable or full.
    }
  }, [chatSessions, tenderId]);

  const loadTender = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getTender(tenderId);
      setTender(data);
      setSelectedClauseId(data.clauses[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load this tender.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab('overview');
    setTender(null);
    void loadTender();
  }, [tenderId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  useEffect(() => {
    if (activeTab !== 'pdf' || !tender?.file_path) {
      setPdfUrl('');
      setPdfError('');
      return;
    }
    let active = true;
    let objectUrl = '';
    setPdfLoading(true);
    setPdfError('');
    api.getTenderDocument(tenderId).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);
    }).catch((pdfLoadError) => {
      if (active) setPdfError(pdfLoadError instanceof Error ? pdfLoadError.message : 'Could not load the tender PDF.');
    }).finally(() => {
      if (active) setPdfLoading(false);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeTab, tender?.file_path, tenderId]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Bookmark },
    { id: 'requirements', label: 'Requirements', icon: ClipboardCheck },
    { id: 'pdf', label: 'Tender PDF', icon: FileText },
    { id: 'documents', label: 'Documents', icon: Paperclip },
    { id: 'corrigenda', label: 'Corrigenda', icon: History },
    { id: 'assistant', label: 'AI assistant', icon: MessageCircle },
  ] as const;

  const actionPlan = useMemo(() => parseArray<string>(tender?.action_plan_json), [tender?.action_plan_json]);
  const clauses = tender?.clauses ?? [];
  const filteredClauses = clauses.filter((clause) => requirementFilter === 'all' || clause.status !== 'PASS');
  const selectedClause = filteredClauses.find((clause) => clause.id === selectedClauseId) ?? filteredClauses[0] ?? null;
  const checklist = tender?.checklist ?? [];
  const completedDocuments = checklist.filter((item) => item.status === 'uploaded' || item.status === 'vault_matched').length;
  const missingDocuments = checklist.length - completedDocuments;
  const failedClauses = clauses.filter((clause) => clause.status === 'FAIL').length;
  const verdict = tender?.go_no_go_verdict || 'Pending';

  const handlePin = async () => {
    if (!tender || pinLoading) return;
    setPinLoading(true);
    try {
      if (onPinToggle) {
        await onPinToggle(tender.id);
        setTender({ ...tender, is_bookmarked: !tender.is_bookmarked });
      } else {
        const result = await api.toggleBookmark(tender.id);
        setTender({ ...tender, is_bookmarked: result.is_bookmarked });
      }
    } catch {
      setError('Could not update the saved-tender status. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleChecklistToggle = async (item: DocumentChecklist) => {
    if (!tender) return;
    const nextStatus = item.status === 'uploaded' ? 'missing' : 'uploaded';
    try {
      const updated = await api.updateChecklist(tenderId, item.id, nextStatus, nextStatus === 'uploaded' ? 'MANUAL' : '');
      setTender({ ...tender, checklist: tender.checklist.map((current) => current.id === item.id ? updated : current) });
    } catch {
      setError('Could not update the checklist. Please try again.');
    }
  };

  const handleAmendmentUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!amendmentFile) return;
    setAmendmentUploading(true);
    setAmendmentMessage('');
    try {
      await api.uploadAmendment(tenderId, amendmentFile);
      setAmendmentMessage('Corrigendum uploaded and analyzed.');
      setAmendmentFile(null);
      const refreshed = await api.getTender(tenderId);
      setTender(refreshed);
    } catch (uploadError) {
      setAmendmentMessage(uploadError instanceof Error ? uploadError.message : 'Could not process this corrigendum.');
    } finally {
      setAmendmentUploading(false);
    }
  };

  const sendQuestion = async (value: string) => {
    const question = value.trim();
    const chatId = activeChatId;
    if (!question || chatLoading || !chatId) return;
    setChatMessage('');
    const appendToSession = (entry: ChatEntry) => setChatSessions((sessions) => sessions.map((session) => session.id === chatId ? {
      ...session,
      title: session.title === 'New conversation' && entry.sender === 'user' ? question.slice(0, 52) : session.title,
      updatedAt: Date.now(),
      messages: [...session.messages, entry],
    } : session));
    appendToSession({ sender: 'user', text: question });
    setChatLoading(true);
    try {
      const response = await api.chat(tenderId, question);
      appendToSession({ sender: 'ai', text: response.answer, references: response.references });
    } catch {
      appendToSession({ sender: 'ai', text: 'The assistant could not reach the analysis service. Please try again shortly.' });
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendQuestion(chatMessage);
  };

  const startNewChat = () => {
    if (chatLoading) return;
    const session = makeChatSession();
    setChatSessions((sessions) => [session, ...sessions]);
    setActiveChatId(session.id);
    setChatMessage('');
  };

  const beginRenameChat = () => {
    if (!activeChat || chatLoading) return;
    setRenamingChatId(activeChat.id);
    setRenameValue(activeChat.title);
  };

  const saveChatRename = () => {
    const title = renameValue.trim();
    if (!title || !renamingChatId) return;
    setChatSessions((sessions) => sessions.map((session) => session.id === renamingChatId ? { ...session, title, updatedAt: Date.now() } : session));
    setRenamingChatId('');
  };

  const deleteChat = () => {
    if (!activeChat || chatLoading || !window.confirm(`Delete “${activeChat.title}”? This chat will be removed from this browser.`)) return;
    const remaining = chatSessions.filter((session) => session.id !== activeChat.id);
    const nextSessions = remaining.length ? remaining : [makeChatSession()];
    setChatSessions(nextSessions);
    setActiveChatId(nextSessions[0].id);
    setChatMessage('');
    setRenamingChatId('');
  };

  if (loading) return <div className="flex min-h-80 items-center justify-center gap-3 text-sm text-slate-400"><LoaderCircle size={20} className="animate-spin text-accent" />Loading tender analysis…</div>;
  if (error && !tender) return <div className={`${panelClass} mx-auto max-w-2xl p-8 text-center`}><CircleAlert className="mx-auto text-rose-400" /><h2 className="mt-3 text-lg font-semibold text-[var(--text-color)]">Tender could not be opened</h2><p className="mt-2 text-sm text-slate-400">{error}</p><div className="mt-5 flex justify-center gap-2"><button onClick={onBack} className="rounded-lg border border-slate-border px-3 py-2 text-sm text-[var(--text-color)]">Back to tenders</button><button onClick={() => void loadTender()} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">Retry</button></div></div>;
  if (!tender) return null;

  const verdictStyle = verdict.toLowerCase().includes('no') ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : verdict.toLowerCase().includes('cautious') ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
  const metricCard = (label: string, value: string, help: string, icon: React.ReactNode) => (
    <div className={`${subPanelClass} p-4`}><div className="flex items-center justify-between text-slate-400"><span className="text-xs font-medium">{label}</span>{icon}</div><p className="mt-3 text-xl font-semibold tracking-tight text-[var(--text-color)]">{value}</p><p className="mt-1 text-xs text-slate-400">{help}</p></div>
  );

  return (
    <main className="space-y-5 text-left">
      <header className={`${panelClass} p-5 sm:p-6`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-[var(--text-color)]"><ArrowLeft size={16} /> Tenders</button>
          <button type="button" onClick={() => void handlePin()} disabled={pinLoading} aria-pressed={tender.is_bookmarked} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${tender.is_bookmarked ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-slate-border text-slate-400 hover:text-[var(--text-color)]'}`}>
            <Star size={15} className={tender.is_bookmarked ? 'fill-current' : ''} />{tender.is_bookmarked ? 'Saved' : 'Save tender'}
          </button>
        </div>
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div className="min-w-0 max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">{tender.organization || 'Issuing authority not listed'}</p>
            <h1 className="mt-2 text-2xl font-semibold leading-snug tracking-tight text-[var(--text-color)] sm:text-3xl">{tender.title}</h1>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
              <span>Estimated value <strong className="text-[var(--text-color)]">₹{Number(tender.value || 0).toLocaleString('en-IN')} Cr</strong></span>
              <span>EMD <strong className="text-[var(--text-color)]">₹{Number(tender.EMD || 0).toLocaleString('en-IN')} L</strong></span>
              <span>Submission deadline <strong className="text-[var(--text-color)]">{formatDate(tender.submission_deadline)}</strong></span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <div className="min-w-28 rounded-lg border border-slate-border bg-card-bg px-4 py-3"><p className="text-xs text-slate-400">Bid readiness</p><p className="mt-1 text-xl font-semibold text-[var(--text-color)]">{Math.round(tender.bid_readiness_score || 0)}%</p></div>
            <div className={`min-w-28 rounded-lg border px-4 py-3 ${verdictStyle}`}><p className="text-xs opacity-80">Recommendation</p><p className="mt-1 text-base font-semibold">{verdict}</p></div>
          </div>
        </div>
      </header>

      <nav aria-label="Tender sections" className="flex gap-1 overflow-x-auto border-b border-slate-border">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => { setActiveTab(id); setError(''); }} aria-current={activeTab === id ? 'page' : undefined}
          className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${activeTab === id ? 'border-accent text-accent' : 'border-transparent text-slate-400 hover:text-[var(--text-color)]'}`}><Icon size={15} />{label}{id === 'requirements' && <span className="rounded-full bg-card-bg px-1.5 text-xs">{clauses.length}</span>}{id === 'documents' && <span className="rounded-full bg-card-bg px-1.5 text-xs">{checklist.length}</span>}</button>)}
      </nav>

      {error && tender && <div role="status" className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}<button type="button" onClick={() => setError('')} className="ml-3 underline">Dismiss</button></div>}

      {activeTab === 'overview' && <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCard('Suitability score', `${Math.round(tender.suitability_score || 0)}%`, 'Based on company profile and analyzed criteria', <CheckCircle2 size={16} />)}
          {metricCard('Risk score', `${Math.round(tender.overall_risk_score || 0)}%`, 'Higher score indicates more identified risk', <ShieldAlert size={16} />)}
          {metricCard('Requirements', `${clauses.filter((clause) => clause.status === 'PASS').length}/${clauses.length}`, `${failedClauses} criteria need attention`, <ClipboardCheck size={16} />)}
          {metricCard('Documents', `${completedDocuments}/${checklist.length}`, `${missingDocuments} outstanding`, <Paperclip size={16} />)}
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
          <section className={`${panelClass} p-5`}><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-[var(--text-color)]">Tender summary</h2><p className="mt-1 text-xs text-slate-400">Extracted from the analyzed specification</p></div><span className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${tender.status === 'analyzed' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' : 'border-slate-border text-slate-400'}`}>{tender.status}</span></div><p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">{tender.summary || 'No summary is available for this tender yet.'}</p></section>
          <section className={`${panelClass} p-5`}><h2 className="text-base font-semibold text-[var(--text-color)]">Bid recommendation</h2><p className="mt-3 text-sm leading-6 text-slate-300">{tender.go_no_go_reason || 'A recommendation will appear after the tender analysis is complete.'}</p><div className="mt-4 flex items-center justify-between border-t border-slate-border pt-3 text-xs text-slate-400"><span>Analysis confidence</span><strong className="text-[var(--text-color)]">{Math.round((tender.confidence_score || 0) * 100)}%</strong></div></section>
        </div>
        <section className={`${panelClass} p-5`}><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-base font-semibold text-[var(--text-color)]">Recommended next steps</h2><p className="mt-1 text-xs text-slate-400">Generated from the current eligibility and document checks</p></div><button type="button" onClick={() => setActiveTab('requirements')} className="text-xs font-medium text-accent hover:underline">Review requirements</button></div>
          {actionPlan.length ? <ol className="grid gap-2 md:grid-cols-2">{actionPlan.map((action, index) => <li key={`${index}-${action}`} className="flex items-start gap-3 rounded-lg border border-slate-border bg-card-bg p-3 text-sm leading-5 text-slate-300"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-accent">{index + 1}</span>{action.replace(/^Step\s*\d+\s*:\s*/i, '')}</li>)}</ol> : <p className="text-sm text-slate-400">No action plan is available yet.</p>}
        </section>
      </div>}

      {activeTab === 'requirements' && <section className={`${panelClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-border p-4 sm:px-5"><div><h2 className="font-semibold text-[var(--text-color)]">Eligibility requirements</h2><p className="mt-1 text-xs text-slate-400">Compare tender criteria with the company information on file.</p></div><div className="flex rounded-lg border border-slate-border p-1 text-xs"><button type="button" onClick={() => setRequirementFilter('all')} className={`rounded-md px-3 py-1.5 ${requirementFilter === 'all' ? 'bg-card-bg text-[var(--text-color)]' : 'text-slate-400'}`}>All ({clauses.length})</button><button type="button" onClick={() => setRequirementFilter('gaps')} className={`rounded-md px-3 py-1.5 ${requirementFilter === 'gaps' ? 'bg-card-bg text-[var(--text-color)]' : 'text-slate-400'}`}>Needs review ({clauses.length - clauses.filter((clause) => clause.status === 'PASS').length})</button></div></div>
        {clauses.length === 0 ? <div className="p-10 text-center text-sm text-slate-400">No extracted requirements are available for this tender.</div> : <div className="grid min-h-[430px] lg:grid-cols-[minmax(270px,0.85fr)_minmax(0,1.5fr)]">
          <div className="max-h-[620px] divide-y divide-[var(--border-color)] overflow-y-auto lg:border-r lg:border-slate-border">{filteredClauses.length ? filteredClauses.map((clause) => <button key={clause.id} type="button" onClick={() => setSelectedClauseId(clause.id)} className={`w-full p-4 text-left transition hover:bg-card-bg ${selectedClause?.id === clause.id ? 'bg-card-bg' : ''}`}><div className="flex items-start justify-between gap-2"><span className="text-sm font-medium text-[var(--text-color)]">{clause.category}</span><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyles[clause.status] || 'border-slate-border text-slate-400'}`}>{clause.status || 'REVIEW'}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{clause.clause_text}</p></button>) : <p className="p-5 text-sm text-slate-400">No criteria need review.</p>}</div>
          <div className="p-5 sm:p-6">{selectedClause ? <div className="space-y-5"><div><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-accent">{selectedClause.category}</span><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[selectedClause.status] || 'border-slate-border text-slate-400'}`}>{selectedClause.status || 'Review'}</span></div><h3 className="mt-2 text-lg font-semibold leading-snug text-[var(--text-color)]">Requirement details</h3></div><div className="grid gap-3 sm:grid-cols-2"><div className={`${subPanelClass} p-4`}><p className="text-xs text-slate-400">Tender requirement</p><p className="mt-2 text-sm leading-5 text-[var(--text-color)]">{selectedClause.required_value || selectedClause.clause_text || 'Not specified'}</p></div><div className={`${subPanelClass} p-4`}><p className="text-xs text-slate-400">Company profile match</p><p className="mt-2 text-sm leading-5 text-[var(--text-color)]">{selectedClause.user_value || 'No matching company value recorded'}</p></div></div><div><p className="text-xs font-medium text-slate-400">Tender clause</p><p className="mt-2 whitespace-pre-line rounded-lg border border-slate-border bg-card-bg p-4 text-sm leading-6 text-slate-300">{selectedClause.clause_text}</p></div><div><p className="text-xs font-medium text-slate-400">Analysis note</p><p className="mt-2 text-sm leading-6 text-slate-300">{selectedClause.explanation || 'No additional explanation was returned for this requirement.'}</p></div><p className="text-xs text-slate-500">Analysis confidence: {Math.round((selectedClause.confidence || 0) * 100)}%</p></div> : <p className="text-sm text-slate-400">Select a requirement to inspect the details.</p>}</div>
        </div>}
      </section>}

      {activeTab === 'pdf' && <section className={`${panelClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-border p-4 sm:px-5"><div><h2 className="font-semibold text-[var(--text-color)]">Tender specification</h2><p className="mt-1 text-xs text-slate-400">Original uploaded document</p></div>{tender.file_path && <a href={pdfUrl || undefined} download className={`inline-flex items-center gap-2 rounded-lg border border-slate-border px-3 py-2 text-xs font-medium text-[var(--text-color)] ${pdfUrl ? '' : 'pointer-events-none opacity-50'}`}><Download size={14} />Download PDF</a>}</div>
        <div className="min-h-[520px] bg-card-bg">{pdfLoading ? <div className="flex min-h-[520px] items-center justify-center gap-2 text-sm text-slate-400"><LoaderCircle size={18} className="animate-spin" />Loading document…</div> : pdfError ? <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 p-6 text-center"><CircleAlert className="text-amber-400" size={28} /><p className="max-w-md text-sm text-slate-300">{pdfError}</p></div> : !tender.file_path ? <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 p-6 text-center"><FileText className="text-slate-400" size={32} /><h3 className="font-medium text-[var(--text-color)]">No tender PDF attached</h3><p className="max-w-md text-sm text-slate-400">This record doesn’t include an uploaded specification. Upload the source PDF from the Tender Workspace to view it here.</p></div> : pdfUrl ? <iframe title={`${tender.title} tender PDF`} src={pdfUrl} className="h-[72vh] min-h-[520px] w-full border-0 bg-white" /> : null}</div>
      </section>}

      {activeTab === 'documents' && <div className="space-y-5">
        <section className={`${panelClass} overflow-hidden`}><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-border p-4 sm:px-5"><div><h2 className="font-semibold text-[var(--text-color)]">Submission checklist</h2><p className="mt-1 text-xs text-slate-400">Track the documents required for this bid.</p></div><span className="text-xs text-slate-400">{completedDocuments} of {checklist.length} ready</span></div>
          {!checklist.length ? <div className="p-8 text-center text-sm text-slate-400">No document checklist was extracted for this tender.</div> : <div className="divide-y divide-[var(--border-color)]">{checklist.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5"><div className="flex min-w-0 items-start gap-3"><span className={`mt-0.5 rounded-full border p-1 ${statusStyles[item.status] || 'border-slate-border text-slate-400'}`}>{item.status === 'missing' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}</span><div className="min-w-0"><p className="text-sm font-medium text-[var(--text-color)]">{item.document_name}</p><p className="mt-1 text-xs text-slate-400">{item.matching_vault_doc ? `Matched to ${item.matching_vault_doc}` : `Required by ${formatDate(item.required_by_date)}`}</p></div></div><div className="flex items-center gap-3"><span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${statusStyles[item.status] || 'border-slate-border text-slate-400'}`}>{item.status === 'vault_matched' ? 'Vault matched' : item.status === 'uploaded' ? 'Uploaded' : 'Missing'}</span><button type="button" onClick={() => void handleChecklistToggle(item)} className="text-xs font-medium text-accent hover:underline">{item.status === 'uploaded' ? 'Mark missing' : 'Mark uploaded'}</button></div></div>)}</div>}
        </section>
        <section className={`${panelClass} p-4 sm:p-5`}><h2 className="font-semibold text-[var(--text-color)]">Source documents</h2><p className="mt-1 text-xs text-slate-400">Files attached to this tender record.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{tender.file_path ? <button type="button" onClick={() => setActiveTab('pdf')} className={`${subPanelClass} flex items-center gap-3 p-4 text-left hover:border-accent`}><FileText size={18} className="shrink-0 text-accent" /><span className="min-w-0"><span className="block truncate text-sm font-medium text-[var(--text-color)]">Tender specification PDF</span><span className="mt-1 block text-xs text-slate-400">Open original document</span></span></button> : <p className="text-sm text-slate-400">No source PDF is attached.</p>}{tender.amendments.map((amendment) => <div key={amendment.id} className={`${subPanelClass} flex items-start gap-3 p-4`}><Paperclip size={17} className="mt-0.5 shrink-0 text-slate-400" /><div className="min-w-0"><p className="text-sm font-medium text-[var(--text-color)]">{amendment.title}</p><p className="mt-1 line-clamp-2 text-xs text-slate-400">{amendment.changes_summary || 'Corrigendum uploaded'}</p><p className="mt-2 text-[11px] text-slate-500">{formatDate(amendment.date_uploaded)}</p></div></div>)}</div></section>
      </div>}

      {activeTab === 'corrigenda' && <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)]">
        <section className={`${panelClass} p-4 sm:p-5`}><h2 className="font-semibold text-[var(--text-color)]">Corrigenda history</h2><p className="mt-1 text-xs text-slate-400">Uploaded amendments and their extracted change summaries.</p>{tender.amendments.length ? <ol className="mt-5 space-y-3">{tender.amendments.map((amendment) => <li key={amendment.id} className={`${subPanelClass} p-4`}><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-sm font-medium text-[var(--text-color)]">{amendment.title}</h3><time className="text-xs text-slate-400">{formatDate(amendment.date_uploaded)}</time></div><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">{amendment.changes_summary || 'No change summary is available for this file.'}</p></li>)}</ol> : <div className="mt-5 rounded-lg border border-dashed border-slate-border p-8 text-center"><History className="mx-auto text-slate-400" size={24} /><p className="mt-3 text-sm font-medium text-[var(--text-color)]">No corrigenda uploaded</p><p className="mt-1 text-xs text-slate-400">Upload an official amendment PDF to record and analyze changes.</p></div>}</section>
        <section className={`${panelClass} p-4 sm:p-5`}><div className="flex items-center gap-2"><Upload size={16} className="text-accent" /><h2 className="font-semibold text-[var(--text-color)]">Add corrigendum</h2></div><p className="mt-1 text-xs text-slate-400">Choose the revised PDF issued by the tender authority.</p><form onSubmit={handleAmendmentUpload} className="mt-5 space-y-4"><label className="flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-slate-border bg-card-bg p-6 text-center hover:border-accent"><FileText size={22} className="text-slate-400" /><span className="mt-2 text-sm font-medium text-[var(--text-color)]">{amendmentFile?.name || 'Choose a PDF file'}</span><span className="mt-1 text-xs text-slate-400">PDF format</span><input type="file" accept="application/pdf,.pdf" onChange={(event) => setAmendmentFile(event.target.files?.[0] ?? null)} className="sr-only" /></label><button type="submit" disabled={!amendmentFile || amendmentUploading} className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{amendmentUploading ? 'Analyzing…' : 'Upload and compare'}</button>{amendmentMessage && <p role="status" className="text-sm text-slate-300">{amendmentMessage}</p>}</form></section>
      </div>}

      {activeTab === 'assistant' && (
        <section
          className={`${panelClass} flex flex-col overflow-hidden`}
          style={{ height: 'min(680px, calc(100vh - 390px))', minHeight: 440 }}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-border px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><Sparkles size={18} /></div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold text-[var(--text-color)]">Tender assistant</h2><span className="rounded-full border border-slate-border px-2 py-0.5 text-[10px] font-medium text-slate-400">Tender context</span></div>
                <p className="mt-0.5 truncate text-xs text-slate-400">Questions and answers for {tender.title}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {renamingChatId === activeChatId ? <>
                <input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') saveChatRename(); if (event.key === 'Escape') setRenamingChatId(''); }} aria-label="Chat name" className="w-32 rounded-md border border-slate-border bg-card-bg px-2 py-1.5 text-xs text-[var(--text-color)] outline-none focus:border-accent sm:w-44" />
                <button type="button" onClick={saveChatRename} disabled={!renameValue.trim()} className="rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50">Save</button>
                <button type="button" onClick={() => setRenamingChatId('')} className="rounded-md px-2 py-1.5 text-xs text-slate-400 hover:text-[var(--text-color)]">Cancel</button>
              </> : <>
                {activeChat && <button type="button" onClick={beginRenameChat} disabled={chatLoading} title="Rename chat" aria-label="Rename chat" className="inline-flex items-center gap-1.5 rounded-md border border-slate-border px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-accent/50 hover:text-[var(--text-color)] disabled:opacity-50"><Pencil size={13} /><span className="hidden md:inline">Rename</span></button>}
                {activeChat && <button type="button" onClick={deleteChat} disabled={chatLoading} title="Delete chat" aria-label="Delete chat" className="inline-flex items-center gap-1.5 rounded-md border border-slate-border px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:border-rose-500/40 hover:text-rose-400 disabled:opacity-50"><Trash2 size={13} /><span className="hidden md:inline">Delete</span></button>}
              </>}
              <button type="button" onClick={startNewChat} disabled={chatLoading} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-border px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-accent/50 hover:text-[var(--text-color)] disabled:opacity-50"><span className="text-base leading-none">+</span>New chat</button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-border bg-card-bg/20 sm:flex lg:w-64">
              <div className="border-b border-slate-border px-3 py-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Recent chats</p></div>
              <nav aria-label="Tender chat history" className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
                {[...chatSessions].sort((a, b) => b.updatedAt - a.updatedAt).map((session) => (
                  <button key={session.id} type="button" onClick={() => { if (!chatLoading) { setActiveChatId(session.id); setChatMessage(''); } }} aria-current={activeChatId === session.id ? 'page' : undefined} className={`block w-full rounded-lg border px-3 py-2.5 text-left transition ${activeChatId === session.id ? 'border-accent/30 bg-accent/10' : 'border-transparent hover:border-slate-border hover:bg-surface'}`}>
                    <span className={`block truncate text-xs font-medium ${activeChatId === session.id ? 'text-[var(--text-color)]' : 'text-slate-300'}`}>{session.title}</span>
                    <span className="mt-1 block truncate text-[10px] text-slate-500">{session.messages.length ? session.messages.filter((item) => item.sender === 'user').at(-1)?.text : 'No messages yet'}</span>
                    <span className="mt-1.5 block text-[10px] text-slate-500">{chatDateLabel(session.updatedAt)}</span>
                  </button>
                ))}
              </nav>
              <p className="border-t border-slate-border px-3 py-2 text-[10px] text-slate-500">Chats are saved in this browser.</p>
            </aside>

            <nav aria-label="Tender chat history" className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-border bg-card-bg/20 p-2 sm:hidden">
              {[...chatSessions].sort((a, b) => b.updatedAt - a.updatedAt).map((session) => <button key={session.id} type="button" onClick={() => { if (!chatLoading) { setActiveChatId(session.id); setChatMessage(''); } }} aria-current={activeChatId === session.id ? 'page' : undefined} className={`max-w-44 shrink-0 truncate rounded-md border px-2.5 py-1.5 text-xs ${activeChatId === session.id ? 'border-accent/40 bg-accent/10 text-[var(--text-color)]' : 'border-transparent text-slate-400'}`}>{session.title}</button>)}
            </nav>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-card-bg/20 p-4 sm:p-5">
            {chatLog.length === 0 ? (
              <div className="m-auto w-full max-w-2xl py-6">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Sparkles size={22} /></div>
                <h3 className="text-center text-lg font-semibold text-[var(--text-color)]">What would you like to know?</h3>
                <p className="mx-auto mt-1 max-w-lg text-center text-sm text-slate-400">Ask a question about this tender or start with one of these.</p>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {[
                    'Summarize the scope, value, EMD, and deadline.',
                    'Which eligibility requirements need attention?',
                    'What documents are required for submission?',
                    'What are the key risks and contract obligations?',
                  ].map((prompt) => <button key={prompt} type="button" onClick={() => void sendQuestion(prompt)} disabled={chatLoading} className="rounded-lg border border-slate-border bg-surface px-3.5 py-3 text-left text-sm text-slate-300 transition hover:border-accent/50 hover:bg-accent/5 disabled:opacity-50">{prompt}</button>)}
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 py-2">
                {chatLog.map((entry, index) => (
                  <div key={`${index}-${entry.sender}`} className={`flex items-start gap-2.5 ${entry.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${entry.sender === 'user' ? 'bg-accent text-white' : 'border border-slate-border bg-surface text-accent'}`}>{entry.sender === 'user' ? <UserRound size={14} /> : <Sparkles size={14} />}</div>
                    <div className={`min-w-0 max-w-[88%] rounded-xl border px-4 py-3 text-sm leading-6 ${entry.sender === 'user' ? 'border-accent/30 bg-accent/10 text-[var(--text-color)]' : 'border-slate-border bg-surface text-slate-300'}`}>
                      <div className="whitespace-pre-wrap">{entry.sender === 'ai' ? renderAssistantText(entry.text) : entry.text}</div>
                      {entry.references?.length ? <details className="mt-3 border-t border-slate-border pt-2 text-xs text-slate-400"><summary className="cursor-pointer select-none font-medium text-accent">Sources ({entry.references.length})</summary><ul className="mt-2 space-y-1.5 pl-4">{entry.references.map((reference) => <li key={reference} className="list-disc">{reference}</li>)}</ul></details> : null}
                    </div>
                  </div>
                ))}
                {chatLoading && <div className="flex items-center gap-2.5 text-xs text-slate-400"><div className="flex size-7 items-center justify-center rounded-full border border-slate-border bg-surface text-accent"><Sparkles size={14} /></div><span className="animate-pulse">Reviewing tender content…</span></div>}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="shrink-0 border-t border-slate-border bg-surface p-3 sm:px-5 sm:py-4">
            <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-xl border border-slate-border bg-card-bg p-2 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/10">
              <textarea rows={1} value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendQuestion(chatMessage); } }} placeholder="Ask a question about this tender…" className="max-h-28 min-h-10 min-w-0 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-[var(--text-color)] outline-none placeholder:text-slate-500" />
              <button type="submit" disabled={!chatMessage.trim() || chatLoading} aria-label="Send question" className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"><Send size={16} /></button>
            </div>
            <p className="mx-auto mt-2 max-w-4xl text-[11px] text-slate-500">AI responses can be inaccurate. Verify dates and obligations against the official tender documents.</p>
          </form>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};
