import React, { useState } from 'react';
import { Folder, Search, FileText, Upload, ShieldCheck, AlertCircle, Trash2 } from 'lucide-react';

interface VaultFile {
  name: string;
  category: string;
  uploadedAt: string;
  size: string;
  status: 'verified' | 'pending' | 'expired';
  expiryDate: string;
  tags: string[];
}

export const Vault: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

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

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'verified') return matchesSearch && f.status === 'verified';
    if (activeFilter === 'expired') return matchesSearch && f.status === 'expired';
    return matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-900 text-slate-100 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Corporate Document Vault</h2>
            <p className="text-xs text-slate-400 mt-1">Google Drive-style directory manager for company registrations, financials, and project logs</p>
          </div>
          <button className="bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/20 text-white rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2">
            <Upload size={14} />
            Upload Vault File
          </button>
        </div>

        {/* Directory Folders */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Folders Directory</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {folders.map((folder) => (
              <div key={folder.name} className="bg-slate-950 border border-slate-850 hover:border-slate-800 p-4 rounded-2xl flex flex-col justify-between h-28 cursor-pointer transition-all duration-150 group">
                <Folder className="text-indigo-400 group-hover:scale-105 transition-transform" size={24} />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 truncate">{folder.name}</h4>
                  <span className="text-[9px] text-slate-550 block mt-1">{folder.count} files • {folder.size}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-950 border border-slate-850 p-4 rounded-2xl">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 text-slate-500" size={14} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files or tags..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'All Files' },
              { id: 'verified', label: 'Verified Vault' },
              { id: 'expired', label: 'Alerts / Expired' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setActiveFilter(btn.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === btn.id
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Files Listing Table */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs text-slate-350">
            <thead className="bg-slate-900/50 text-slate-455 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Folder Path</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tags</th>
                <th className="px-6 py-4">Expiry Limit</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredFiles.map((file) => (
                <tr key={file.name} className="hover:bg-slate-900/30 transition-colors duration-150">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <FileText className="text-slate-500 shrink-0" size={16} />
                    <span className="font-bold text-slate-250 truncate max-w-xs">{file.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{file.category}</td>
                  <td className="px-6 py-4">
                    {file.status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/20 px-2 py-0.5 rounded-lg">
                        <ShieldCheck size={10} /> Verified
                      </span>
                    ) : file.status === 'expired' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/20 border border-rose-900/20 px-2 py-0.5 rounded-lg">
                        <AlertCircle size={10} /> Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/20 border border-amber-900/20 px-2 py-0.5 rounded-lg">
                        Pending OCR
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5 overflow-hidden">
                      {file.tags.map(t => (
                        <span key={t} className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${file.status === 'expired' ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                    {file.expiryDate}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-slate-500 hover:text-rose-455 rounded-lg hover:bg-slate-900 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
