import React, { useState } from 'react';
import {
  ArrowRight, FileText, Cpu, Sparkles, ShieldCheck,
  CheckCircle2, AlertTriangle, TrendingUp, Lock, Compass, Users,
  RefreshCw, FileSpreadsheet, MessageSquare, Folder,
  BarChart4, LayoutDashboard, Code
} from 'lucide-react';

interface LandingProps {
  onEnter: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onEnter }) => {
  // 2. Interactive AI Chat Simulation State
  const [chatTopic, setChatTopic] = useState<'emd' | 'bid'>('emd');

  // 3. Product Showcase Carousel State
  const [activeShowcase, setActiveShowcase] = useState(0);
  const showcaseTabs = [
    { title: 'Executive Command Center', desc: 'Manage won contracts, active inspections, and live bid readiness indices.' },
    { title: 'Clause Intelligence Parser', desc: 'Split-pane clause matching with high fidelity PDF viewport highlight.' },
    { title: 'Corporate Drive Vault', desc: 'Store GST, PAN, registrations, and auto-match compliance requirements.' },
    { title: 'RAG Co-Pilot Chat', desc: 'Ask specific questions about penalties, deadlines, and criteria details.' }
  ];

  // 4. FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqData = [
    { q: 'Can the AI parse scanned non-searchable PDFs?', a: 'Yes. Tndrlens uses a high-performance OCR engine built specifically for multi-column layouts to digitize scanned papers before feeding them to the LLM.' },
    { q: 'How does it match company eligibility requirements?', a: 'Our Eligibility Engine cross-checks extracted parameters (turnover, similar projects completed, machinery) directly against files uploaded to your Document Vault.' },
    { q: 'Does it track and compile corrigendum modifications?', a: 'Absolutely. When an amendment or corrigendum PDF is uploaded, Tndrlens compares structural changes side-by-side and alerts you to revised deadlines or altered values.' },
    { q: 'What AI models power the clause extractor?', a: 'We utilize advanced RAG pipelines connected to Gemini Pro APIs, running specialized prompt templates tuned for legal procurement compliance.' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white overflow-x-hidden select-none">
      
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 h-20 flex items-center justify-between px-8 md:px-16 landing-header border-b border-slate-border z-50 backdrop-blur-md bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-650/15 border border-indigo-500/30 text-indigo-400 p-2 rounded-xl">
            <FileText size={20} />
          </div>
          <span className="font-extrabold text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
            Tndrlens
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <a href="#pipeline" className="hidden md:inline text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">How it Works</a>
          <a href="#features" className="hidden md:inline text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">Capabilities</a>
          <a href="#chat-demo" className="hidden md:inline text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">Interactive Demo</a>
          <button
            onClick={onEnter}
            className="bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/30 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-102 flex items-center gap-1"
          >
            Launch Platform
            <ArrowRight size={13} />
          </button>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto w-full px-6 md:px-12 pt-16 pb-24 grid lg:grid-cols-12 gap-12 items-center relative z-10">
        <div className="lg:col-span-7 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={12} className="text-indigo-400" />
            Tender management and bid review
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-slate-100 tracking-tight leading-[1.1] max-w-2xl">
            Make confident <br />
            <span className="text-indigo-400">tender decisions.</span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">
            Review tender requirements against your company profile, track missing documents, and manage each opportunity with your team in one workspace.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={onEnter}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-8 py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 hover:scale-102"
            >
              Open your workspace
              <ArrowRight size={14} />
            </button>
            <a
              href="#chat-demo"
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-xs px-8 py-4 rounded-xl transition-all"
            >
              Explore features
            </a>
          </div>
        </div>

        {/* Tender review summary */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-left shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <p className="text-xs font-semibold text-slate-100">Tender review</p>
              <p className="mt-1 text-[11px] text-slate-400">A clear view of each opportunity</p>
            </div>
            <FileText size={19} className="text-indigo-400" />
          </div>
          <div className="divide-y divide-slate-800">
            {[
              { title: 'Eligibility requirements', detail: 'Review criteria against company records' },
              { title: 'Submission documents', detail: 'Track required certificates and forms' },
              { title: 'Key dates and amendments', detail: 'Keep deadlines and updates in view' },
              { title: 'Bid decision notes', detail: 'Share findings with your team' }
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 py-4">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">{item.title}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 rounded-lg bg-slate-800/60 px-3 py-2 text-[10px] text-slate-400">Example workspace · Add your tender documents to begin</p>
        </div>
      </section>

      {/* 2. WORKFLOW OVERVIEW */}
      <section className="border-y border-slate-800 bg-slate-900/30 py-12">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 md:grid-cols-3 md:px-12">
          {[
            { title: 'Review requirements', detail: 'Identify eligibility criteria, key dates, and submission terms.' },
            { title: 'Check readiness', detail: 'Compare tender requirements with your company records.' },
            { title: 'Coordinate a decision', detail: 'Share findings and keep follow-up work organized.' }
          ].map((item, index) => (
            <div key={item.title} className="flex gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-5 text-left">
              <span className="font-mono text-sm text-indigo-400">0{index + 1}</span>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. HOW AI WORKS SECTION */}
      <section id="pipeline" className="max-w-7xl mx-auto w-full px-6 md:px-12 py-24 text-center space-y-16">
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider">The Extraction Flow</span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-100">A straightforward tender review</h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto">Move from document review to a clear, shared bid decision.</p>
        </div>

        <div className="overflow-x-auto pb-6 scrollbar-thin">
          <div className="flex items-center justify-between min-w-[1000px] px-4 gap-2">
            {[
              { id: 'pdf', title: 'Tender PDF', desc: 'Raw document ingestion' },
              { id: 'ocr', title: 'OCR Engine', desc: 'Extracts multi-column text' },
              { id: 'clause', title: 'Clause review', desc: 'RAG parameter parser' },
              { id: 'search', title: 'Semantic Search', desc: 'Matches target criteria' },
              { id: 'eligibility', title: 'Eligibility Engine', desc: 'Formulates capability audits' },
              { id: 'risk', title: 'Risk Intelligence', desc: 'Identifies timeline hazards' },
              { id: 'docs', title: 'Document Matching', desc: 'Validates folder files' },
              { id: 'readiness', title: 'Bid Readiness', desc: 'Action plan generation' },
              { id: 'report', title: 'Executive Report', desc: 'Exports summary briefs' }
            ].map((node, idx) => (
              <React.Fragment key={node.id}>
                {idx > 0 && <div className="h-0.5 w-8 bg-indigo-950 border-t border-dashed border-indigo-500/30" />}
                <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-4 rounded-xl text-left w-32 shrink-0 group transition-all cursor-pointer relative">
                  <span className="text-[8px] font-bold text-indigo-450 uppercase tracking-widest block">Node 0{idx + 1}</span>
                  <h4 className="font-bold text-xs text-slate-200 mt-1 truncate">{node.title}</h4>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-950 border border-indigo-500/30 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20 text-[10px] text-slate-400">
                    <span className="font-bold text-slate-200 block mb-1">{node.title}</span>
                    {node.desc}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES SECTION (12 Premium Cards) */}
      <section id="features" className="max-w-7xl mx-auto w-full px-6 md:px-12 py-24 space-y-16">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider">Features Map</span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-100">Tools for tender and procurement teams</h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto">Keep tender review, company documents, and team follow-up together.</p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[
            { id: 'f1', title: 'Tender summary', desc: 'Generates a business synopsis in minutes instead of reading 500 pages.', icon: FileText },
            { id: 'f2', title: 'Clause Intelligence', desc: 'Identifies EMD, turnovers, and machinery requisites with page citations.', icon: Cpu },
            { id: 'f3', title: 'Eligibility Analysis', desc: 'Computes matching passes or warnings against active corporate parameters.', icon: CheckCircle2 },
            { id: 'f4', title: 'Company Profile Matching', desc: 'Highlights capabilities deficits before committing proposal resources.', icon: Users },
            { id: 'f5', title: 'Risk Intelligence', desc: 'Flags timeline penalties, liquid assets caps, and contract vulnerabilities.', icon: AlertTriangle },
            { id: 'f6', title: 'Bid Readiness Score', desc: 'Assesses capability matching metrics to flag target readiness percentages.', icon: TrendingUp },
            { id: 'f7', title: 'Document Checklist', desc: 'Checks document validity logs to flag renewals or missing credentials.', icon: ShieldCheck },
            { id: 'f8', title: 'Corrigendum Tracker', desc: 'Tracks addenda modifications, highlighting altered deadlines or EMDs.', icon: RefreshCw },
            { id: 'f9', title: 'Tender Discovery', desc: 'Search governmental portal datasets like NHAI and DMRC inside one panel.', icon: Compass },
            { id: 'f10', title: 'Tender Q&A', desc: 'Prompt the copilot directly for specific clauses, terms, and requirements.', icon: MessageSquare },
            { id: 'f11', title: 'Executive Reports', desc: 'Downloads professional analysis files for bidding committee review.', icon: FileSpreadsheet },
            { id: 'f12', title: 'Tender Analytics', desc: 'Visualizes historical win distributions and eligibility matching ratios.', icon: BarChart4 }
          ].map(feat => {
            const Icon = feat.icon;
            return (
              <div key={feat.id} className="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl hover:border-indigo-500/40 hover:-translate-y-1 transition-all group duration-300 text-left">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-indigo-405 flex items-center justify-center mb-5 group-hover:bg-indigo-650 group-hover:text-white transition-colors duration-300">
                  <Icon size={20} />
                </div>
                <h4 className="font-bold text-xs text-slate-200 mb-2">{feat.title}</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. LIVE AI DEMO (Interactive AI Conversation) */}
      <section id="chat-demo" className="max-w-4xl mx-auto w-full px-6 py-24 space-y-10 text-center">
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider">Interactive Test</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">Live AI Chat Demo</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">Select a prompt below to see the Tndrlens Copilot answer questions in real time</p>
        </div>

        {/* Demo Interface Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-left">
          {/* Header */}
          <div className="bg-slate-900/60 border-b border-slate-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tndrlens Copilot v2.0</span>
          </div>

          {/* Interactive tabs */}
          <div className="border-b border-slate-900 p-4 flex gap-3">
            <button
              onClick={() => { setChatTopic('emd'); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                chatTopic === 'emd' ? 'bg-indigo-650/20 border border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border border-slate-850 text-slate-400'
              }`}
            >
              Ask: "What is the EMD?"
            </button>
            <button
              onClick={() => { setChatTopic('bid'); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                chatTopic === 'bid' ? 'bg-indigo-650/20 border border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border border-slate-850 text-slate-400'
              }`}
            >
              Ask: "Should we bid?"
            </button>
          </div>

          {/* Chat Window */}
          <div className="p-6 space-y-6 min-h-60 text-xs">
            {chatTopic === 'emd' ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <span className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 px-4 py-2.5 rounded-2xl max-w-sm">
                    What is the EMD?
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-650/15 text-indigo-400 p-1.5 rounded-lg shrink-0">
                    <Sparkles size={14} />
                  </div>
                  <div className="space-y-3 max-w-xl bg-slate-900/40 border border-slate-850 p-4.5 rounded-2xl text-slate-350">
                    <p className="font-bold text-slate-200">EMD Requirement details found:</p>
                    <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Value Required</span>
                        <span className="font-mono text-emerald-400 font-bold">₹25,00,000</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Reference Notice</span>
                        <span className="text-slate-300">Clause 5.3 (Page 42)</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Confidence Match</span>
                        <span className="text-indigo-400 font-semibold">See clause</span>
                      </div>
                    </div>
                    <p className="text-[10px]">Note: The EMD must be submitted in the form of a Bank Guarantee from any nationalized bank valid for 180 days.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <span className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 px-4 py-2.5 rounded-2xl max-w-sm">
                    Should we bid?
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-650/15 text-indigo-400 p-1.5 rounded-lg shrink-0">
                    <Sparkles size={14} />
                  </div>
                  <div className="space-y-3 max-w-xl bg-slate-900/40 border border-slate-850 p-4.5 rounded-2xl text-slate-350">
                    <p className="font-bold text-slate-200">Bid Feasibility Report compilation completed:</p>
                    <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl space-y-2.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Eligibility pass matching</span>
                        <span className="text-emerald-400 font-semibold">Review required</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Timeline and Penalty risk</span>
                        <span className="text-slate-300">Low (28% Index)</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Action checklist readiness</span>
                        <span className="text-slate-300">87% Score</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Overall Feasibility verdict</span>
                        <span className="text-indigo-400 font-extrabold uppercase">Strongly Recommended</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. PRODUCT SHOWCASE CAROUSEL SECTION */}
      <section className="max-w-7xl mx-auto w-full px-6 md:px-12 py-24 space-y-12">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider">Showcase</span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-100">Step Inside the Workspace</h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto">Explore high fidelity modules matching standard tender evaluation tasks</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Tabs Selector on Left */}
          <div className="space-y-3.5">
            {showcaseTabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveShowcase(idx)}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-200 block ${
                  activeShowcase === idx
                    ? 'bg-slate-900 border-indigo-500/30 shadow-lg'
                    : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-850'
                }`}
              >
                <h4 className={`text-xs font-bold ${activeShowcase === idx ? 'text-slate-100 font-extrabold' : 'text-slate-450'}`}>{tab.title}</h4>
                <p className="text-[10px] mt-1.5 leading-relaxed text-slate-500">{tab.desc}</p>
              </button>
            ))}
          </div>

          {/* Interactive Screen viewport on Right */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-850 p-6 rounded-3xl min-h-[300px] flex flex-col justify-between shadow-2xl relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />
            
            {activeShowcase === 0 && (
              <div className="space-y-6 text-left">
                <div className="flex items-center gap-3 border-b border-slate-900 pb-4">
                  <div className="bg-indigo-950 border border-indigo-900/30 text-indigo-400 p-2 rounded-xl">
                    <LayoutDashboard size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">Executive Command Center Dashboard</h3>
                    <span className="text-[9px] text-slate-500">Live system performance overview</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                  {[
                    { l: 'Inspections', v: '15' },
                    { l: 'Won Bids', v: '3' },
                    { l: 'Win Ratio', v: '82.4%' },
                    { l: 'Avg Readiness', v: '86%' }
                  ].map(stat => (
                    <div key={stat.l} className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl">
                      <span className="text-[9px] font-semibold text-slate-505 block uppercase">{stat.l}</span>
                      <span className="text-lg font-black text-slate-200 mt-1 block">{stat.v}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4.5 space-y-3.5 text-xs text-left">
                  <span className="font-bold text-slate-350 block border-b border-slate-950 pb-2.5">Recent Inspections Feed</span>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">DMRC Delhi Metro Elevated Viaduct</span>
                    <span className="text-indigo-400 font-bold bg-indigo-950/20 border border-indigo-900/20 px-2 py-0.5 rounded text-[8px]">Bid Feasible</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">NHAI Expressway Expansion Sector-2</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-900/20 px-2 py-0.5 rounded text-[8px]">Strong Match</span>
                  </div>
                </div>
              </div>
            )}

            {activeShowcase === 1 && (
              <div className="space-y-6 text-left text-xs">
                <div className="flex items-center gap-3 border-b border-slate-900 pb-4">
                  <div className="bg-indigo-950 border border-indigo-900/30 text-indigo-400 p-2 rounded-xl">
                    <Code size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">VS Code-Style Clause Explorer</h3>
                    <span className="text-[9px] text-slate-550">Split viewport matching with explainability citations</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl space-y-2">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block">Extracted Requirements</span>
                    <div className="p-2 bg-slate-950 border border-slate-850 rounded text-[9px] text-slate-350">
                      <span className="font-bold text-slate-200 block mb-1">Clause 5.4: Experience</span>
                      Must complete 3 projects of similar magnitude in last 5 years.
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl space-y-2">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block">AI Explanation</span>
                    <div className="p-2 bg-slate-950 border border-slate-850 rounded text-[9px] text-slate-350">
                      <span className="font-bold text-slate-200 block mb-1">Pass (100% Match)</span>
                      Your profile registers 8 completed infrastructure projects.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeShowcase === 2 && (
              <div className="space-y-6 text-left text-xs">
                <div className="flex items-center gap-3 border-b border-slate-900 pb-4">
                  <div className="bg-indigo-950 border border-indigo-900/30 text-indigo-400 p-2 rounded-xl">
                    <Folder size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">Corporate Drive Vault</h3>
                    <span className="text-[9px] text-slate-500">Auto-match document checklists</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { n: 'GST_Filings_2025-26.pdf', size: '1.2 Mb', tag: 'Financials', status: 'Verified' },
                    { n: 'ISO_9001_Quality_Certificate.pdf', size: '840 Kb', tag: 'Certifications', status: 'Verified' }
                  ].map(file => (
                    <div key={file.n} className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-850 rounded-2xl">
                      <div>
                        <span className="font-bold text-slate-200 block text-[11px]">{file.n}</span>
                        <span className="text-[9px] text-slate-500">Size: {file.size} • Tag: {file.tag}</span>
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-wider bg-emerald-950/20 border border-emerald-900/20 text-emerald-455 px-2 py-0.5 rounded">{file.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeShowcase === 3 && (
              <div className="space-y-6 text-left text-xs">
                <div className="flex items-center gap-3 border-b border-slate-900 pb-4">
                  <div className="bg-indigo-950 border border-indigo-900/30 text-indigo-400 p-2 rounded-xl">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">Bid Co-Pilot Chat Assistant</h3>
                    <span className="text-[9px] text-slate-550">Prompt-level legal clause checker</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-850 p-4.5 rounded-2xl space-y-3.5">
                  <div className="flex justify-end">
                    <span className="bg-indigo-650/10 border border-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-xl text-[10px]">What is the penalty for delays?</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="bg-indigo-955 text-indigo-400 p-1.5 rounded-lg shrink-0">
                      <Sparkles size={12} />
                    </div>
                    <p className="text-[10px] text-slate-400 bg-slate-950 border border-slate-900 p-3 rounded-xl max-w-md">
                      Delay penalty is capped at **10% of total contract size** (Clause 12.4). Delays above 30 days trigger liquid damage calculations.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. BEFORE VS AFTER SECTION */}
      <section className="max-w-6xl mx-auto w-full px-6 py-24 space-y-16">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider">Before & After</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">Bidding Velocity Transformation</h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto">Compare the manual assessment workload with AI-enabled feasibility analysis</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 text-left text-xs">
          
          {/* Before */}
          <div className="bg-slate-950 border border-rose-950/30 rounded-3xl p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <h4 className="font-bold text-xs text-rose-455 uppercase tracking-widest">Traditional Bid Evaluation</h4>
              <span className="bg-rose-950/40 border border-rose-900/50 text-rose-300 px-2 py-0.5 rounded text-[8px] font-bold">2–3 Days</span>
            </div>

            <ul className="space-y-4 text-slate-450">
              {[
                'Read and compile 700 pages manually',
                'Manual parameter search across web pages',
                'Tracking requirements in Excel sheets',
                'Risks of missed criteria and deadlines',
                'Prone to document compilation errors'
              ].map((text, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-550 shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div className="bg-slate-950 border border-emerald-950/30 rounded-3xl p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <h4 className="font-bold text-xs text-emerald-400 uppercase tracking-widest">Tndrlens Analysis</h4>
              <span className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-405 px-2 py-0.5 rounded text-[8px] font-bold">45 Seconds</span>
            </div>

            <ul className="space-y-4 text-slate-350">
              {[
                'Instant drag-and-drop ingestion',
                'Automatic clause extraction & citations',
                'Immediate capability matching report',
                'Real-time addenda difference summary',
                'AI decision feasibility co-pilot helper'
              ].map((text, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <CheckCircle2 size={14} className="text-emerald-450 shrink-0" />
                  <span className="font-semibold text-slate-200">{text}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* 8. COMPANY TYPES (Industries) */}
      <section className="bg-slate-950 border-y border-slate-905 py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
          <div className="text-center space-y-4">
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider">Enterprise Scopes</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">Built for Diversified Portfolios</h2>
            <p className="text-slate-400 text-xs max-w-md mx-auto">Trained to understand civil bid criteria across all major contractor scopes</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left text-xs">
            {[
              { id: 'c1', title: 'Road Contractors', desc: 'Analyzes bitumen ratios, NHAI criteria and road rollers counts.' },
              { id: 'c2', title: 'Bridge Contractors', desc: 'Identifies segments casting and high-stress steel grades.' },
              { id: 'c3', title: 'Metro Projects', desc: 'Tracks concrete viaducts, track renewals and CPWD terms.' },
              { id: 'c4', title: 'Government Vendors', desc: 'Monitors EMD guarantees and liquid asset constraints.' }
            ].map(card => (
              <div key={card.id} className="bg-slate-900/50 border border-slate-850 p-5 rounded-2xl space-y-3">
                <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest block">{card.id.toUpperCase()}</span>
                <h4 className="font-bold text-xs text-slate-200">{card.title}</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. AI CAPABILITIES (Badges) */}
      <section className="max-w-5xl mx-auto w-full px-6 py-24 text-center space-y-8">
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider">Technology Stack</span>
          <h2 className="text-2xl font-bold text-slate-100">AI Core Technologies</h2>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {[
            'OCR Layout Engine', 'Gemini RAG Pipelines', 'VectorDB Embeddings',
            'Explainable Citations', 'Corrigendum Diff Tracker', 'Capability matching',
            'Risk analysis matrices', 'Text digitizer', 'Digital signatures audits'
          ].map(tag => (
            <span key={tag} className="bg-slate-900 border border-slate-850 hover:border-indigo-500/30 text-slate-350 text-[10px] font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* 10. ENTERPRISE BENEFITS */}
      <section className="max-w-6xl mx-auto w-full px-6 py-24 space-y-16 border-t border-slate-900">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider">A practical workflow</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">From tender review to team decision</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-center">
          {[
            { val: '01', label: 'Review the requirements', desc: 'Find eligibility conditions, key dates, and submission terms.' },
            { val: '02', label: 'Check your readiness', desc: 'Compare tender needs with company records and documents.' },
            { val: '03', label: 'Agree on next steps', desc: 'Record risks, assign follow-up, and make a team decision.' }
          ].map(item => (
            <div key={item.label} className="bg-slate-950 border border-slate-850 p-6 rounded-3xl space-y-4">
              <h3 className="text-4xl font-black text-indigo-400">{item.val}</h3>
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-200 block uppercase tracking-wide">{item.label}</span>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 11. SECURITY & TRUST */}
      <section className="max-w-6xl mx-auto w-full px-6 py-24 space-y-12">
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 grid md:grid-cols-2 gap-8 items-center text-left">
          <div className="space-y-6 text-left text-xs">
            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-3 py-1.5 rounded-xl uppercase tracking-wider">Security</span>
            <h3 className="text-xl font-bold text-slate-100">Document access controls</h3>
            <p className="text-slate-400 leading-relaxed">
              Manage tender documents and company records within a workspace with role-based access controls.
            </p>
            
            <div className="space-y-3 text-left">
              {[
                { title: 'Workspace access', desc: 'Assign roles for team members.' },
                { title: 'Document organization', desc: 'Keep tender files and company records together.' }
              ].map(sec => (
                <div key={sec.title} className="flex gap-2.5 items-start">
                  <ShieldCheck size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-200 block">{sec.title}</span>
                    <span className="text-slate-500 text-[10px]">{sec.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col justify-center items-center text-center space-y-4">
            <Lock size={32} className="text-indigo-400" />
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wide">Workspace controls</h4>
            <span className="text-[10px] text-slate-500 max-w-xs">Manage workspace access and keep records organized for your team.</span>
          </div>
        </div>
      </section>

      {/* 12. FAQ ACCORDION */}
      <section className="max-w-3xl mx-auto w-full px-6 py-24 space-y-12">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider">Questions</span>
          <h2 className="text-2xl font-bold text-slate-100">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4 text-xs text-left">
          {faqData.map((faq, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => { setActiveFaq(activeFaq === idx ? null : idx); }}
                className="w-full px-6 py-4 flex items-center justify-between font-bold text-slate-200 hover:text-slate-100 bg-slate-900/40"
              >
                <span>{faq.q}</span>
                <span>{activeFaq === idx ? '−' : '+'}</span>
              </button>
              {activeFaq === idx && (
                <div className="px-6 py-4 border-t border-slate-900 text-slate-400 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 13. FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-16">
        <div className="max-w-7xl mx-auto px-8 md:px-12 grid grid-cols-2 md:grid-cols-5 gap-8 text-left text-xs">
          
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-650/15 border border-indigo-500/30 text-indigo-400 p-1.5 rounded-xl">
                <FileText size={16} />
              </div>
              <span className="font-extrabold text-base text-slate-100 tracking-tight">Tndrlens</span>
            </div>
            <p className="text-slate-500 text-[10px] max-w-xs leading-relaxed">
              Tender review and opportunity management for procurement teams.
            </p>
          </div>

          <div className="space-y-3">
            <span className="font-bold text-slate-350 block uppercase tracking-wide text-[10px]">Platform</span>
            <a href="#pipeline" className="text-slate-500 hover:text-slate-350 transition-colors block text-[10px]">How it Works</a>
            <a href="#features" className="text-slate-500 hover:text-slate-350 transition-colors block text-[10px]">Capabilities</a>
            <a href="#chat-demo" className="text-slate-500 hover:text-slate-350 transition-colors block text-[10px]">Interactive Demo</a>
          </div>

          <div className="space-y-3">
            <span className="font-bold text-slate-350 block uppercase tracking-wide text-[10px]">Solutions</span>
            <span className="text-slate-500 block text-[10px]">NHAI bidding</span>
            <span className="text-slate-500 block text-[10px]">Metro projects</span>
            <span className="text-slate-500 block text-[10px]">Corporate Vault</span>
          </div>

          <div className="space-y-3">
            <span className="font-bold text-slate-350 block uppercase tracking-wide text-[10px]">Legal</span>
            <span className="text-slate-500 block text-[10px]">Privacy policy</span>
            <span className="text-slate-500 block text-[10px]">Terms of service</span>
            <span className="text-slate-500 block text-[10px]">&copy; 2026 BuildCorp</span>
          </div>

        </div>
      </footer>

    </div>
  );
};
