import React, { useState, useEffect } from 'react';
import { api, type Tender } from '../services/api';
import { ShieldAlert, AlertOctagon, ArrowRight, ShieldCheck } from 'lucide-react';

interface RiskIntelligenceProps {
  onSelectTender: (id: number) => void;
}

export const RiskIntelligence: React.FC<RiskIntelligenceProps> = ({ onSelectTender }) => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenderId, setSelectedTenderId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setLoading(true);
        const data = await api.getTenders();
        setTenders(data);
        if (data.length > 0) {
          setSelectedTenderId(data[0].id);
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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900">
        <ShieldAlert className="animate-spin text-indigo-500 mb-4" size={32} />
        <p className="text-slate-400 text-sm">Evaluating Tender Risk Profiles...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-900 text-slate-100 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Risk Intelligence Center</h2>
            <p className="text-xs text-slate-400 mt-1">AI-driven audit scanning for penalty traps, defect liability extensions, and liquidity blockages</p>
          </div>

          {tenders.length > 0 && (
            <select
              value={selectedTenderId || ''}
              onChange={(e) => setSelectedTenderId(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 w-full md:w-80 shadow-md"
            >
              {tenders.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          )}
        </div>

        {selectedTender ? (
          <div className="space-y-6">
            
            {/* Risk meters */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { name: 'Overall Risk Rating', score: selectedTender.overall_risk_score, desc: 'Scanned average risk profile across all legal and tech vectors.' },
                { name: 'Financial Risk', score: selectedTender.financial_risk, desc: 'Checks turnover limits, EMD deposit loss exposure, and bank credit scales.' },
                { name: 'Technical Risk', score: selectedTender.technical_risk, desc: 'Checks required machinery levels, plant ownerships and manpower.' },
                { name: 'Compliance Risk', score: selectedTender.compliance_risk, desc: 'Evaluates required contractor registrations and licensing validations.' },
                { name: 'Documentation Risk', score: selectedTender.documentation_risk, desc: 'Checks volume and expired credentials gaps.' },
              ].map((risk) => (
                <div key={risk.name} className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">{risk.name}</span>
                    <span className={`text-2xl font-black ${risk.score >= 50 ? 'text-rose-455' : risk.score >= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>{Math.round(risk.score)}%</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-2">{risk.desc}</p>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className={`h-full rounded-full ${risk.score >= 50 ? 'bg-rose-500' : risk.score >= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${risk.score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* In-depth Risk Matrix / High Risk Clauses */}
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Left column: High Risk Clauses */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 col-span-2 space-y-4">
                <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <AlertOctagon size={16} className="text-rose-455 animate-pulse" />
                  High Risk Clauses & Penalty Flags
                </h3>
                
                <div className="space-y-4">
                  {selectedTender.clauses.filter(c => c.status === 'FAIL').map((clause, idx) => (
                    <div key={clause.id} className="bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-rose-400 uppercase tracking-wider">Deficit Detected • {clause.category}</span>
                        <span className="font-mono text-slate-500">Clause Ref 0{idx+1}</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-semibold italic">"{clause.clause_text}"</p>
                      <p className="text-xs text-slate-400 border-t border-slate-850/50 pt-2"><span className="font-bold text-slate-300">Analysis:</span> {clause.explanation}</p>
                    </div>
                  ))}

                  {selectedTender.clauses.filter(c => c.status === 'FAIL').length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No high-risk clause failures detected in the original specifications.
                    </div>
                  )}
                </div>
              </div>

              {/* Right column: Mitigation Strategies */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
                <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2 text-indigo-400">
                  <ShieldCheck size={16} />
                  AI Mitigation Strategy
                </h3>

                <div className="space-y-4 text-xs">
                  {selectedTender.clauses.some(c => c.category === 'financial' && c.status === 'FAIL') && (
                    <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-2">
                      <span className="font-bold text-slate-250 block">1. Financial Backing Strategy</span>
                      <p className="text-slate-400 leading-relaxed">
                        To resolve turnover deficits, look to establish a **Joint Venture (JV)** holding 60:40 capabilities, or submit formal bank solvency credit letters.
                      </p>
                    </div>
                  )}

                  {selectedTender.clauses.some(c => c.category === 'technical' && c.status === 'FAIL') && (
                    <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-2">
                      <span className="font-bold text-slate-250 block">2. Equipment Lease Management</span>
                      <p className="text-slate-400 leading-relaxed">
                        Lease machinery models (such as segment launchers or asphalt mixers) through authorized builders, matching required asset inventories.
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-2 text-slate-400 leading-relaxed">
                    <span className="font-bold text-slate-350 block">3. Defect Liability Mitigation</span>
                    <p>
                      Include extended liability coverage clauses in standard subcontractor terms to offset direct builder exposure.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Back button link */}
            <div className="flex justify-end">
              <button
                onClick={() => onSelectTender(selectedTender.id)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
              >
                Go to Tender workspace <ArrowRight size={14} />
              </button>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-slate-850 rounded-3xl py-20 bg-slate-950/50">
            <ShieldAlert size={48} className="text-slate-700 mb-4" />
            <h3 className="font-bold text-slate-300 text-sm">No Inspected Risks Available</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm text-center leading-relaxed">
              Upload a tender specification PDF under Tenders Catalog to auto-generate the risk audits.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
