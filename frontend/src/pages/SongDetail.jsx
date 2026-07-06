import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Play, Pause, Volume2, Type, Globe, Tag, Sparkles } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { songs, currentUser, isLoading } = useSongbook();

  // Find active song
  const song = songs.find(s => s.id === id);

  // States
  const [fontSize, setFontSize] = useState(18); // Default 18px
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1); // Pitch / Speed control

  const audioRef = useRef(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-violet-600/30 border-t-violet-500 animate-spin"></div>
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

  // Font sizing handlers
  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 32));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12));

  // Audio Handlers
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.log('Playback error:', err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Formatter for time
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navbar */}
      <div className="flex items-center justify-between border-b border-[#1f212d] pb-4 sticky top-[73px] md:top-0 bg-[#0b0c10] z-20">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#111219] flex items-center gap-2 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Transliteration Tab Toggle if data exists */}
          {song.transliteration && (
            <div className="flex bg-[#111219] border border-[#1f212d] rounded-xl p-1 shrink-0">
              <button
                onClick={() => setShowTransliteration(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !showTransliteration
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setShowTransliteration(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  showTransliteration
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Romanized
              </button>
            </div>
          )}

          {/* Edit Song for Admins */}
          {isAtLeastAdmin && (
            <button
              onClick={() => navigate(`/admin/edit/${song.id}`)}
              className="p-2.5 bg-[#111219] border border-[#1f212d] hover:border-violet-500/40 rounded-xl text-gray-300 hover:text-violet-400 transition-all flex items-center justify-center"
              title="Edit Song"
            >
              <Edit3 className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Title & Metadata Card */}
      <div className="p-6 bg-gradient-to-br from-[#12131b] to-[#181923] border border-[#1f212d] rounded-3xl space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black text-violet-400 bg-violet-950/40 border border-violet-900/30 px-2 py-0.5 rounded-md">
              No. {song.number}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {song.title}
          </h1>
        </div>

        {/* Tags Block */}
        <div className="flex flex-wrap items-center gap-3 text-xs border-t border-[#1f212d]/60 pt-3.5">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Globe className="w-3.5 h-3.5 text-violet-400" />
            {song.languages.map((l, i) => (
              <span key={l} className="font-bold text-white">
                {l}{i < song.languages.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
          {song.categories && song.categories.length > 0 && (
            <>
              <div className="h-3 w-px bg-[#1f212d]"></div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                {song.categories.map((c, i) => (
                  <span key={c} className="font-bold text-white">
                    {c}{i < song.categories.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Typography Controls & Display Area */}
      <div className="glass-panel border border-[#1f212d] rounded-3xl p-6 md:p-8 space-y-6">
        {/* Font resize toolbar */}
        <div className="flex items-center justify-between border-b border-[#1f212d]/60 pb-3">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Type className="w-4 h-4 text-violet-400" /> Font Adjustment
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={decreaseFontSize}
              disabled={fontSize <= 12}
              className="w-8 h-8 rounded-lg bg-[#111219] hover:bg-[#1a1b26] disabled:opacity-40 font-bold border border-[#1f212d] flex items-center justify-center text-xs"
            >
              A-
            </button>
            <span className="text-xs font-bold text-gray-400 px-1">{fontSize}px</span>
            <button
              onClick={increaseFontSize}
              disabled={fontSize >= 32}
              className="w-8 h-8 rounded-lg bg-[#111219] hover:bg-[#1a1b26] disabled:opacity-40 font-bold border border-[#1f212d] flex items-center justify-center text-xs"
            >
              A+
            </button>
          </div>
        </div>

        {/* Lyric Content Body */}
        <div
          style={{ fontSize: `${fontSize}px` }}
          className="lyrics-text font-serif text-gray-100 px-2 leading-relaxed tracking-normal select-none"
        >
          {showTransliteration ? song.transliteration : song.lyrics}
        </div>
      </div>

      {/* Spotify-like Floating/Sticky Audio Player Bar */}
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

          {/* Seek slider */}
          <div className="flex-1 flex items-center gap-3">
            <span className="text-[10px] text-gray-500 font-mono w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 accent-violet-600 bg-gray-800 h-1 rounded-lg cursor-pointer appearance-none"
            />
            <span className="text-[10px] text-gray-500 font-mono w-8">
              {formatTime(duration)}
            </span>
          </div>

          {/* Speed settings / Playback rate */}
          <div className="flex items-center gap-1.5 self-end md:self-auto border-t md:border-t-0 pt-2.5 md:pt-0 border-[#1f212d]/60">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1.5 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-gray-400" /> Speed:
            </span>
            {[0.8, 1.0, 1.2].map((speed) => (
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
  );
}
