import React, { useState, useEffect } from 'react';
import { api, type Tender } from '../services/api';
import { Award, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface EligibilityCenterProps {
  onSelectTender: (id: number) => void;
}

export const EligibilityCenter: React.FC<EligibilityCenterProps> = ({ onSelectTender }) => {
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
        <RefreshCw className="animate-spin text-indigo-500 mb-4" size={32} />
        <p className="text-slate-400 text-sm">Evaluating Corporate Alignment Matrix...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-900 text-slate-100 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Eligibility Center</h2>
            <p className="text-xs text-slate-400 mt-1">Audit compliance status across financial limits, past contract volumes, and equipment inventories</p>
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
            {/* Summary score blocks */}
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { name: 'Financial Compatibility', score: 100 - selectedTender.financial_risk, desc: 'Scans cash flow and baseline turnovers.' },
                { name: 'Technical & Assets', score: 100 - selectedTender.technical_risk, desc: 'Scans plant ownerships and sites.' },
                { name: 'Experience Volume', score: 100 - selectedTender.overall_risk_score, desc: 'Evaluates past contract scales completed.' },
                { name: 'Documentation Readiness', score: 100 - selectedTender.documentation_risk, desc: 'Scans vault certificates availability.' },
              ].map((item) => (
                <div key={item.name} className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">{item.name}</span>
                    <span className={`text-2xl font-black ${item.score >= 80 ? 'text-emerald-450' : item.score >= 50 ? 'text-amber-400' : 'text-rose-455'}`}>{Math.round(item.score)}% Match</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-2">{item.desc}</p>
                  </div>
                  <div className="w-full bg-slate-900 h-1 rounded-full mt-4 overflow-hidden">
                    <div className={`h-full rounded-full ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 50 ? 'bg-amber-550' : 'bg-rose-500'}`} style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* In-depth Clause Matching Matrix */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Required vs Available Matrix</h3>
                <span className="text-[10px] text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 px-2 py-0.5 rounded font-black uppercase">Active Audit</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-350">
                  <thead className="bg-slate-900/50 text-slate-455 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Scope</th>
                      <th className="px-6 py-4">Tender Requirement</th>
                      <th className="px-6 py-4">Available In Profile</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">AI Explanatory Audit</th>
                      <th className="px-6 py-4 text-center">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {selectedTender.clauses.map((clause) => (
                      <tr key={clause.id} className="hover:bg-slate-900/30 transition-colors duration-150">
                        <td className="px-6 py-5 font-bold text-slate-400 capitalize">{clause.category}</td>
                        <td className="px-6 py-5 leading-relaxed text-slate-200 max-w-xs">{clause.required_value || clause.clause_text}</td>
                        <td className="px-6 py-5 font-semibold text-slate-300">{clause.user_value || 'None / Not Found'}</td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            clause.status === 'PASS' 
                              ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/20' 
                              : 'text-rose-455 bg-rose-955/20 border border-rose-900/20'
                          }`}>
                            {clause.status === 'PASS' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                            {clause.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 leading-relaxed text-slate-400 max-w-sm">{clause.explanation}</td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-[10px] font-mono font-bold text-indigo-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {Math.round(clause.confidence * 100)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Quick Action */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => onSelectTender(selectedTender.id)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2.5 text-xs font-bold transition-all"
              >
                Open Tender Workspace
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-slate-850 rounded-3xl py-20 bg-slate-950/50">
            <Award size={48} className="text-slate-700 mb-4" />
            <h3 className="font-bold text-slate-300 text-sm">No Inspected Tenders Available</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm text-center leading-relaxed">
              Upload a tender PDF specification under Tenders Catalog to auto-generate the compliance comparison matrix.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
