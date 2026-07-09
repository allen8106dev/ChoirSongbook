import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Plus, Shield, UserRound } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';

export default function Home() {
  const {
    currentUser,
    organizations,
    ownedOrganization,
    createOrganization,
    handleGoogleLogin,
    switchOrganization,
  } = useSongbook();
  const navigate = useNavigate();
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState('');

  const isSignedIn = !!currentUser.email;
  const isDeveloper = currentUser.role === 'developer';

  useEffect(() => {
    if (!isSignedIn || isDeveloper) return;
    if (ownedOrganization && organizations.length === 1) {
      switchOrganization(ownedOrganization.id);
      navigate(`/org/${ownedOrganization.id}`, { replace: true });
    }
  }, [isSignedIn, isDeveloper, ownedOrganization, organizations.length, switchOrganization, navigate]);

  const openOrganization = (organizationId) => {
    switchOrganization(organizationId);
    navigate(`/org/${organizationId}`);
  };

  const handleCreateOrganization = async (event) => {
    event.preventDefault();
    setError('');
    const name = organizationName.trim();
    if (!name) return;

    try {
      const organization = await createOrganization(name);
      setOrganizationName('');
      navigate(`/org/${organization.id}`);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not create organization.');
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl flex-col justify-center py-10">
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-950/30 text-violet-300">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Choir Songbook</h1>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Create or open an organization songbook. Shared organization links are viewable without sign-in.
            </p>
          </div>
        </div>

        {!isSignedIn ? (
          <div className="rounded-3xl border border-[#1f212d] bg-[#111219] p-5">
            <div className="mb-4 flex items-center gap-3">
              <UserRound className="h-5 w-5 text-violet-300" />
              <div>
                <h2 className="text-base font-bold text-white">Sign in</h2>
                <p className="text-xs text-gray-500">Use Google to create your organization.</p>
              </div>
            </div>
            <GoogleLogin
              onSuccess={async (resp) => {
                setError('');
                try {
                  await handleGoogleLogin(resp.credential);
                } catch {
                  setError('Sign-in failed. Try again.');
                }
              }}
              onError={() => setError('Google Sign-In failed.')}
              theme="filled_black"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
            {error && <p className="mt-3 text-sm font-semibold text-red-400">{error}</p>}
          </div>
        ) : (
          <div className="grid gap-4">
            {organizations.length > 0 && (
              <div className="rounded-3xl border border-[#1f212d] bg-[#111219] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <Shield className="h-5 w-5 text-violet-300" />
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {isDeveloper ? 'All organizations' : 'Your organizations'}
                    </h2>
                    <p className="text-xs text-gray-500">Choose an organization to open its songbook.</p>
                  </div>
                </div>
                <div className="grid gap-2">
                  {organizations.map((organization) => (
                    <button
                      key={organization.id}
                      type="button"
                      onClick={() => openOrganization(organization.id)}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[#1f212d] bg-gray-900/30 p-3 text-left transition-colors hover:border-violet-500/40 hover:bg-violet-950/10"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{organization.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {organization.song_count} songs
                          {organization.owner_email?.toLowerCase() === currentUser.email.toLowerCase() ? ' - Owner' : ' - Member'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!ownedOrganization && !isDeveloper && (
              <form onSubmit={handleCreateOrganization} className="rounded-3xl border border-[#1f212d] bg-[#111219] p-5">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-white">Create organization</h2>
                  <p className="mt-1 text-xs text-gray-500">Each account can create one organization.</p>
                </div>
                <div className="grid gap-2 sm:flex">
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(event) => { setOrganizationName(event.target.value); setError(''); }}
                    placeholder="Organization name"
                    className="min-w-0 flex-1 rounded-2xl border border-[#1f212d] bg-gray-950 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-500"
                  >
                    <Plus className="h-4 w-4" /> Create
                  </button>
                </div>
                {error && <p className="mt-3 text-sm font-semibold text-red-400">{error}</p>}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
