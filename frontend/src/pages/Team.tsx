import React, { useEffect, useState } from 'react';
import { Users, UserPlus, MessageSquare, Send, CheckCircle2, Circle, Mail, Copy, X, Check } from 'lucide-react';
import { api, type CreatedTeamInvitation, type TeamInvitation } from '../services/api';

interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  status: 'active' | 'offline';
}

interface Task {
  id: number;
  title: string;
  assignee: string;
  status: 'todo' | 'in_progress' | 'completed';
  tenderTitle: string;
}

interface Comment {
  user: string;
  text: string;
  timestamp: string;
}

export const TeamCollaboration: React.FC = () => {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [createdInvitation, setCreatedInvitation] = useState<CreatedTeamInvitation | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    api.getTeamInvitations().then(setInvitations).catch(() => undefined);
  }, []);

  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: 'Verify Solvency Letters for DMRC Viaduct', assignee: 'Deepak (Manager)', status: 'in_progress', tenderTitle: 'Elevated Viaduct Line-9' },
    { id: 2, title: 'Upload expired ISO 9001 quality cert to vault', assignee: 'Aditi (Estimator)', status: 'completed', tenderTitle: 'Western Zone Track Renewals' },
    { id: 3, title: 'Review Defect Liability DLP Clause contradictions', assignee: 'Vivek (Legal Counsel)', status: 'todo', tenderTitle: 'Nagpur High Court Annex' },
    { id: 4, title: 'Submit EMD Receipt and verify credit approvals', assignee: 'Deepak (Manager)', status: 'todo', tenderTitle: 'Dwarka Expressway flyover' }
  ]);

  const [comments, setComments] = useState<Comment[]>([
    { user: 'Aditi', text: 'Renewed the ISO 9001 cert and verified match. Readiness score recalculated to 86%!', timestamp: '20 mins ago' },
    { user: 'Vivek', text: 'Checked Nagpur HC Annex DLP. It contains a page conflict of 2 years vs 3 years. Suggested pre-bid meeting draft copy is generated.', timestamp: '1 hour ago' },
    { user: 'Deepak', text: 'Assigned Dwarka Highway project value checks to estimator teams. Turnover margins look solid.', timestamp: '3 hours ago' }
  ]);

  const [newComment, setNewComment] = useState('');

  const handleCreateInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setInviteError('');
    setSendingInvite(true);
    try {
      const invitation = await api.createTeamInvitation(inviteEmail.trim());
      setCreatedInvitation(invitation);
      setInvitations((current) => [invitation, ...current.filter((item) => item.email !== invitation.email)]);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Could not create the invitation. Please try again.');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!createdInvitation) return;
    const inviteLink = `${window.location.origin}/?invite=${encodeURIComponent(createdInvitation.token)}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      setInviteError('');
    } catch {
      setInviteError('Copy is unavailable in this browser. Select the invitation link and copy it manually.');
    }
  };

  const members: TeamMember[] = [
    { name: 'Deepak Kumar', role: 'Head of Bid Proposals', avatar: 'DK', status: 'active' },
    { name: 'Aditi Sharma', role: 'Chief Cost Estimator', avatar: 'AS', status: 'active' },
    { name: 'Vivek Mehta', role: 'General Legal Counsel', avatar: 'VM', status: 'active' },
    { name: 'Anjali Rao', role: 'Compliance Officer', avatar: 'AR', status: 'offline' }
  ];

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      { user: 'You (Manager)', text: newComment, timestamp: 'Just now' },
      ...comments
    ]);
    setNewComment('');
  };

  const handleToggleTask = (id: number) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === 'completed' ? 'in_progress' : 'completed'
        };
      }
      return t;
    }));
  };

  return (
    <div className="space-y-8 select-none text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#334155] pb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#6366F1] p-2.5 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#F8FAFC]">Team Collaboration Workspace</h2>
            <p className="text-xs text-[#94A3B8]">Coordinate bid checklists, safety assignments, and audit discussion feeds</p>
          </div>
        </div>
        <button onClick={() => { setInviteOpen(true); setInviteEmail(''); setCreatedInvitation(null); setInviteError(''); setCopiedLink(false); }} className="bg-[#6366F1] hover:bg-indigo-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-all flex items-center gap-1.5">
          <UserPlus size={13} />
          Invite Associate
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Tasks board (2-span) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111827] border border-[#334155] rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-xs text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-[#6366F1]" />
              Technical Bid Checklists
            </h3>
            
            <div className="divide-y divide-[#334155]/60 space-y-4 pt-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-4 pt-4 first:pt-0 text-xs">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-0.5 text-slate-500 hover:text-indigo-400 shrink-0"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 size={16} className="text-[#10B981]" />
                      ) : (
                        <Circle size={16} />
                      )}
                    </button>
                    <div>
                      <span className={`font-bold block ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-[#F8FAFC]'}`}>
                        {task.title}
                      </span>
                      <span className="text-[10px] text-slate-550 block mt-1">
                        Tender: <strong className="text-slate-400 font-semibold">{task.tenderTitle}</strong> • Assignee: {task.assignee}
                      </span>
                    </div>
                  </div>
                  
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    task.status === 'completed' 
                      ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                      : task.status === 'in_progress'
                        ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20'
                        : 'bg-[#0F172A] text-slate-500 border border-[#334155]'
                  }`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Comment discussion board */}
          <div className="bg-[#111827] border border-[#334155] rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-xs text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={16} className="text-[#6366F1]" />
              Internal Bid Operations Feed
            </h3>

            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Post operational update to team channel..."
                className="flex-1 bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] outline-none"
              />
              <button
                type="submit"
                className="bg-[#6366F1] hover:bg-indigo-650 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all"
              >
                <Send size={13} />
              </button>
            </form>

            <div className="space-y-4 pt-2 max-h-[300px] overflow-y-auto">
              {comments.map((comment, index) => (
                <div key={index} className="bg-[#1E293B] border border-[#334155] p-4 rounded-xl text-left text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-[#F8FAFC]">{comment.user}</span>
                    <span className="text-slate-500 font-mono">{comment.timestamp}</span>
                  </div>
                  <p className="text-[#94A3B8] leading-relaxed">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Member rosters (1-span) */}
        <div className="space-y-6 text-left">
          <div className="bg-[#111827] border border-[#334155] rounded-xl p-6 space-y-4">
            <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider block">Team associates</span>
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-[#334155] flex items-center justify-center font-bold text-indigo-400">
                      {member.avatar}
                    </div>
                    <div>
                      <span className="font-bold text-[#F8FAFC] block">{member.name}</span>
                      <span className="text-[10px] text-slate-550 block mt-0.5">{member.role}</span>
                    </div>
                  </div>

                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      member.status === 'active' ? 'bg-emerald-400' : 'bg-slate-400'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}></span>
                  </span>
                </div>
              ))}
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#334155] bg-slate-800 font-semibold uppercase text-indigo-400">
                      {invitation.email.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate font-semibold text-[#F8FAFC]">{invitation.email}</span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">Team associate</span>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase ${
                    invitation.status === 'accepted'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      : invitation.status === 'expired'
                        ? 'border-[#334155] bg-[#0F172A] text-slate-500'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                  }`}>
                    {invitation.status === 'pending' ? 'Invite pending' : invitation.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setInviteOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="invite-title" className="w-full max-w-lg rounded-2xl border border-[#334155] bg-[#111827] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-[#6366F1]/20 bg-[#6366F1]/10 p-2 text-[#6366F1]"><Mail size={18} /></div>
                <div>
                  <h3 id="invite-title" className="text-base font-semibold text-[#F8FAFC]">Invite a team associate</h3>
                  <p className="mt-1 text-xs text-[#94A3B8]">Create a secure link to share with your teammate.</p>
                </div>
              </div>
              <button type="button" onClick={() => setInviteOpen(false)} aria-label="Close invitation" className="rounded-lg p-1.5 text-slate-400 hover:bg-[#1E293B] hover:text-white"><X size={18} /></button>
            </div>

            {inviteError && <p role="alert" className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{inviteError}</p>}

            {createdInvitation ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400"><CheckCircle2 size={17} /> Invitation created</div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">Share this link with {createdInvitation.email}. It can be used once and expires in 7 days.</p>
                </div>
                <label className="block text-xs font-medium text-slate-400" htmlFor="invite-link">Invitation link</label>
                <input id="invite-link" readOnly value={`${window.location.origin}/?invite=${encodeURIComponent(createdInvitation.token)}`} onFocus={(event) => event.currentTarget.select()} className="company-field text-xs" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setInviteOpen(false)} className="rounded-lg border border-[#334155] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#1E293B]">Close</button>
                  <button type="button" onClick={handleCopyInvite} className="flex items-center gap-2 rounded-lg bg-[#6366F1] px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600">
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}{copiedLink ? 'Copied' : 'Copy invite link'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="associate-email" className="block text-xs font-medium text-slate-300">Work email</label>
                  <input id="associate-email" type="email" required autoFocus value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="name@company.com" className="company-field" />
                </div>
                <p className="text-xs leading-relaxed text-slate-500">The associate will create their own sign-in. The invitation link is private, single-use, and valid for 7 days.</p>
                <div className="flex justify-end gap-2 border-t border-[#334155] pt-4">
                  <button type="button" onClick={() => setInviteOpen(false)} className="rounded-lg border border-[#334155] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#1E293B]">Cancel</button>
                  <button type="submit" disabled={sendingInvite} className="flex items-center gap-2 rounded-lg bg-[#6366F1] px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600 disabled:cursor-wait disabled:opacity-60">
                    <UserPlus size={14} />{sendingInvite ? 'Creating link…' : 'Create invitation'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
