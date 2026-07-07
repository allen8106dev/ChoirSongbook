import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Play, Pause, Volume2, Type, Globe, Tag, Sparkles, Maximize2, Minimize2, Star } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';

function SongTagGroup({ label, items, toneClassName }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span key={item} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${toneClassName}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function SongInfoPopover({ song, buttonClassName = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((value) => !value);
        }}
        aria-label="Show song info"
        aria-expanded={isOpen}
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[11px] font-black text-gray-300 transition-colors hover:border-violet-500/40 hover:text-white hover:bg-violet-950/30 ${buttonClassName}`}
      >
        i
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-[#26293a] bg-[#0f1118] p-3 text-left shadow-2xl shadow-black/40">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Song name</p>
              <p className="text-sm font-bold leading-snug text-white break-words">{song.title}</p>
            </div>

            <SongTagGroup
              label="Languages"
              items={song.languages || []}
              toneClassName="text-violet-300 bg-violet-950/30 border-violet-900/30"
            />

            <SongTagGroup
              label="Categories"
              items={song.categories || []}
              toneClassName="text-indigo-300 bg-indigo-950/30 border-indigo-900/30"
            />

            {(!song.languages || song.languages.length === 0) && (!song.categories || song.categories.length === 0) && (
              <p className="text-xs text-gray-500">No tags available for this song.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Parse "=== Heading ===\ntext" format into sections array
function parseLyricSections(raw) {
  if (!raw) return [{ heading: '', text: '' }];
  const sectionRegex = /^===\s*(.+?)\s*===/m;
  if (!sectionRegex.test(raw)) return [{ heading: '', text: raw }];
  const parts = raw.split(/\n*===\s*(.+?)\s*===\n*/);
  const sections = [];
  for (let i = 1; i < parts.length; i += 2) {
    sections.push({ heading: parts[i] || '', text: (parts[i + 1] || '').trim() });
  }
  return sections.length > 0 ? sections : [{ heading: '', text: raw }];
}

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { songs, currentUser, isLoading, toggleFavourite, isFavourite } = useSongbook();

  const song = songs.find(s => s.id === id);

  const [fontSize, setFontSize] = useState(18);
  const [activeLyricSection, setActiveLyricSection] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef(null);

  const lyricSections = song ? parseLyricSections(song.lyrics) : [{ heading: '', text: '' }];

  // Smooth section switch with fade animation
  const switchSection = (idx) => {
    if (idx === activeLyricSection) return;
    setAnimating(true);
    setTimeout(() => {
      setActiveLyricSection(idx);
      setAnimating(false);
    }, 180);
  };

  // Enter / exit fullscreen
  const enterFullscreen = () => {
    setIsFullscreen(true);
    // Try native fullscreen API (hides browser chrome on Android)
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    // Lock body scroll
    document.body.style.overflow = 'hidden';
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
    document.body.style.overflow = '';
  };

  // Escape key + native fullscreen change both exit
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') exitFullscreen(); };
    const onFsChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setIsFullscreen(false);
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.body.style.overflow = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-violet-600/30 border-t-violet-500 animate-spin" />
        <p className="text-gray-400 text-sm font-medium animate-pulse">Loading song details...</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold text-white">Song not found</h2>
        <p className="text-gray-400">The song you are looking for does not exist or was deleted.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-violet-400 font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Songbook
        </Link>
      </div>
    );
  }

  const isAtLeastAdmin = currentUser.role === 'admin' || currentUser.role === 'developer';

  const increaseFontSize = () => setFontSize(p => Math.min(p + 2, 36));
  const decreaseFontSize = () => setFontSize(p => Math.max(p - 2, 12));

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(err => console.log('Playback error:', err));
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
  const handleLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };
  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };
  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };
  const handleAudioEnded = () => { setIsPlaying(false); setCurrentTime(0); };

  const formatTime = (t) => {
    if (isNaN(t)) return '0:00';
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ─── Shared lyric content (used in both normal and fullscreen view) ──────
  const LyricBody = ({ fullscreen = false }) => (
    <div
      key={activeLyricSection}
      style={{ fontSize: `${fullscreen ? Math.max(fontSize, 20) : fontSize}px` }}
      className={`lyrics-text font-serif text-gray-100 leading-relaxed tracking-normal whitespace-pre-wrap transition-opacity duration-200 ${animating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
    >
      {lyricSections[activeLyricSection]?.text || ''}
    </div>
  );

  // ─── Section tab strip ───────────────────────────────────────────────────
  const SectionTabs = ({ size = 'sm' }) => lyricSections.length > 1 ? (
    <div className="flex items-center gap-1 flex-wrap">
      {lyricSections.map((section, idx) => (
        <button
          key={idx}
          onClick={() => switchSection(idx)}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-200 cursor-pointer ${
            size === 'sm' ? 'text-xs' : 'text-sm'
          } ${
            activeLyricSection === idx
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          {section.heading || `Section ${idx + 1}`}
        </button>
      ))}
    </div>
  ) : null;

  // ─── Fullscreen overlay (portaled to document.body) ─────────────────────
  const fullscreenOverlay = isFullscreen ? createPortal(
    <div
      className="flex flex-col bg-[#080910]"
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-black text-violet-400 bg-violet-950/40 border border-violet-900/30 px-2 py-0.5 rounded shrink-0">
            {song.number}
          </span>
          <span className="text-sm font-bold text-white overflow-hidden whitespace-nowrap text-clip">{song.title}</span>
          <SongInfoPopover song={song} buttonClassName="bg-white/5 border-white/10 text-gray-300" />
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          <SectionTabs size="sm" />
          {/* Font controls */}
          <div className="flex items-center gap-1">
            <button onClick={decreaseFontSize} disabled={fontSize <= 12} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 font-bold border border-white/10 flex items-center justify-center text-[10px] text-gray-300">A-</button>
            <button onClick={increaseFontSize} disabled={fontSize >= 36} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 font-bold border border-white/10 flex items-center justify-center text-[10px] text-gray-300">A+</button>
          </div>
          <button
            onClick={exitFullscreen}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-red-950/30 border border-white/10 hover:border-red-900/40 text-gray-300 hover:text-red-400 text-xs font-bold transition-all"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Lyrics body — full remaining height, scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-6 md:px-16 md:py-10">
        <LyricBody fullscreen />
      </div>
    </div>,
    document.body
  ) : null;

  // ─── Normal view ─────────────────────────────────────────────────────────
  return (
    <>
    {fullscreenOverlay}
    <div className="space-y-4 pb-12">
      <div className="z-30">
        {/* Top Navbar */}
        <div className="flex items-center justify-between border-b border-[#1f212d] pb-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#111219] flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /><span>Back</span>
          </button>

          {isAtLeastAdmin && (
            <button
              onClick={() => navigate(`/admin/edit/${song.id}`)}
              className="p-2 bg-[#111219] border border-[#1f212d] hover:border-violet-500/40 rounded-xl text-gray-300 hover:text-violet-400 transition-all flex items-center justify-center"
              title="Edit Song"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Compact Title Row */}
        <div className="flex items-center gap-3 flex-wrap pt-3">
          <span className="text-[10px] font-black text-violet-400 bg-violet-950/40 border border-violet-900/30 px-2 py-0.5 rounded shrink-0">
            No. {song.number}
          </span>
          <h1 className="text-lg font-extrabold text-white tracking-tight leading-tight flex-1 min-w-0 overflow-hidden whitespace-nowrap text-clip">
            {song.title}
          </h1>
          <div className="flex items-center gap-1.5 shrink-0">
            <SongInfoPopover song={song} />
            {currentUser.email && (
              <button
                onClick={() => toggleFavourite(song.id)}
                title={isFavourite(song.id) ? 'Remove from favourites' : 'Add to favourites'}
                className={`p-1.5 rounded-xl border transition-all ${
                  isFavourite(song.id)
                    ? 'text-yellow-400 bg-yellow-950/20 border-yellow-700/30'
                    : 'text-gray-500 bg-transparent border-[#1f212d] hover:text-yellow-400 hover:border-yellow-700/30'
                }`}
              >
                <Star className={`w-4 h-4 ${isFavourite(song.id) ? 'fill-yellow-400' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Lyrics Card */}
      <div className="glass-panel border border-[#1f212d] rounded-3xl overflow-hidden">
        {/* Card toolbar: section tabs + font controls + fullscreen */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#1f212d]/60 bg-[#0e0f16]/60 flex-wrap">
          {/* Section tabs */}
          <SectionTabs size="sm" />
          {lyricSections.length === 1 && (
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
              <Type className="w-3 h-3" /> Lyrics
            </span>
          )}

          {/* Right controls */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Font controls */}
            <div className="flex items-center gap-1">
              <button onClick={decreaseFontSize} disabled={fontSize <= 12} className="w-7 h-7 rounded-lg bg-[#111219] hover:bg-[#1a1b26] disabled:opacity-40 font-bold border border-[#1f212d] flex items-center justify-center text-[10px] text-gray-400">A-</button>
              <span className="text-[10px] font-bold text-gray-500 px-1 min-w-[32px] text-center">{fontSize}px</span>
              <button onClick={increaseFontSize} disabled={fontSize >= 36} className="w-7 h-7 rounded-lg bg-[#111219] hover:bg-[#1a1b26] disabled:opacity-40 font-bold border border-[#1f212d] flex items-center justify-center text-[10px] text-gray-400">A+</button>
            </div>

            {/* Fullscreen button */}
            <button
              onClick={enterFullscreen}
              title="Fullscreen lyrics"
              className="w-7 h-7 rounded-lg bg-[#111219] hover:bg-violet-950/30 hover:border-violet-500/40 border border-[#1f212d] flex items-center justify-center text-gray-400 hover:text-violet-400 transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Lyrics body */}
        <div className="px-6 py-6 md:px-10 md:py-8">
          <LyricBody />
        </div>
      </div>

      {/* Audio Player */}
      {song.audioUrl ? (
        <div className="p-4 bg-[#111219]/90 backdrop-blur-md border border-[#1f212d] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xl">
          <audio
            ref={audioRef}
            src={song.audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleAudioEnded}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-11 h-11 rounded-full bg-violet-600 hover:bg-violet-500 hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all shadow-md shadow-violet-600/20"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" /> Reference Track
              </span>
              <p className="text-[10px] text-gray-500 font-medium">Click play to listen to tune</p>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-[10px] text-gray-500 font-mono w-8 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 accent-violet-600 bg-gray-800 h-1 rounded-lg cursor-pointer appearance-none"
            />
            <span className="text-[10px] text-gray-500 font-mono w-8">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-1.5 self-end md:self-auto border-t md:border-t-0 pt-2.5 md:pt-0 border-[#1f212d]/60">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1.5 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-gray-400" /> Speed:
            </span>
            {[0.8, 1.0, 1.2].map(speed => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2.5 py-1 rounded text-[10px] font-black transition-all ${
                  playbackRate === speed
                    ? 'bg-violet-600/20 border border-violet-500/60 text-violet-400'
                    : 'bg-[#15161f] text-gray-400 hover:text-white border border-[#1f212d]'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#111219]/25 border border-dashed border-[#1f212d] rounded-2xl text-center text-xs text-gray-500 font-medium">
          No reference track uploaded for this song.
        </div>
      )}
    </div>
    </>
  );
}
