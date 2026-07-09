import { useState, useRef, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { LogOut, ChevronDown, User, Plus } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';

export default function AuthDropdown() {
  const { currentUser, organizations, activeOrganizationId, switchOrganization, createOrganization, handleGoogleLogin, handleLogout } = useSongbook();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [newOrganizationName, setNewOrganizationName] = useState('');
  const [organizationError, setOrganizationError] = useState('');
  const ref = useRef(null);

  const isSignedIn = !!currentUser.email;

  const handleCreateOrganization = async (event) => {
    event.preventDefault();
    setOrganizationError('');
    const name = newOrganizationName.trim();
    if (!name) return;
    try {
      await createOrganization(name);
      setNewOrganizationName('');
    } catch {
      setOrganizationError('Could not create organization.');
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roleBadge = {
    developer: 'text-violet-400 bg-violet-950/40 border-violet-500/30',
    admin:     'text-indigo-400 bg-indigo-950/40 border-indigo-500/30',
    viewer:    'text-gray-500 bg-gray-900/40 border-gray-800',
  }[currentUser.role] ?? 'text-gray-500 bg-gray-900/40 border-gray-800';

  const avatarStyle = {
    developer: 'bg-violet-950/50 text-violet-400 border-violet-500/40',
    admin:     'bg-indigo-950/50 text-indigo-400 border-indigo-500/40',
    viewer:    'bg-gray-900 text-gray-400 border-gray-700',
  }[currentUser.role] ?? 'bg-gray-900 text-gray-400 border-gray-700';

  return (
    <div className="relative shrink-0" ref={ref}>
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1 px-1 py-1 rounded-xl border transition-all ${
          open ? 'bg-white/5 border-white/10' : 'border-transparent hover:bg-white/5'
        }`}
      >
        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black uppercase select-none transition-all ${avatarStyle}`}>
          {isSignedIn ? currentUser.email.charAt(0) : <User className="w-3.5 h-3.5" />}
        </div>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#111219] border border-[#1f212d] rounded-2xl shadow-2xl shadow-black/60 z-[200] overflow-hidden md:left-0 md:right-auto">
          {isSignedIn ? (
            <>
              {/* Signed-in user info */}
              <div className="px-4 py-3.5 border-b border-[#1f212d]">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-base font-black uppercase shrink-0 ${avatarStyle}`}>
                    {currentUser.email.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{currentUser.name || currentUser.email}</p>
                    <p className="text-[11px] text-gray-500 truncate">{currentUser.email}</p>
                    <span className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${roleBadge}`}>
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Switch account */}
              <div className="px-4 py-3 border-b border-[#1f212d] space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Organization</p>
                  {organizations.length > 0 ? (
                    <select
                      value={activeOrganizationId}
                      onChange={(event) => switchOrganization(event.target.value)}
                      className="w-full rounded-xl border border-[#1f212d] bg-gray-950 px-3 py-2 text-xs font-semibold text-gray-200 outline-none focus:border-violet-500"
                    >
                      {organizations.map((organization) => (
                        <option key={organization.id} value={organization.id}>
                          {organization.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-gray-500">Create an organization to start a private songbook.</p>
                  )}
                </div>
                <form onSubmit={handleCreateOrganization} className="flex gap-2">
                  <input
                    type="text"
                    value={newOrganizationName}
                    onChange={(event) => { setNewOrganizationName(event.target.value); setOrganizationError(''); }}
                    placeholder="New organization"
                    className="min-w-0 flex-1 rounded-xl border border-[#1f212d] bg-gray-950 px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-500"
                    aria-label="Create organization"
                    title="Create organization"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </form>
                {organizationError && <p className="text-[10px] text-red-400">{organizationError}</p>}
              </div>

              {/* Switch account */}
              <div className="px-4 py-3 border-b border-[#1f212d]">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Switch Account</p>
                <GoogleLogin
                  onSuccess={async (resp) => {
                    setError('');
                    try { await handleGoogleLogin(resp.credential); setOpen(false); }
                    catch { setError('Sign-in failed. Try again.'); }
                  }}
                  onError={() => setError('Google Sign-In failed.')}
                  theme="filled_black"
                  size="medium"
                  text="continue_with"
                  shape="rectangular"
                />
                {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
              </div>

              {/* Sign out */}
              <button
                onClick={() => { handleLogout(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            /* Not signed in */
            <div className="px-4 py-4 space-y-3">
              <div>
                <p className="text-sm font-bold text-white">Sign In</p>
                <p className="text-xs text-gray-500 mt-0.5">Sign in to save favourites and access your role.</p>
              </div>
              <GoogleLogin
                onSuccess={async (resp) => {
                  setError('');
                  try { await handleGoogleLogin(resp.credential); setOpen(false); }
                  catch { setError('Sign-in failed. Try again.'); }
                }}
                onError={() => setError('Google Sign-In failed.')}
                theme="filled_black"
                size="large"
                text="signin_with"
                shape="rectangular"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
