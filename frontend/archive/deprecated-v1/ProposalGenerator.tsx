import React, { useState, useEffect } from 'react';
import { api, type Tender } from '../services/api';
import { FileEdit, Sparkles, AlertCircle, Check, Copy, Download } from 'lucide-react';

export const ProposalGenerator: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenderId, setSelectedTenderId] = useState<number | null>(null);
  
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [proposalType, setProposalType] = useState('methodology');
  const [generating, setGenerating] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.getTenders();
        setTenders(data);
        if (data.length > 0) {
          setSelectedTenderId(data[0].id);
        }
        
        // Fetch company profile to autofill PAN, GST, turnover
        const profile = await api.getProfile();
        setCompanyProfile(profile);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerate = () => {
    if (!selectedTenderId || !companyProfile) return;
    setGenerating(true);
    setDraftContent('');
    
    const selectedTender = tenders.find(t => t.id === selectedTenderId);
    if (!selectedTender) return;

    setTimeout(() => {
      let doc = '';
      if (proposalType === 'methodology') {
        doc = `# TECHNICAL METHOD STATEMENT & WORK PLAN
**PROJECT**: ${selectedTender.title}
**CLIENT**: ${selectedTender.organization}
**SUBMITTED BY**: ${companyProfile.company_name} (turnover: Rs. ${companyProfile.turnover} Cr)

## 1. Executive Work Plan
We propose a high-fidelity work breakdown execution structured around the required specifications. The project completed maximum contract value of Rs. ${companyProfile.max_project_value} Cr demonstrates our baseline expertise.

## 2. Mobilisation & Machinery Deployment
We commit to deploying required site machinery assets:
- Segment Launchers: Leased / Owned models
- Concrete batching plants & concrete mixers: ${companyProfile.equipment}
All assets will be fully operational at site within 15 calendar days from the Date of Commencement.

## 3. Engineering Personnel Allocation
The project execution will be led by a Senior Project Manager holding ${companyProfile.experience_years} years of active infrastructure experience. 
`;
      } else if (proposalType === 'safety') {
        doc = `# ENVIRONMENTAL, HEALTH & SAFETY (EHS) PROTOCOLS
**PROJECT**: ${selectedTender.title}
**CLIENT**: ${selectedTender.organization}
**CONTRACTOR**: ${companyProfile.company_name}

## 1. Safety Compliance Standards
All works will strictly adhere to the guidelines set forth under standard contract agreements. We will enforce ISO 9001 and Class-A contractor standards (Active registrations present in Corporate Vault).

## 2. Personal Protective Equipment (PPE)
All site engineers and laborers (total commitment: 120+ site workers) will be equipped with standard safety boots, reflective vests, and safety goggles.

## 3. Incident Management & Remediation
First-aid medical camps will be positioned at main sector nodes. Subcontractor liabilities will align directly with overall corporate safety compliance guidelines.
`;
      } else {
        doc = `# BIDDER QUALIFICATION DETAILS & VAULT SUMMARY
**REGISTRANT**: ${companyProfile.company_name}
**PAN/GST REGISTRATION DETAILS**: Active 
**ACTIVE VAULT CERTIFICATES**: ${companyProfile.certifications}

## 1. Financial Audits Summary
- Average annual turnover (last 3 FYs): Rs. ${companyProfile.turnover} Cr
- Max single contract completed: Rs. ${companyProfile.max_project_value} Cr
- Audited balance sheets are uploaded and verified inside the Corporate Document Vault.

## 2. Declarations
We hereby declare that all information provided is accurate and matched directly against verified vault files.
`;
      }
      setDraftContent(doc);
      setGenerating(false);
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draftContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900">
        <FileEdit className="animate-spin text-indigo-500 mb-4" size={32} />
        <p className="text-slate-400 text-sm">Loading AI Proposal generators...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-900 text-slate-100 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 shrink-0">
          <h2 className="text-xl font-bold tracking-tight">AI Proposal Generator</h2>
          <p className="text-xs text-slate-400 mt-1">Draft technical statements and EHS checklists automatically populated with Corporate Vault data</p>
        </div>

        {tenders.length > 0 && companyProfile ? (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            
            {/* Input Form Panel */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg lg:col-span-1">
              <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider border-b border-slate-900 pb-3">Configure Draft</h3>
              
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-550 font-bold mb-1.5 uppercase tracking-wider">Select Target Tender</label>
                  <select
                    value={selectedTenderId || ''}
                    onChange={(e) => setSelectedTenderId(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 outline-none focus:border-indigo-500"
                  >
                    {tenders.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-550 font-bold mb-1.5 uppercase tracking-wider">Document Template Type</label>
                  <div className="space-y-2">
                    {[
                      { id: 'methodology', label: 'Technical Method Statement' },
                      { id: 'safety', label: 'EHS Safety Protocols draft' },
                      { id: 'autofill', label: 'Autofill GST/PAN Vault summary' }
                    ].map(t => (
                      <label key={t.id} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-850 hover:bg-slate-900/50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="proposalType"
                          checked={proposalType === t.id}
                          onChange={() => setProposalType(t.id)}
                          className="accent-indigo-500"
                        />
                        <span className="font-semibold text-slate-200">{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl text-slate-400 space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    <Sparkles size={12} />
                    Corporate Vault Autofill
                  </div>
                  <span className="block text-[11px]">Contractor: {companyProfile.company_name}</span>
                  <span className="block text-[11px]">Turnover: Rs. {companyProfile.turnover} Cr</span>
                  <span className="block text-[11px]">Experience: {companyProfile.experience_years} Years</span>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/20 text-white rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  {generating ? 'Compiling AI draft...' : 'Generate Document Draft'}
                </button>
              </div>
            </div>

            {/* Output Preview Pane */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 lg:col-span-2 shadow-lg min-h-[400px] flex flex-col justify-between relative overflow-hidden">
              {generating ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative flex items-center justify-center mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
                    <Sparkles className="absolute text-indigo-400" size={16} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-200">Notion AI compiling bid drafts...</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">Autofilling corporate PAN/GST details, drafting safety protocols, and setting structural methodology parameters.</p>
                </div>
              ) : draftContent ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Editor Output</span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-850 text-[10px] font-bold transition-all flex items-center gap-1"
                      >
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => alert('Proposal draft downloaded as PDF!')}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-white px-3 py-1.5 rounded-lg border border-slate-850 text-[10px] font-bold transition-all flex items-center gap-1"
                      >
                        <Download size={12} />
                        Export
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-text select-all overflow-y-auto max-h-[350px] p-4 bg-slate-900/40 border border-slate-900 rounded-2xl">
                    {draftContent}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate-500">
                  <FileEdit size={36} className="text-slate-700 mb-3" />
                  <h4 className="font-bold text-slate-400 text-sm">Proposal Preview Pane</h4>
                  <p className="text-[11px] text-slate-550 mt-1 max-w-xs">Configure document parameter details on the left and click generate to review the compiled Notion-style bid proposals.</p>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-slate-850 rounded-3xl py-20 bg-slate-950/50">
            <AlertCircle size={48} className="text-slate-700 mb-4" />
            <h3 className="font-bold text-slate-300 text-sm">No Configured Bids</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm text-center leading-relaxed">
              Ensure you have at least one tender uploaded and your Company Profile set up to enable the proposal engine.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
