import { useNavigate } from 'react-router-dom';
import { Star, ChevronRight, Video, LogIn } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';

export default function Profile() {
  const { currentUser, songs, favourites, toggleFavourite, activeOrganizationId } = useSongbook();
  const navigate = useNavigate();

  const isSignedIn = !!currentUser.email;

  const favouriteSongs = songs.filter(s => favourites.includes(s.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Favourites</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {isSignedIn
            ? `${favouriteSongs.length} starred song${favouriteSongs.length !== 1 ? 's' : ''}`
            : 'Sign in to save your favourite songs'}
        </p>
      </div>

      {/* Not signed in state */}
      {!isSignedIn && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 border border-dashed border-[#1f212d] rounded-3xl bg-[#111219]/20">
          <div className="w-14 h-14 rounded-2xl bg-violet-950/30 border border-violet-500/20 flex items-center justify-center">
            <LogIn className="w-6 h-6 text-violet-400" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-white font-bold">Sign in to use Favourites</p>
            <p className="text-sm text-gray-500">Tap the avatar in the top-right corner to sign in with Google.</p>
          </div>
        </div>
      )}

      {/* Signed in — empty favourites */}
      {isSignedIn && favouriteSongs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 border border-dashed border-[#1f212d] rounded-3xl bg-[#111219]/20">
          <div className="w-14 h-14 rounded-2xl bg-yellow-950/20 border border-yellow-700/20 flex items-center justify-center">
            <Star className="w-6 h-6 text-yellow-500/50" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-white font-bold">No favourites yet</p>
            <p className="text-sm text-gray-500">Tap the ☆ star on any song to add it here.</p>
          </div>
          <button
            onClick={() => navigate(activeOrganizationId ? `/org/${activeOrganizationId}` : '/')}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Browse Songbook
          </button>
        </div>
      )}

      {/* Favourites list */}
      {isSignedIn && favouriteSongs.length > 0 && (
        <div className="space-y-1.5">
          {favouriteSongs.map(song => (
            <div
              key={song.id}
              onClick={() => navigate(`/org/${activeOrganizationId}/song/${song.id}`)}
              className="flex items-center justify-between px-3.5 py-2.5 bg-[#111219] hover:bg-[#161722] border border-[#1f212d]/70 hover:border-violet-500/30 rounded-xl cursor-pointer transition-all duration-150 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Song number */}
                <div className="w-8 h-8 rounded-lg bg-gray-900 border border-white/5 flex items-center justify-center font-bold text-[10px] text-gray-500 shrink-0 group-hover:bg-violet-950/20 group-hover:text-violet-400 transition-colors">
                  {song.number}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-tight group-hover:text-violet-400 transition-colors truncate">
                    {song.title}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {song.languages?.map(l => (
                      <span key={l} className="text-[9px] font-bold text-violet-400 bg-violet-950/20 border border-violet-900/30 px-1.5 py-0.5 rounded">{l}</span>
                    ))}
                    {song.categories?.map(c => (
                      <span key={c} className="text-[9px] font-bold text-indigo-400 bg-indigo-950/20 border border-indigo-900/30 px-1.5 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-2">
                {song.audioUrl && <Video className="w-3.5 h-3.5 text-red-400" />}
                {/* Un-star button */}
                <button
                  onClick={e => { e.stopPropagation(); toggleFavourite(song.id); }}
                  className="p-1 rounded-lg text-yellow-400 hover:bg-yellow-950/20 transition-colors"
                  title="Remove from favourites"
                >
                  <Star className="w-4 h-4 fill-yellow-400" />
                </button>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
