'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { FileText, Lock, User, Mail, Shield, AlertCircle, CheckCircle } from 'lucide-react';

const registerSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().default('company'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterProps {
  onRegisterSuccess?: () => void;
  onGoToLogin?: () => void;
  inviteToken?: string;
}

export const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onGoToLogin, inviteToken: initialInviteToken }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = initialInviteToken || searchParams.get('invite') || undefined;

  const [inviteStatus, setInviteStatus] = useState<'loading' | 'pending' | 'expired' | 'accepted' | 'invalid'>(inviteToken ? 'loading' : 'pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: inviteToken ? 'employee' : 'company',
    }
  });

  useEffect(() => {
    if (!inviteToken) return;
    api.getTeamInvitation(inviteToken)
      .then((invitation) => {
        setValue('email', invitation.email);
        setValue('role', 'employee');
        setInviteStatus(invitation.status);
      })
      .catch((err: Error) => {
        setInviteStatus('invalid');
        setError(err.message);
      });
  }, [inviteToken, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (inviteToken) {
        if (inviteStatus !== 'pending') {
          setError('This invitation is no longer active. Ask your teammate to send a new link.');
          return;
        }
        await api.acceptTeamInvitation(inviteToken, data.username, data.password);
        setSuccess('Invitation accepted. Your account is ready — redirecting to sign in…');
      } else {
        await api.register(data.username, data.email, data.password, data.role);
        setSuccess('Account created successfully! Redirecting...');
      }
      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess();
        } else {
          router.push('/login');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    if (onGoToLogin) {
      onGoToLogin();
    } else {
      router.push('/login');
    }
  };

  const displayError = error || errors.username?.message || errors.email?.message || errors.password?.message;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative select-none">
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 text-white p-3 rounded-2xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <h2 className="text-xl font-bold mt-4 text-slate-100">{inviteToken ? 'Join your team' : 'Create Account'}</h2>
          <p className="text-xs text-slate-400 mt-1">{inviteToken ? 'Create your account to accept this team invitation.' : 'Join the bid decision-support platform'}</p>
        </div>

        {displayError && (
          <div className="bg-rose-950/40 border border-rose-900/50 rounded-xl p-3.5 mb-5 flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle size={16} className="shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-xl p-3.5 mb-5 flex items-center gap-3 text-emerald-300 text-xs">
            <CheckCircle size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {inviteToken && inviteStatus !== 'pending' && inviteStatus !== 'loading' && !error && (
          <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300">
            {inviteStatus === 'accepted'
              ? 'This invitation has already been used. Sign in if you already created your account.'
              : 'This invitation has expired. Ask your teammate to send a new link.'}
          </div>
        )}

        {inviteToken && inviteStatus === 'loading' && (
          <p role="status" className="mb-5 text-center text-xs text-slate-400">Checking invitation…</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                {...register('username')}
                placeholder="Choose username"
                className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="email"
                {...register('email')}
                readOnly={Boolean(inviteToken)}
                placeholder="Enter email address"
                className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="password"
                {...register('password')}
                placeholder="Create password"
                className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors duration-200"
              />
            </div>
          </div>

          {!inviteToken && <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Select Platform Role</label>
            <div className="relative">
              <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select
                {...register('role')}
                className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition-colors duration-200 appearance-none cursor-pointer"
              >
                <option value="company">Company Profile Manager</option>
                <option value="admin">Platform Admin</option>
                <option value="manager">Bid Manager</option>
                <option value="employee">Bid Reviewer / Employee</option>
              </select>
            </div>
          </div>}

          {inviteToken && <p className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400">Team role: Associate</p>}

          <button
            type="submit"
            disabled={loading || (Boolean(inviteToken) && inviteStatus !== 'pending')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3.5 font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-98 flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Creating account...' : inviteToken ? 'Accept invitation' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button onClick={handleGoToLogin} className="text-indigo-400 font-semibold hover:underline">
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
};
