import React, { useState, useEffect } from 'react';
import { api, type CompanyProfile as ICompanyProfile, type CompanyTenderDetails } from '../services/api';
import {
  Building2, Briefcase, Cpu, ShieldCheck, AlertCircle, Trash2, Folder, Search, FileText, Upload,
  Key, FileCheck, Layers, HardDrive, Users, ClipboardCheck
} from 'lucide-react';

interface VaultFile {
  name: string;
  category: string;
  uploadedAt: string;
  size: string;
  status: 'verified' | 'pending' | 'expired';
  expiryDate: string;
  tags: string[];
}

const emptyTenderDetails: CompanyTenderDetails = {
  entityType: '', incorporationNumber: '', udyamNumber: '', epfNumber: '', esiNumber: '',
  contractorLicenseExpiry: '', turnoverFy1: 0, turnoverFy2: 0, turnoverFy3: 0,
  workingCapital: 0, bankGuaranteeLimit: 0, emdCapacity: 0, solvencyCertificateExpiry: '',
  auditFirm: '', authorizedSignatory: '', signatoryDesignation: '', signatoryEmail: '',
  signatoryPhone: '', dscExpiry: '', completedProjectReferences: '', ongoingCommitments: '',
  debarmentStatus: 'not-debarred', litigationDisclosure: '',
};

