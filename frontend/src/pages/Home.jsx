import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Plus, Shield, Trash2, UserRound, X } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';

export default function Home() {
  const {
    currentUser,
    organizations,
    ownedOrganization,
    createOrganization,
    deleteOrganization,
    handleGoogleLogin,
    switchOrganization,
  } = useSongbook();
  const navigate = useNavigate();
  const [organizationName, setOrganizationName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
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

  const handleDeleteOrganization = (organization) => {
    setError('');
    setDeleteConfirm({ id: organization.id, name: '' });
  };

  const handleConfirmDelete = async (organization) => {
    setError('');
    try {
      await deleteOrganization(organization.id, deleteConfirm.name);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not delete organization.');
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
                  const user = await handleGoogleLogin(resp.credential);
                  const ownedOrg = user.organizations?.find(org => org.owner_email?.toLowerCase() === user.email.toLowerCase());
                  const firstOrg = ownedOrg || user.organizations?.[0];
                  if (user.role !== 'developer' && firstOrg) {
                    navigate(`/org/${firstOrg.id}`, { replace: true });
                  }
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
                    <div
                      key={organization.id}
                      className="rounded-2xl border border-[#1f212d] bg-gray-900/30 p-3 transition-colors hover:border-violet-500/40 hover:bg-violet-950/10"
                    >
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                        <button type="button" onClick={() => openOrganization(organization.id)} className="min-w-0 text-left">
                          <p className="truncate text-sm font-bold text-white">{organization.name}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {organization.song_count} songs
                            {isDeveloper ? '' : organization.owner_email?.toLowerCase() === currentUser.email.toLowerCase() ? ' - Owner' : ' - Member'}
                          </p>
                        </button>
                        <div className="flex items-center gap-2">
                          {isDeveloper && (
                            <button
                              type="button"
                              onClick={() => handleDeleteOrganization(organization)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-900/30 bg-red-950/10 text-red-400 hover:bg-red-950/25"
                              title="Delete organization"
                              aria-label="Delete organization"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <button type="button" onClick={() => openOrganization(organization.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:text-gray-300" aria-label="Open organization">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {isDeveloper && deleteConfirm?.id === organization.id && (
                        <div className="mt-3 grid gap-2 border-t border-[#1f212d] pt-3">
                          <p className="text-xs text-red-300">Type the organization name to confirm deletion.</p>
                          <input
                            type="text"
                            value={deleteConfirm.name}
                            onChange={(event) => setDeleteConfirm({ id: organization.id, name: event.target.value })}
                            placeholder={organization.name}
                            className="rounded-xl border border-red-900/30 bg-gray-950 px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(organization)}
                              disabled={deleteConfirm.name !== organization.name}
                              className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <Trash2 className="inline w-3 h-3 mr-1" />Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(null)}
                              className="rounded-xl bg-gray-800 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white transition-colors"
                            >
                              <X className="inline w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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
