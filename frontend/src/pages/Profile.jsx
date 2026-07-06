import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { User, Shield, ShieldCheck, Terminal, ArrowRight, Lock, Unlock, LogIn } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';

export default function Profile() {
  const { currentUser, changeSimulatedUser, adminEmails, handleGoogleLogin } = useSongbook();
  const [customEmail, setCustomEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [googleError, setGoogleError] = useState('');

  // Handle custom login simulation
  const handleSimulate = (e) => {
    e.preventDefault();
    const email = customEmail.trim().toLowerCase();
    if (!email) return;

    changeSimulatedUser(email);
    setCustomEmail('');
    
    // Determine target role for notice
    let role = 'Viewer';
    if (email === 'allen@example.com') role = 'Developer';
    else if (adminEmails.includes(email)) role = 'Admin';
    
    setSuccessMsg(`Simulated sign-in as ${email} (${role})`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Pre-configured simulation profiles
  const quickProfiles = [
    {
      email: 'allen@example.com',
      role: 'developer',
      label: 'Developer Account',
      desc: 'Full console settings, tag deletions, and admin emails editor.',
      icon: Terminal,
      color: 'border-violet-500/50 hover:bg-violet-950/20 text-violet-400'
    },
    {
      email: 'admin@choir.org',
      role: 'admin',
      label: 'Choir Admin Account',
      desc: 'Can edit songs, add new titles, upload tracks. Restricted settings.',
      icon: ShieldCheck,
      color: 'border-indigo-500/50 hover:bg-indigo-950/20 text-indigo-400'
    },
    {
      email: 'singer@church.org',
      role: 'viewer',
      label: 'General Choir Member',
      desc: 'Can search/view lyrics, size font, play audio tracks. Read only.',
      icon: User,
      color: 'border-gray-700 hover:bg-gray-800/40 text-gray-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-white">Identity & Roles</h2>
        <p className="text-xs text-gray-500">Switch user accounts to preview different access rules and view scopes</p>
      </div>

      {/* Current Active Account Status */}
      <div className="p-6 bg-gradient-to-br from-[#12131b] to-[#181923] border border-[#1f212d] rounded-3xl space-y-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border font-bold text-lg uppercase ${
            currentUser.role === 'developer'
              ? 'bg-violet-950/30 text-violet-400 border-violet-500/40 shadow-lg shadow-violet-600/10'
              : currentUser.role === 'admin'
              ? 'bg-indigo-950/30 text-indigo-400 border-indigo-500/40 shadow-lg shadow-indigo-600/10'
              : 'bg-gray-950 text-gray-400 border-gray-800'
          }`}>
            {currentUser.email ? currentUser.email.charAt(0) : 'G'}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Active Credentials</span>
            <h3 className="font-extrabold text-white text-base truncate">{currentUser.email || 'Guest Member'}</h3>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase mt-1 border ${
              currentUser.role === 'developer'
                ? 'bg-violet-950/40 text-violet-400 border-violet-500/30'
                : currentUser.role === 'admin'
                ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/30'
                : 'bg-gray-900/60 text-gray-400 border-gray-800'
            }`}>
              {currentUser.role} Role
            </span>
          </div>
        </div>

        {/* Feature Access Matrix */}
        <div className="pt-4 border-t border-[#1f212d]/60 space-y-2.5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Your Privileges Matrix</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-gray-950 rounded-xl flex flex-col gap-1 border border-[#1f212d]/50">
              <span className="text-[10px] text-gray-400 font-semibold">Search & View</span>
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase">
                <Unlock className="w-3 h-3" /> Allowed
              </div>
            </div>
            <div className="p-3 bg-gray-950 rounded-xl flex flex-col gap-1 border border-[#1f212d]/50">
              <span className="text-[10px] text-gray-400 font-semibold">Song CRUD</span>
              {currentUser.role !== 'viewer' ? (
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase">
                  <Unlock className="w-3 h-3" /> Allowed
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-400 font-bold text-[10px] uppercase">
                  <Lock className="w-3 h-3" /> Blocked
                </div>
              )}
            </div>
            <div className="p-3 bg-gray-950 rounded-xl flex flex-col gap-1 border border-[#1f212d]/50">
              <span className="text-[10px] text-gray-400 font-semibold">Admin Panel</span>
              {currentUser.role === 'developer' ? (
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase">
                  <Unlock className="w-3 h-3" /> Allowed
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-400 font-bold text-[10px] uppercase">
                  <Lock className="w-3 h-3" /> Blocked
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Google Sign-In Card */}
      <div className="p-6 bg-[#111219] border border-[#1f212d] rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <LogIn className="w-4 h-4 text-emerald-400" /> Sign In with Google
        </h3>
        <p className="text-xs text-gray-400">
          Sign in with your real Google account. Your role is determined by whether your email is in the Admin list.
        </p>
        <div className="flex justify-center pt-1">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              setGoogleError('');
              handleGoogleLogin(credentialResponse.credential)
                .then(() => setSuccessMsg('Signed in with Google successfully!'))
                .catch(() => setGoogleError('Sign-in failed. Your email may not be authorised or Google Client ID is not configured yet.'));
              setTimeout(() => setSuccessMsg(''), 3000);
            }}
            onError={() => setGoogleError('Google Sign-In failed. Make sure VITE_GOOGLE_CLIENT_ID is configured.')}
            useOneTap
            theme="filled_black"
            shape="rectangular"
            size="large"
            text="signin_with"
          />
        </div>
        {googleError && (
          <p className="text-xs font-bold text-red-400 text-center">{googleError}</p>
        )}
        {successMsg && (
          <p className="text-xs font-bold text-emerald-400 text-center animate-pulse">{successMsg}</p>
        )}
      </div>

      {/* Simulation Trigger Form */}
      <div className="p-6 bg-[#111219] border border-[#1f212d] rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" /> Switch Accounts
        </h3>
        <p className="text-xs text-gray-400">
          Enter any email below. The system checks if it is in the Admin list or matches the Developer email.
        </p>

        {/* Custom Input */}
        <form onSubmit={handleSimulate} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. director@choir.org"
            value={customEmail}
            onChange={(e) => setCustomEmail(e.target.value)}
            className="flex-1 px-4 py-3.5 bg-gray-950 border border-[#1f212d] focus:border-violet-500 rounded-2xl text-xs placeholder-gray-600 focus:outline-none transition-all shadow-inner"
          />
          <button
            type="submit"
            className="px-4 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-2xl transition-colors shrink-0"
          >
            Sign-in
          </button>
        </form>

        {successMsg && (
          <p className="text-xs font-bold text-emerald-400 text-center animate-pulse">{successMsg}</p>
        )}

        {/* Preset profiles lists */}
        <div className="pt-2.5 border-t border-[#1f212d]/60 space-y-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Simulation Profiles Preset</p>
          <div className="grid gap-2">
            {quickProfiles.map((prof) => (
              <button
                key={prof.email}
                onClick={() => {
                  changeSimulatedUser(prof.email);
                  setSuccessMsg(`Simulated sign-in as ${prof.email} (${prof.role})`);
                  setTimeout(() => setSuccessMsg(''), 2500);
                }}
                className={`w-full text-left p-3.5 bg-gray-950/40 hover:bg-gray-900 border rounded-2xl flex items-start gap-3.5 transition-all group ${prof.color}`}
              >
                <div className="p-2 rounded-xl bg-gray-900 border border-white/5 group-hover:scale-105 transition-transform">
                  <prof.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white leading-tight">{prof.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-gray-400" />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate">{prof.email}</p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal font-medium">{prof.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