export const CompanyProfile: React.FC = () => {
  const [, setProfile] = useState<ICompanyProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Workspace sub-tab state
  const [activeTab, setActiveTab] = useState<'readiness' | 'profile' | 'financials' | 'experience' | 'machinery' | 'engineers' | 'certificates' | 'vault' | 'signatures'>('profile');

  // Form states
  const [companyName, setCompanyName] = useState('BuildCorp Infrastructure Ltd.');
  const [gstNo, setGstNo] = useState('27AAECB1234F1ZH');
  const [panNo, setPanNo] = useState('AABC1234F');
  const [address, setAddress] = useState('801-804, Signature Towers, Bandra Kurla Complex, Mumbai, MH 400051');
  const [licenseClass, setLicenseClass] = useState('Class-A Unlimited (NHAI Approved)');
  const [turnover, setTurnover] = useState(1450);
  const [netWorth, setNetWorth] = useState(520);
  const [creditRating, setCreditRating] = useState('CRISIL AA+ Stable');
  const [solvency, setSolvency] = useState(80);
  const [experienceYears, setExperienceYears] = useState(15);
  const [similarProjects, setSimilarProjects] = useState(12);
  const [maxProjectVal, setMaxProjectVal] = useState(450);
  const [certifications, setCertifications] = useState('ISO 9001:2015, ISO 14001:2015, ISO 45001:2018');
  const [equipment, setEquipment] = useState('Excavators: 12, Batching Plants: 3, Concrete Pumps: 6, Mobile Cranes: 4');
  const [manpower, setManpower] = useState(250);
  const [tenderDetails, setTenderDetails] = useState<CompanyTenderDetails>(emptyTenderDetails);

  // Vault data
  const [searchTerm, setSearchTerm] = useState('');
  const [vaultFilter, setVaultFilter] = useState('all');

  const folders = [
    { name: 'GST & Tax Filings', count: 4, size: '12.4 MB' },
    { name: 'PAN & Registrations', count: 2, size: '2.1 MB' },
    { name: 'ISO Certifications', count: 3, size: '8.5 MB' },
    { name: 'Audited Financials', count: 6, size: '44.8 MB' },
    { name: 'Machinery Valuation', count: 3, size: '15.6 MB' },
    { name: 'Project Completion Certs', count: 12, size: '88.2 MB' },
  ];

  const files: VaultFile[] = [
    { name: 'ISO_9001_Quality_Cert_2026.pdf', category: 'ISO Certifications', uploadedAt: '2026-01-10', size: '2.4 MB', status: 'verified', expiryDate: '2027-01-10', tags: ['ISO', 'Quality'] },
    { name: 'ISO_14001_Environmental_Cert.pdf', category: 'ISO Certifications', uploadedAt: '2026-02-15', size: '3.1 MB', status: 'verified', expiryDate: '2027-02-15', tags: ['ISO', 'Green'] },
    { name: 'Audited_Balance_Sheet_FY25.pdf', category: 'Audited Financials', uploadedAt: '2025-07-20', size: '15.2 MB', status: 'verified', expiryDate: '2026-07-20', tags: ['Financial', 'Audits'] },
    { name: 'Contractor_License_Class_A.pdf', category: 'PAN & Registrations', uploadedAt: '2022-04-18', size: '1.2 MB', status: 'expired', expiryDate: '2026-04-18', tags: ['License', 'Class-A'] },
    { name: 'GST_Registration_Certificate.pdf', category: 'GST & Tax Filings', uploadedAt: '2021-09-05', size: '0.8 MB', status: 'verified', expiryDate: 'Permanent', tags: ['GST', 'Tax'] },
    { name: 'Bank_Solvency_Letter_Rs15Cr.pdf', category: 'Audited Financials', uploadedAt: '2026-05-02', size: '1.9 MB', status: 'pending', expiryDate: '2026-11-02', tags: ['Solvency', 'Bank'] },
  ];

  const fetchProfile = async () => {
    setError('');
    try {
      const [data, readinessDetails] = await Promise.all([
        api.getProfile(),
        api.getCompanyTenderDetails().catch(() => ({})),
      ]);
      setTenderDetails({ ...emptyTenderDetails, ...readinessDetails });
      setProfile(data);
      if (data.company_name) setCompanyName(data.company_name);
      if (data.turnover) setTurnover(data.turnover);
      if (data.experience_years) setExperienceYears(data.experience_years);
      if (data.similar_projects_completed) setSimilarProjects(data.similar_projects_completed);
      if (data.max_project_value) setMaxProjectVal(data.max_project_value);
      if (data.certifications) setCertifications(data.certifications);
      if (data.equipment) setEquipment(data.equipment);
      if (data.manpower_count) setManpower(data.manpower_count);
    } catch {
      console.warn("Could not load backend company profile, fallback active.");
      setError('Could not connect to the company profile service. Showing the workspace defaults; try again when the backend is available.');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const updatedProfile: ICompanyProfile = {
      company_name: companyName,
      turnover: Number(turnover),
      experience_years: Number(experienceYears),
      similar_projects_completed: Number(similarProjects),
      max_project_value: Number(maxProjectVal),
      certifications,
      equipment,
      manpower_count: Number(manpower),
    };

    try {
      const data = await api.updateProfile(updatedProfile);
      await api.updateCompanyTenderDetails(tenderDetails);
      setProfile(data);
      setMessage('Company profile and tender-readiness details saved.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update workspace profile parameters');
    } finally {
      setSaving(false);
    }
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    if (vaultFilter === 'all') return matchesSearch;
    if (vaultFilter === 'verified') return matchesSearch && f.status === 'verified';
    if (vaultFilter === 'expired') return matchesSearch && f.status === 'expired';
    return matchesSearch;
  });

  const tabsList = [
    { id: 'readiness', label: 'Tender Readiness', icon: ClipboardCheck },
    { id: 'profile', label: 'Company Profile', icon: Building2 },
    { id: 'financials', label: 'Financials', icon: Layers },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'machinery', label: 'Machinery Inventory', icon: Cpu },
    { id: 'engineers', label: 'Engineers Database', icon: Users },
    { id: 'certificates', label: 'Certificates Registry', icon: FileCheck },
    { id: 'vault', label: 'Document Vault', icon: HardDrive },
    { id: 'signatures', label: 'Digital Signatures', icon: Key }
  ] as const;

  return (
    <div className="company-workspace space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#334155] pb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#6366F1] p-2.5 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#F8FAFC]">Company Workspace</h2>
            <p className="text-xs text-[#94A3B8]">Maintain the company details and qualifications used for tender submissions.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="company-save-button bg-[#6366F1] hover:bg-indigo-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {message && (
        <div className="bg-[#10B981]/15 border border-[#10B981]/30 rounded-lg p-4 text-[#10B981] text-xs flex items-center gap-2">
          <ShieldCheck size={16} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-lg p-4 text-[#EF4444] text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => void fetchProfile()} className="font-semibold underline underline-offset-2">Retry</button>
        </div>
      )}

      {/* Horizontal Tabs Menu */}
      <div className="company-tab-nav grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-9 gap-1 rounded-xl border border-[#334155] bg-[#111827] p-1.5">
        {tabsList.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-medium leading-tight transition-colors ${
                isActive
                  ? 'bg-[#6366F1]/10 text-[#6366F1]'
                  : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC]'
              }`}
            >
              <Icon size={15} className="shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="company-tab-panel bg-[#111827] border border-[#334155] rounded-xl p-6">
        {activeTab === 'readiness' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-base font-semibold text-[#F8FAFC]">Tender readiness details</h3>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[#94A3B8]">Keep bid qualifications, compliance declarations, and submission contacts together. These details help your team prepare eligibility responses and supporting documents.</p>
            </div>

            <section className="space-y-4 border-t border-[#334155] pt-6">
              <div>
                <h4 className="text-sm font-semibold text-[#F8FAFC]">Business registrations</h4>
                <p className="mt-1 text-xs text-[#94A3B8]">Registration identifiers and statutory records commonly requested in tender forms.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="company-field-group"><label className="company-field-label">Type of entity</label><select className="company-field" value={tenderDetails.entityType} onChange={(e) => setTenderDetails({ ...tenderDetails, entityType: e.target.value })}><option value="">Select entity type</option><option>Private limited company</option><option>Public limited company</option><option>Partnership</option><option>LLP</option><option>Sole proprietorship</option><option>Joint venture</option></select></div>
                <div className="company-field-group"><label className="company-field-label">CIN / incorporation number</label><input className="company-field" value={tenderDetails.incorporationNumber} onChange={(e) => setTenderDetails({ ...tenderDetails, incorporationNumber: e.target.value })} placeholder="Company registration number" /></div>
                <div className="company-field-group"><label className="company-field-label">Udyam / MSME number</label><input className="company-field" value={tenderDetails.udyamNumber} onChange={(e) => setTenderDetails({ ...tenderDetails, udyamNumber: e.target.value })} placeholder="If registered" /></div>
                <div className="company-field-group"><label className="company-field-label">EPF registration number</label><input className="company-field" value={tenderDetails.epfNumber} onChange={(e) => setTenderDetails({ ...tenderDetails, epfNumber: e.target.value })} /></div>
                <div className="company-field-group"><label className="company-field-label">ESI registration number</label><input className="company-field" value={tenderDetails.esiNumber} onChange={(e) => setTenderDetails({ ...tenderDetails, esiNumber: e.target.value })} /></div>
                <div className="company-field-group"><label className="company-field-label">Contractor license expiry</label><input type="date" className="company-field" value={tenderDetails.contractorLicenseExpiry} onChange={(e) => setTenderDetails({ ...tenderDetails, contractorLicenseExpiry: e.target.value })} /></div>
              </div>
            </section>

            <section className="space-y-4 border-t border-[#334155] pt-6">
              <div>
                <h4 className="text-sm font-semibold text-[#F8FAFC]">Financial capacity</h4>
                <p className="mt-1 text-xs text-[#94A3B8]">Enter values in ₹ crore and use audited financial statements for the relevant years.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {([
                  ['turnoverFy1', 'Turnover · FY 2023–24'], ['turnoverFy2', 'Turnover · FY 2024–25'], ['turnoverFy3', 'Turnover · FY 2025–26'],
                  ['workingCapital', 'Available working capital'], ['bankGuaranteeLimit', 'Bank guarantee limit'], ['emdCapacity', 'EMD / bid security capacity'],
                ] as const).map(([key, label]) => <div className="company-field-group" key={key}><label className="company-field-label">{label} (₹ Cr)</label><input type="number" min="0" step="0.01" className="company-field" value={tenderDetails[key]} onChange={(e) => setTenderDetails({ ...tenderDetails, [key]: Number(e.target.value) })} /></div>)}
                <div className="company-field-group"><label className="company-field-label">Solvency certificate valid until</label><input type="date" className="company-field" value={tenderDetails.solvencyCertificateExpiry} onChange={(e) => setTenderDetails({ ...tenderDetails, solvencyCertificateExpiry: e.target.value })} /></div>
                <div className="company-field-group md:col-span-2"><label className="company-field-label">Statutory auditor / CA firm</label><input className="company-field" value={tenderDetails.auditFirm} onChange={(e) => setTenderDetails({ ...tenderDetails, auditFirm: e.target.value })} placeholder="Firm name" /></div>
              </div>
            </section>

            <section className="space-y-4 border-t border-[#334155] pt-6">
              <div>
                <h4 className="text-sm font-semibold text-[#F8FAFC]">Authorized bid contact</h4>
                <p className="mt-1 text-xs text-[#94A3B8]">Contact and digital-signature details for tender submissions.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {([
                  ['authorizedSignatory', 'Authorized signatory'], ['signatoryDesignation', 'Designation'],
                  ['signatoryEmail', 'Work email'], ['signatoryPhone', 'Phone number'],
                ] as const).map(([key, label]) => <div className="company-field-group" key={key}><label className="company-field-label">{label}</label><input type={key === 'signatoryEmail' ? 'email' : 'text'} className="company-field" value={tenderDetails[key]} onChange={(e) => setTenderDetails({ ...tenderDetails, [key]: e.target.value })} /></div>)}
                <div className="company-field-group"><label className="company-field-label">DSC token expiry</label><input type="date" className="company-field" value={tenderDetails.dscExpiry} onChange={(e) => setTenderDetails({ ...tenderDetails, dscExpiry: e.target.value })} /></div>
              </div>
            </section>

            <section className="space-y-4 border-t border-[#334155] pt-6">
              <div>
                <h4 className="text-sm font-semibold text-[#F8FAFC]">Experience and declarations</h4>
                <p className="mt-1 text-xs text-[#94A3B8]">Keep concise references to comparable work and disclose matters asked for in bid documents.</p>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="company-field-group"><label className="company-field-label">Similar completed projects</label><textarea rows={4} className="company-field resize-y" value={tenderDetails.completedProjectReferences} onChange={(e) => setTenderDetails({ ...tenderDetails, completedProjectReferences: e.target.value })} placeholder="One project per line: project, client, value, completion date, certificate reference" /></div>
                <div className="company-field-group"><label className="company-field-label">Ongoing project commitments</label><textarea rows={4} className="company-field resize-y" value={tenderDetails.ongoingCommitments} onChange={(e) => setTenderDetails({ ...tenderDetails, ongoingCommitments: e.target.value })} placeholder="Project, client, contract value, completion schedule" /></div>
                <div className="company-field-group"><label className="company-field-label">Debarment / blacklisting status</label><select className="company-field" value={tenderDetails.debarmentStatus} onChange={(e) => setTenderDetails({ ...tenderDetails, debarmentStatus: e.target.value })}><option value="not-debarred">No active debarment declared</option><option value="under-review">Under review</option><option value="debarred">Active debarment</option></select></div>
                <div className="company-field-group"><label className="company-field-label">Litigation / material disclosures</label><textarea rows={3} className="company-field resize-y" value={tenderDetails.litigationDisclosure} onChange={(e) => setTenderDetails({ ...tenderDetails, litigationDisclosure: e.target.value })} placeholder="Add disclosures requested by the tender authority" /></div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="company-section-heading">
                <div>
                  <h3 className="text-base font-semibold text-[#F8FAFC]">Company identity</h3>
                  <p className="mt-1 text-xs text-[#94A3B8]">Registered business name and contractor classification.</p>
                </div>
              </div>
              <div className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="company-field-group xl:col-span-2">
                <label className="company-field-label">Registered company name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="company-field"
                />
              </div>
              <div className="company-field-group">
                <label className="company-field-label">Contractor license class</label>
                <input
                  type="text"
                  value={licenseClass}
                  onChange={(e) => setLicenseClass(e.target.value)}
                  className="company-field"
                />
              </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-[#334155] pt-6">
              <div>
                <h3 className="text-base font-semibold text-[#F8FAFC]">Registration and address</h3>
                <p className="mt-1 text-xs text-[#94A3B8]">Tax identifiers and the company’s registered office.</p>
              </div>
              <div className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="company-field-group">
                <label className="company-field-label">GSTIN</label>
                <input
                  type="text"
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                  className="company-field"
                />
              </div>
              <div className="company-field-group">
                <label className="company-field-label">PAN</label>
                <input
                  type="text"
                  value={panNo}
                  onChange={(e) => setPanNo(e.target.value)}
                  className="company-field"
                />
              </div>
              <div className="company-field-group md:col-span-2 xl:col-span-3">
                <label className="company-field-label">Registered office address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="company-field"
                />
              </div>
              </div>
            </section>

          </div>
        )}

        {activeTab === 'financials' && (
          <div className="space-y-6 max-w-3xl">
            <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">Financial Audit Benchmarks</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Average Turnover (Rs. Crores)</label>
                <input
                  type="number"
                  value={turnover}
                  onChange={(e) => setTurnover(Number(e.target.value))}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Net Worth Valuation (Rs. Crores)</label>
                <input
                  type="number"
                  value={netWorth}
                  onChange={(e) => setNetWorth(Number(e.target.value))}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Credit Rating Index</label>
                <input
                  type="text"
                  value={creditRating}
                  onChange={(e) => setCreditRating(e.target.value)}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Bank Solvency Limit (Rs. Crores)</label>
                <input
                  type="number"
                  value={solvency}
                  onChange={(e) => setSolvency(Number(e.target.value))}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-6 max-w-3xl">
            <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">Civil Engineering Credentials</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Years of Operation</label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Completed Projects (NHAI/DMRC)</label>
                <input
                  type="number"
                  value={similarProjects}
                  onChange={(e) => setSimilarProjects(Number(e.target.value))}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Max Single Project Val (Cr)</label>
                <input
                  type="number"
                  value={maxProjectVal}
                  onChange={(e) => setMaxProjectVal(Number(e.target.value))}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'machinery' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">Heavy Equipment Registry</h3>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Active Machinery Inventory (CSV Format)</label>
              <textarea
                rows={4}
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] font-mono"
              />
            </div>
          </div>
        )}

        {activeTab === 'engineers' && (
          <div className="space-y-6 max-w-3xl">
            <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">Technical Manpower</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Registered Civil Engineers count</label>
                <input
                  type="number"
                  value={manpower}
                  onChange={(e) => setManpower(Number(e.target.value))}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Certified Safety Managers count</label>
                <input
                  type="number"
                  defaultValue={14}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">Quality & Standards Certificates</h3>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Active Certifications</label>
              <input
                type="text"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
              />
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-[#334155] pb-4">
              <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">Google Drive Storage folders</span>
              <button className="bg-[#6366F1]/10 border border-[#6366F1]/20 hover:bg-[#6366F1]/20 text-[#6366F1] rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all flex items-center gap-1.5">
                <Upload size={12} />
                Upload New Audit File
              </button>
            </div>

            {/* Folders List Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <div key={folder.name} className="bg-[#1E293B] border border-[#334155] hover:border-[#6366F1]/30 p-4 rounded-xl flex flex-col justify-between h-28 cursor-pointer transition-all duration-150 group">
                  <Folder className="text-indigo-400 group-hover:scale-105 transition-transform" size={24} />
                  <div>
                    <h4 className="text-[11px] font-bold text-[#F8FAFC] truncate">{folder.name}</h4>
                    <span className="text-[9px] text-[#94A3B8] block mt-1">{folder.count} files • {folder.size}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#1E293B] border border-[#334155] p-4 rounded-xl">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={13} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search files or tags..."
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-9 pr-4 py-1.5 text-xs text-[#F8FAFC] outline-none"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
                {[
                  { id: 'all', label: 'All Files' },
                  { id: 'verified', label: 'Verified Vault' },
                  { id: 'expired', label: 'Alerts / Expired' },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setVaultFilter(btn.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      vaultFilter === btn.id
                        ? 'bg-[#6366F1]/10 text-indigo-400 border border-[#6366F1]/20'
                        : 'bg-[#0F172A] border border-[#334155] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Files List Table */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#111827] text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-[#334155]">
                  <tr>
                    <th className="px-6 py-4">File Name</th>
                    <th className="px-6 py-4">Folder Path</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Tags</th>
                    <th className="px-6 py-4">Expiry Limit</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]/60">
                  {filteredFiles.map((file) => (
                    <tr key={file.name} className="hover:bg-[#111827]/40 transition-colors duration-150">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <FileText className="text-slate-500 shrink-0" size={16} />
                        <span className="font-bold text-[#F8FAFC] truncate max-w-xs">{file.name}</span>
                      </td>
                      <td className="px-6 py-4 text-[#94A3B8]">{file.category}</td>
                      <td className="px-6 py-4">
                        {file.status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded">
                            Verified
                          </span>
                        ) : file.status === 'expired' ? (
                          <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 px-2 py-0.5 rounded">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2 py-0.5 rounded">
                            Pending OCR
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5 overflow-hidden">
                          {file.tags.map(t => (
                            <span key={t} className="bg-[#0F172A] border border-[#334155] text-[9px] text-[#94A3B8] px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${file.status === 'expired' ? 'text-[#EF4444] font-bold' : 'text-[#94A3B8]'}`}>
                        {file.expiryDate}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 text-slate-500 hover:text-[#EF4444] rounded-lg hover:bg-slate-900 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'signatures' && (
          <div className="space-y-6 max-w-3xl">
            <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">Digital Signatures & DSC Keys</h3>
            <div className="bg-[#1E293B] border border-[#334155] p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-start border-b border-[#334155] pb-4">
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC]">Class 3 DSC Token Status</h4>
                  <span className="text-[10px] text-[#94A3B8] mt-0.5 block">Approved for e-procurement portals</span>
                </div>
                <span className="text-[9px] font-bold text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded uppercase">Connected</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#94A3B8] block">Signatory Representative</span>
                  <span className="font-bold text-[#F8FAFC] mt-0.5 block">Arjun Sen (Managing Director)</span>
                </div>
                <div>
                  <span className="text-[#94A3B8] block">Token Expiry Limit</span>
                  <span className="font-bold text-[#F8FAFC] mt-0.5 block">2027-03-12</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
