import React, { useState, useEffect } from 'react';
import { api, type Tender } from '../services/api';
import { Gauge, Clock, Users, AlertTriangle, FileCheck, ArrowRight } from 'lucide-react';

interface BidReadinessProps {
  onSelectTender: (id: number) => void;
}

export const BidReadiness: React.FC<BidReadinessProps> = ({ onSelectTender }) => {
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
        <Gauge className="animate-pulse text-indigo-500 mb-4" size={32} />
        <p className="text-slate-400 text-sm">Loading Bid Readiness Timelines...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-900 text-slate-100 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Bid Readiness</h2>
            <p className="text-xs text-slate-400 mt-1">Track documentation compilation pipelines, assign task owners, and review preparation warnings</p>
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
            {/* Top widgets layout */}
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Radial Circle */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden h-72">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Bid Readiness Index</span>
                
                <div className="relative flex items-center justify-center h-36 w-36">
                  {/* Gauge Arc Background */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="60" stroke="#0f172a" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      stroke="#4f46e5"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="377"
                      strokeDashoffset={377 - (377 * (selectedTender.bid_readiness_score || 0)) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-4xl font-black text-slate-100">{selectedTender.bid_readiness_score || 0}%</span>
                </div>
                
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-4">
                  {selectedTender.bid_readiness_score >= 80 ? 'Approved for Submission' : 'Remediation Required'}
                </span>
              </div>

              {/* Action Pipeline info */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 col-span-2 flex flex-col justify-between shadow-lg relative overflow-hidden h-72">
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Bid Compilation Summary</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
                      <Clock className="text-slate-400" size={20} />
                      <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-bold">Est. Prep Time</span>
                        <span className="font-bold text-xs text-slate-200">14 Work Days</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
                      <Users className="text-slate-400" size={20} />
                      <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-bold">Owner Assignee</span>
                        <span className="font-bold text-xs text-slate-200">Bid Team / Mgr</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl text-xs text-slate-450 leading-relaxed">
                  <span className="font-bold text-slate-350 block mb-1">AI Submission Verdict:</span>
                  Tender contains {selectedTender.checklist.filter(c => c.status === 'missing').length} missing certificates in corporate vault. Complete the action items below to resolve checklist gaps.
                </div>
              </div>
            </div>

            {/* Preparation Pipeline timeline */}
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Warnings and Checklist checklist */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 col-span-2 space-y-6">
                <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck size={16} className="text-indigo-400" />
                  Remediation Checklist steps
                </h3>
                
                <div className="space-y-3 relative pl-4 border-l border-slate-850">
                  {(() => {
                    try {
                      const steps = JSON.parse(selectedTender.action_plan_json || "[]");
                      if (steps.length === 0) {
                        return <p className="text-xs text-slate-500">All required credentials and documents matched. Checklist 100% ready.</p>;
                      }
                      return steps.map((step: string, idx: number) => (
                        <div key={idx} className="relative group py-1 flex items-start gap-3">
                          <div className="absolute -left-[21px] top-2.5 w-2 h-2 bg-indigo-500 rounded-full border border-slate-950" />
                          <span className="text-xs text-slate-400 font-mono font-bold mt-0.5">0{idx+1}.</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-semibold">{step}</p>
                        </div>
                      ));
                    } catch (e) {
                      return <p className="text-xs text-slate-500">Error loading action plan steps.</p>;
                    }
                  })()}
                </div>
              </div>

              {/* Warning alerts Panel */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2 text-rose-455">
                  <AlertTriangle size={15} />
                  Risk Alerts
                </h3>
                
                <div className="space-y-3 text-xs">
                  {selectedTender.overall_risk_score >= 40 && (
                    <div className="bg-rose-955/20 border border-rose-900/40 rounded-xl p-3.5 text-rose-300">
                      <span className="font-bold block mb-1">High Risk Threshold</span>
                      Total bid risk score exceeds 40%. Verify compliance constraints.
                    </div>
                  )}

                  {selectedTender.checklist.some(c => c.status === 'missing') && (
                    <div className="bg-amber-955/20 border border-amber-900/40 rounded-xl p-3.5 text-amber-300">
                      <span className="font-bold block mb-1">Missing Proofs</span>
                      Tender has missing documents in vault. Match registrations.
                    </div>
                  )}

                  <div className="bg-slate-900 border border-slate-850 rounded-xl p-3.5 text-slate-400 leading-relaxed">
                    <span className="font-bold block text-slate-300 mb-1">Submission Target</span>
                    Bid closes on <span className="font-semibold text-slate-200">{selectedTender.submission_deadline || 'N/A'}</span>. Make sure to complete reviews 3 days prior.
                  </div>
                </div>
              </div>

            </div>

            {/* View Details Link */}
            <div className="flex justify-end">
              <button
                onClick={() => onSelectTender(selectedTender.id)}
                className="bg-slate-950 border border-slate-800 hover:bg-slate-850 text-indigo-400 hover:text-indigo-350 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                Go to Tender workspace <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-slate-850 rounded-3xl py-20 bg-slate-950/50">
            <Gauge size={48} className="text-slate-700 mb-4" />
            <h3 className="font-bold text-slate-300 text-sm">No Active Bids Analyzed</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm text-center leading-relaxed">
              Upload a tender specification PDF under Tenders Catalog to auto-generate the bid preparation timelines.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
