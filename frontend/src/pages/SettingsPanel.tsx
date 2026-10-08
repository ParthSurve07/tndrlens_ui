import React, { useEffect, useState } from 'react';
import { Check, Palette, RotateCcw, UserRound, Pencil, Save, X } from 'lucide-react';
import { THEME_PRESETS } from '../App';
import { api, getAuthToken } from '../services/api';

interface SettingsPanelProps {
  initialSection: 'appearance' | 'account';
  activeWorkspace: string;
  onProfileUpdated: () => void;
  preset: string;
  setPreset: (value: string) => void;
  setThemeMode: (value: string) => void;
  fontFamily: string;
  setFontFamily: (value: string) => void;
  setFontWeight: (value: string) => void;
  setLetterSpacing: (value: string) => void;
  setLineHeight: (value: string) => void;
  setComponentStyle: (value: string) => void;
  setAnimationSpeed: (value: string) => void;
  setSidebarStyle: (value: string) => void;
  setCardStyle: (value: string) => void;
  setButtonStyle: (value: string) => void;
  setIconStyle: (value: string) => void;
  density: string;
  setDensity: (value: string) => void;
  setCustomPrimary: (value: string) => void;
  setCustomBg: (value: string) => void;
  setCustomSurface: (value: string) => void;
  setCustomText: (value: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = (props) => {
  const [activeSection, setActiveSection] = useState<'appearance' | 'account'>(props.initialSection);
  const [account, setAccount] = useState({
    id: '',
    username: localStorage.getItem('username') || 'User',
    email: '',
    role: localStorage.getItem('role') || 'Member',
  });
  const [profileDraft, setProfileDraft] = useState({ username: '', email: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const theme = THEME_PRESETS[props.preset] || THEME_PRESETS['dark-professional'];
  const fieldClass = 'w-full rounded-lg border border-slate-border bg-card-bg px-3 py-2.5 text-sm text-[var(--text-color)] outline-none focus:ring-2 focus:ring-[var(--accent-color)]';

  useEffect(() => {
    setActiveSection(props.initialSection);
  }, [props.initialSection]);

  useEffect(() => {
    if (activeSection !== 'account') return;
    let mounted = true;
    api.getMe().then((user) => {
      if (mounted) setAccount({ id: String(user.id ?? ''), username: user.username || 'User', email: user.email || '', role: user.role || 'Member' });
    }).catch(() => {
      // Keep the locally available username and role when account lookup is unavailable.
    });
    return () => { mounted = false; };
  }, [activeSection]);

  const startEditingProfile = () => {
    setProfileDraft({ username: account.username, email: account.email });
    setProfileMessage('');
    setIsEditingProfile(true);
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage('');
    try {
      const updated = await api.updateMe({
        username: profileDraft.username.trim(),
        email: profileDraft.email.trim(),
      });
      setAccount({ id: String(updated.id ?? account.id), username: updated.username, email: updated.email, role: updated.role });
      setIsEditingProfile(false);
      setProfileMessage('Account details saved.');
      props.onProfileUpdated();
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : 'Could not save account details.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const restoreDefaults = () => {
    props.setPreset('dark-professional');
    props.setThemeMode('dark-professional');
    props.setFontFamily('Inter');
    props.setFontWeight('500');
    props.setLetterSpacing('normal');
    props.setLineHeight('normal');
    props.setComponentStyle('soft');
    props.setAnimationSpeed('balanced');
    props.setSidebarStyle('classic');
    props.setCardStyle('glass');
    props.setButtonStyle('soft');
    props.setIconStyle('outlined');
    props.setDensity('comfortable');
    props.setCustomPrimary('#3B82F6');
    props.setCustomBg('#0F172A');
    props.setCustomSurface('#111827');
    props.setCustomText('#F8FAFC');
  };

  return (
    <section className="space-y-6 text-left">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-accent"><Palette size={18} /><span className="text-xs font-semibold uppercase tracking-wide">Preferences</span></div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-color)]">Settings</h1>
          <p className="mt-1 text-sm text-slate-400">Manage how Tndrlens looks and review your account.</p>
        </div>
        {activeSection === 'appearance' && <button type="button" onClick={restoreDefaults} className="inline-flex items-center gap-2 rounded-lg border border-slate-border px-3 py-2 text-sm font-medium text-[var(--text-color)] transition hover:bg-card-bg"><RotateCcw size={15} /> Restore defaults</button>}
      </header>

      <nav aria-label="Settings sections" className="flex gap-1 border-b border-slate-border">
        {(['appearance', 'account'] as const).map((section) => (
          <button key={section} type="button" onClick={() => setActiveSection(section)} aria-current={activeSection === section ? 'page' : undefined}
            className={`border-b-2 px-4 py-3 text-sm font-medium capitalize transition ${activeSection === section ? 'border-accent text-accent' : 'border-transparent text-slate-400 hover:text-[var(--text-color)]'}`}>
            {section === 'appearance' ? 'Appearance' : 'Account'}
          </button>
        ))}
      </nav>

      {activeSection === 'appearance' ? (
        <div className="max-w-4xl space-y-5">
          <section className="rounded-xl border border-slate-border bg-surface p-5">
            <div className="mb-4"><h2 className="text-base font-semibold text-[var(--text-color)]">Color theme</h2><p className="mt-1 text-sm text-slate-400">Choose a theme for the workspace. Your choice saves automatically.</p></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(THEME_PRESETS).map(([name, colors]) => {
                const selected = props.preset === name;
                const label = name === 'dark-professional' ? 'Dark' : name === 'light-professional' ? 'Light' : 'Graphite';
                return <button key={name} type="button" aria-pressed={selected} onClick={() => { props.setPreset(name); props.setThemeMode(name); }}
                  className={`rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${selected ? 'border-accent ring-1 ring-[var(--accent-color)]' : 'border-slate-border hover:border-accent'}`}>
                  <div className="mb-3 flex h-12 items-end gap-1.5 rounded-md border p-2" style={{ background: colors.bg, borderColor: colors.border }}>
                    <span className="h-5 w-1/2 rounded-sm" style={{ background: colors.surface }} /><span className="h-3 w-1/4 rounded-sm" style={{ background: colors.accent }} /><span className="h-4 w-1/5 rounded-sm" style={{ background: colors.card }} />
                  </div>
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold text-[var(--text-color)]">{label}</span>{selected && <Check size={16} className="text-accent" />}</div>
                </button>;
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-border bg-surface p-5">
            <div className="mb-4"><h2 className="text-base font-semibold text-[var(--text-color)]">Reading preferences</h2><p className="mt-1 text-sm text-slate-400">Adjust text and spacing across the workspace.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-[var(--text-color)]">Font family
                <select value={props.fontFamily} onChange={(event) => props.setFontFamily(event.target.value)} className={fieldClass}>
                  <option value="Inter">Inter</option><option value="Roboto">Roboto</option><option value="IBM Plex Sans">IBM Plex Sans</option><option value="System UI">System default</option><option value="SF Pro">SF Pro</option>
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-[var(--text-color)]">Interface spacing
                <select value={props.density} onChange={(event) => props.setDensity(event.target.value)} className={fieldClass}>
                  <option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="large">Spacious</option>
                </select>
              </label>
            </div>
            <div className="mt-4 rounded-lg border border-slate-border bg-card-bg p-3 text-sm" style={{ color: theme.muted }}>
              Preview: <span style={{ color: theme.text, fontFamily: props.fontFamily }}>Tender title</span> · Supporting details
            </div>
          </section>
        </div>
      ) : (
        <section className="max-w-4xl rounded-xl border border-slate-border bg-surface p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3"><span className="rounded-full border border-slate-border bg-card-bg p-2 text-accent"><UserRound size={18} /></span><div><h2 className="text-base font-semibold text-[var(--text-color)]">Your account</h2><p className="mt-1 text-sm text-slate-400">Manage your sign-in profile and review account access.</p></div></div>
            {!isEditingProfile && <button type="button" onClick={startEditingProfile} className="inline-flex items-center gap-2 rounded-lg border border-slate-border px-3 py-2 text-sm font-medium text-[var(--text-color)] hover:border-accent"><Pencil size={14} /> Edit profile</button>}
          </div>

          {isEditingProfile ? (
            <form onSubmit={saveProfile} className="space-y-4 border-t border-slate-border pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-[var(--text-color)]">Username<input required minLength={2} maxLength={80} autoComplete="username" className={fieldClass} value={profileDraft.username} onChange={(event) => setProfileDraft({ ...profileDraft, username: event.target.value })} /></label>
                <label className="space-y-1.5 text-sm font-medium text-[var(--text-color)]">Email<input required type="email" autoComplete="email" className={fieldClass} value={profileDraft.email} onChange={(event) => setProfileDraft({ ...profileDraft, email: event.target.value })} /></label>
              </div>
              <p className="text-xs text-slate-400">Changing your username refreshes your current sign-in session.</p>
              <div className="flex flex-wrap items-center gap-2">
                <button type="submit" disabled={isSavingProfile} className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"><Save size={14} />{isSavingProfile ? 'Saving…' : 'Save changes'}</button>
                <button type="button" disabled={isSavingProfile} onClick={() => { setIsEditingProfile(false); setProfileMessage(''); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-border px-3 py-2 text-sm font-medium text-[var(--text-color)]"><X size={14} /> Cancel</button>
              </div>
              {profileMessage && <p role="status" className={`text-sm ${profileMessage === 'Account details saved.' ? 'text-emerald-400' : 'text-rose-400'}`}>{profileMessage}</p>}
            </form>
          ) : (
            <>
              <div className="grid gap-x-8 sm:grid-cols-2">
                <div className="border-t border-slate-border py-4"><p className="text-xs text-slate-400">Username</p><p className="mt-1 text-sm font-medium text-[var(--text-color)]">{account.username}</p></div>
                <div className="border-t border-slate-border py-4"><p className="text-xs text-slate-400">Email</p><p className="mt-1 break-all text-sm font-medium text-[var(--text-color)]">{account.email || 'Not available'}</p></div>
                {account.id && <div className="border-t border-slate-border py-4"><p className="text-xs text-slate-400">Account ID <span className="ml-1">· Managed by Tndrlens</span></p><p className="mt-1 text-sm font-medium text-[var(--text-color)]">{account.id}</p></div>}
                <div className="border-t border-slate-border py-4"><p className="text-xs text-slate-400">Role <span className="ml-1">· Managed by your administrator</span></p><p className="mt-1 text-sm font-medium capitalize text-[var(--text-color)]">{account.role}</p></div>
                <div className="border-t border-slate-border py-4"><p className="text-xs text-slate-400">Current workspace</p><p className="mt-1 text-sm font-medium text-[var(--text-color)]">{props.activeWorkspace}</p><p className="mt-1 text-xs text-slate-400">Change workspaces using the selector in the top bar.</p></div>
                <div className="border-t border-slate-border py-4"><p className="text-xs text-slate-400">Session</p><p className="mt-1 flex items-center gap-2 text-sm font-medium text-[var(--text-color)]"><span className={`h-2 w-2 rounded-full ${getAuthToken() ? 'bg-emerald-500' : 'bg-rose-500'}`} />{getAuthToken() ? 'Signed in' : 'Not signed in'}</p></div>
              </div>
              {profileMessage && <p role="status" className="mt-3 text-sm text-emerald-400">{profileMessage}</p>}
            </>
          )}
        </section>
      )}
    </section>
  );
};
