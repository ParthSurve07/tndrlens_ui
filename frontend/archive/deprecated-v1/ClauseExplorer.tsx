import React, { useState, useEffect } from 'react';
import { api, type Tender } from '../services/api';
import { Code, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

export const ClauseExplorer: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenderId, setSelectedTenderId] = useState<number | null>(null);
  
  const [activeClauseId, setActiveClauseId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setLoading(true);
        const data = await api.getTenders();
        setTenders(data);
        if (data.length > 0) {
          setSelectedTenderId(data[0].id);
          if (data[0].clauses.length > 0) {
            setActiveClauseId(data[0].clauses[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenders();
  }, []);

  const selectedTender = tenders.find(t => t.id === selectedTenderId);
  const activeClause = selectedTender?.clauses.find(c => c.id === activeClauseId);

  // Sync active clause when tender changes
  useEffect(() => {
    if (selectedTender && selectedTender.clauses.length > 0) {
      setActiveClauseId(selectedTender.clauses[0].id);
    } else {
      setActiveClauseId(null);
    }
  }, [selectedTenderId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900">
        <Code className="animate-spin text-indigo-500 mb-4" size={32} />
        <p className="text-slate-400 text-sm">Structuring split-pane workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden select-none">
      
      {/* Header toolbar */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950 shrink-0">
        <div className="flex items-center gap-3">
          <BookOpen className="text-indigo-400" size={18} />
          <h2 className="text-sm font-bold uppercase tracking-wider">AI Clause Explorer Studio</h2>
        </div>

        {tenders.length > 0 && (
          <select
            value={selectedTenderId || ''}
            onChange={(e) => setSelectedTenderId(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none w-80 shadow-md"
          >
            {tenders.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        )}
      </div>

      {selectedTender ? (
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANE: Table of Contents (300px) */}
          <div className="w-72 border-r border-slate-800 bg-slate-950/60 overflow-y-auto flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-slate-900 bg-slate-950/20">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Document Navigation</span>
            </div>
            
            <div className="p-2 space-y-1">
              {selectedTender.clauses.map((clause, idx) => (
                <button
                  key={clause.id}
                  onClick={() => setActiveClauseId(clause.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1.5 ${
                    activeClauseId === clause.id
                      ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400'
                      : 'hover:bg-slate-900/60 border border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] uppercase font-bold tracking-wider capitalize">{clause.category}</span>
                    <span className="text-[9px] font-mono text-slate-500">Page 0{idx + 1}</span>
                  </div>
                  <span className="text-xs truncate font-medium text-slate-300 w-full block">
                    {clause.clause_text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* MIDDLE PANE: Simulated PDF Reader (45% width) */}
          <div className="flex-1 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
            <div className="h-10 border-b border-slate-800 bg-slate-950/20 px-6 flex items-center justify-between text-[10px] text-slate-550 shrink-0">
              <span>PDF VIEWPORT SIMULATOR</span>
              <span>100% SCALE</span>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto font-mono text-[11px] text-slate-400 bg-slate-950/10 leading-relaxed custom-scrollbar select-text select-all">
              <div className="max-w-2xl mx-auto space-y-8 bg-slate-950 border border-slate-850 p-10 rounded-2xl shadow-xl min-h-[600px]">
                <div className="border-b border-slate-800 pb-4 text-center">
                  <h3 className="font-bold text-slate-200 tracking-wider text-xs">GOVERNMENT SPECIFICATION MANUAL</h3>
                  <span className="text-[9px] text-slate-500">SECTION 4 — GENERAL ELIGIBILITY CONTRACT CRITERIA</span>
                </div>
                
                <p>4.1 Bidders shall satisfy the pre-qualification guidelines detailing financial turnover scale, work experience credentials, heavy equipment assets, and documentation registries.</p>
                
                {selectedTender.clauses.map((clause, idx) => {
                  const isHighlighted = activeClauseId === clause.id;
                  return (
                    <div
                      key={clause.id}
                      className={`p-3.5 rounded-xl border transition-all duration-200 ${
                        isHighlighted
                          ? 'bg-indigo-950/40 border-indigo-500/40 text-slate-100 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/20'
                          : 'border-transparent text-slate-450 hover:bg-slate-900/10'
                      }`}
                    >
                      <span className="block text-[8px] font-bold text-slate-500 mb-1">CLAUSE REQUIREMENT 0{idx + 1} ({clause.category.toUpperCase()})</span>
                      <p className="italic">"{clause.clause_text}"</p>
                    </div>
                  );
                })}
                
                <p>4.3 All bids must enclose a valid Earnest Money Deposit (EMD) security receipt matching specified sums. Deficient bids will be rejected at startup.</p>
              </div>
            </div>
          </div>

          {/* RIGHT PANE: AI Explainability Auditor (350px) */}
          <div className="w-80 bg-slate-950/60 overflow-y-auto flex flex-col justify-between shrink-0">
            {activeClause ? (
              <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Audit Insights</span>
                    <span className="text-[9px] font-mono font-bold text-indigo-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {Math.round(activeClause.confidence * 100)}% Confidence
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Requirement Clause</span>
                      <p className="text-xs text-slate-200 leading-relaxed font-semibold italic bg-slate-900/40 border border-slate-900 p-3 rounded-xl">
                        "{activeClause.clause_text}"
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] text-indigo-400 uppercase font-bold tracking-wider block mb-1.5 flex items-center gap-1">
                        <Sparkles size={11} /> What It Means
                      </span>
                      <p className="text-xs text-slate-350 leading-relaxed bg-indigo-950/10 border border-indigo-900/10 p-3 rounded-xl">
                        {activeClause.explanation.split('Company')[0].trim() || 'AI generated meaning'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">Corporate Alignment Status</span>
                      <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                        activeClause.status === 'PASS' 
                          ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-450' 
                          : 'bg-rose-955/20 border-rose-900/30 text-rose-350'
                      }`}>
                        <div className="mt-0.5 font-bold">
                          {activeClause.status === 'PASS' ? '✓' : '✗'}
                        </div>
                        <div>
                          <span className="font-bold block uppercase tracking-wider text-[10px] mb-1">{activeClause.status}</span>
                          <span className="text-slate-300 leading-relaxed">{activeClause.explanation}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl text-[10px] text-slate-500 leading-relaxed">
                  <span className="font-bold block text-slate-400 mb-1 flex items-center gap-1"><AlertCircle size={10} /> Why it matters</span>
                  Failure to meet this clause triggers immediate pre-qualification bid rejection. Use the AI Proposal Generator to review JVs or leases.
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                <AlertCircle size={24} className="text-slate-700 mb-2" />
                <p className="text-xs">Select a requirement clause on the left to show AI audits.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center border border-slate-850 rounded-3xl m-8 py-20 bg-slate-950/50">
          <Code size={48} className="text-slate-700 mb-4" />
          <h3 className="font-bold text-slate-300 text-sm">No Clauses Loaded</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm text-center leading-relaxed">
            Upload a tender PDF specification under Tenders Catalog to explore clauses split-pane.
          </p>
        </div>
      )}

    </div>
  );
};
