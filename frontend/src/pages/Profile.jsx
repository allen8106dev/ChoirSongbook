import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { LogIn, LogOut, Lock, Unlock, ShieldCheck, Terminal, User } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';

export default function Profile() {
  const { currentUser, handleGoogleLogin, handleLogout } = useSongbook();
  const [googleError, setGoogleError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isSignedIn = !!currentUser.email;

  const roleColor = currentUser.role === 'developer'
    ? { bg: 'bg-violet-950/30', text: 'text-violet-400', border: 'border-violet-500/40', shadow: 'shadow-violet-600/10', badge: 'bg-violet-950/40 text-violet-400 border-violet-500/30' }
    : currentUser.role === 'admin'
    ? { bg: 'bg-indigo-950/30', text: 'text-indigo-400', border: 'border-indigo-500/40', shadow: 'shadow-indigo-600/10', badge: 'bg-indigo-950/40 text-indigo-400 border-indigo-500/30' }
    : { bg: 'bg-gray-950', text: 'text-gray-400', border: 'border-gray-800', shadow: '', badge: 'bg-gray-900/60 text-gray-400 border-gray-800' };

  const RoleIcon = currentUser.role === 'developer' ? Terminal : currentUser.role === 'admin' ? ShieldCheck : User;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-white">Account & Role</h2>
        <p className="text-xs text-gray-500">Sign in with your Google account to access your role and permissions</p>
      </div>

      {/* Current Account Status */}
      <div className="p-6 bg-gradient-to-br from-[#12131b] to-[#181923] border border-[#1f212d] rounded-3xl space-y-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border font-bold text-lg uppercase ${roleColor.bg} ${roleColor.text} ${roleColor.border} shadow-lg ${roleColor.shadow}`}>
            {isSignedIn ? currentUser.email.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
              {isSignedIn ? 'Signed In' : 'Not Signed In'}
            </span>
            <h3 className="font-extrabold text-white text-base truncate">
              {isSignedIn ? (currentUser.name || currentUser.email) : 'Guest Viewer'}
            </h3>
            {isSignedIn && (
              <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
            )}
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase mt-1.5 border ${roleColor.badge}`}>
              <RoleIcon className="w-2.5 h-2.5" />
              {currentUser.role} Role
            </span>
          </div>

          {/* Sign Out button (only when signed in) */}
          {isSignedIn && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-red-400 hover:bg-red-950/20 border border-[#1f212d] hover:border-red-900/40 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          )}
        </div>

        {/* Privileges Matrix */}
        <div className="pt-4 border-t border-[#1f212d]/60 space-y-2.5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Access Privileges</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Search & View', allowed: true },
              { label: 'Song CRUD', allowed: currentUser.role !== 'viewer' },
              { label: 'Admin Console', allowed: currentUser.role === 'developer' },
            ].map(({ label, allowed }) => (
              <div key={label} className="p-3 bg-gray-950 rounded-xl flex flex-col gap-1 border border-[#1f212d]/50">
                <span className="text-[10px] text-gray-400 font-semibold">{label}</span>
                <div className={`flex items-center gap-1 font-bold text-[10px] uppercase ${allowed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {allowed ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {allowed ? 'Allowed' : 'Blocked'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Google Sign-In Card */}
      <div className="p-6 bg-[#111219] border border-[#1f212d] rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <LogIn className="w-4 h-4 text-emerald-400" />
          {isSignedIn ? 'Switch Account' : 'Sign In with Google'}
        </h3>
        <p className="text-xs text-gray-400">
          {isSignedIn
            ? 'Sign in with a different Google account to switch roles.'
            : 'Sign in with your Google account. Your role (Viewer / Admin / Developer) is assigned automatically based on your email.'}
        </p>

        <div className="flex justify-center pt-1">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              setGoogleError('');
              handleGoogleLogin(credentialResponse.credential)
                .then((user) => {
                  setSuccessMsg(`Signed in as ${user.email} · ${user.role} role`);
                  setTimeout(() => setSuccessMsg(''), 4000);
                })
                .catch(() => setGoogleError('Sign-in failed. Check that VITE_GOOGLE_CLIENT_ID is configured correctly.'));
            }}
            onError={() => setGoogleError('Google Sign-In failed. Check your Google Client ID configuration.')}
            useOneTap={!isSignedIn}
            theme="filled_black"
            shape="rectangular"
            size="large"
            text={isSignedIn ? 'continue_with' : 'signin_with'}
          />
        </div>

        {successMsg && (
          <p className="text-xs font-bold text-emerald-400 text-center animate-pulse">{successMsg}</p>
        )}
        {googleError && (
          <p className="text-xs font-bold text-red-400 text-center">{googleError}</p>
        )}

        {/* Role explanation */}
        <div className="pt-3 border-t border-[#1f212d]/60 space-y-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">How Roles Work</p>
          <div className="space-y-2">
            {[
              { icon: Terminal, color: 'text-violet-400', label: 'Developer', desc: 'Full access: song management, admin console, tag editor, admin email list.' },
              { icon: ShieldCheck, color: 'text-indigo-400', label: 'Admin', desc: 'Can add/edit/delete songs and upload reference audio tracks.' },
              { icon: User, color: 'text-gray-400', label: 'Viewer', desc: 'Read-only: browse lyrics, search songs, play audio. Default for all others.' },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 bg-gray-950/40 rounded-xl border border-[#1f212d]/50">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                <div>
                  <span className={`text-xs font-bold ${color}`}>{label}</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
