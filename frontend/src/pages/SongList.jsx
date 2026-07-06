import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, Tag, ChevronRight, X, Volume2 } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';

export default function SongList() {
  const { songs, languages, categories, isLoading } = useSongbook();
  const navigate = useNavigate();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Toggle Language selection
  const toggleLanguage = (lang) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  // Toggle Category selection
  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Clear all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLanguages([]);
    setSelectedCategories([]);
  };

  // Filtered and sorted songs
  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        song.title.toLowerCase().includes(query) ||
        song.lyrics.toLowerCase().includes(query) ||
        (song.transliteration && song.transliteration.toLowerCase().includes(query)) ||
        song.languages.some(lang => lang.toLowerCase().includes(query)) ||
        song.categories.some(cat => cat.toLowerCase().includes(query));

      // Language match (OR check within selected languages)
      const matchesLanguage = selectedLanguages.length === 0 || 
        song.languages.some(lang => selectedLanguages.includes(lang));

      // Category match (OR check within selected categories)
      const matchesCategory = selectedCategories.length === 0 || 
        song.categories.some(cat => selectedCategories.includes(cat));

      return matchesSearch && matchesLanguage && matchesCategory;
    });
  }, [songs, searchQuery, selectedLanguages, selectedCategories]);

  // Dynamic filtered PDF export URL
  const exportPdfUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.append('search', searchQuery);
    }
    selectedLanguages.forEach(lang => {
      params.append('languages', lang);
    });
    selectedCategories.forEach(cat => {
      params.append('categories', cat);
    });
    const queryStr = params.toString();
    return `http://localhost:8000/api/songs/pdf${queryStr ? '?' + queryStr : ''}`;
  }, [searchQuery, selectedLanguages, selectedCategories]);


  // Group songs by starting letter for list organization
  const groupedSongs = useMemo(() => {
    const groups = {};
    filteredSongs.forEach(song => {
      const firstLetter = song.title.charAt(0).toUpperCase();
      const key = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(song);
    });
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {});
  }, [filteredSongs]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-violet-600/30 border-t-violet-500 animate-spin"></div>
        <p className="text-gray-400 text-sm font-medium animate-pulse">Loading songbook...</p>
      </div>
    );
  }

  return (

    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Songbook</h2>
          <p className="text-sm text-gray-400">Search and browse lyrics and reference tracks</p>
        </div>
        <a
          href={exportPdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export PDF
        </a>
      </div>


      {/* Interactive Controls (Search & Quick Filter Pills) */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-violet-400 transition-colors" />
          <input
            type="text"
            placeholder="Search titles, lyrics, tags, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 bg-[#111219] border border-[#1f212d] focus:border-violet-500 rounded-2xl text-sm placeholder-gray-500 focus:outline-none transition-all duration-300 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <div className="space-y-3 p-4 bg-[#111219]/40 border border-[#1f212d]/60 rounded-2xl">
          {/* Languages Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Globe className="w-3 h-3" /> Language:
            </span>
            <button
              onClick={() => setSelectedLanguages([])}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedLanguages.length === 0
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-[#15161f] text-gray-400 hover:text-white border border-[#1f212d]'
              }`}
            >
              All
            </button>
            {languages.map(lang => (
              <button
                key={lang}
                onClick={() => toggleLanguage(lang)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedLanguages.includes(lang)
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-[#15161f] text-gray-400 hover:text-white border border-[#1f212d]'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Categories Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Category:
            </span>
            <button
              onClick={() => setSelectedCategories([])}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategories.length === 0
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#15161f] text-gray-400 hover:text-white border border-[#1f212d]'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategories.includes(cat)
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[#15161f] text-gray-400 hover:text-white border border-[#1f212d]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Reset Filters Indicator */}
          {(selectedLanguages.length > 0 || selectedCategories.length > 0 || searchQuery) && (
            <div className="flex justify-end pt-1">
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Song List Results */}
      <div className="space-y-6">
        {filteredSongs.length === 0 ? (
          <div className="text-center py-16 bg-[#111219]/20 border border-dashed border-[#1f212d] rounded-2xl">
            <p className="text-gray-400 font-medium">No songs found matching your search criteria.</p>
            <button
              onClick={resetFilters}
              className="mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          Object.entries(groupedSongs).map(([letter, letterSongs]) => (
            <div key={letter} className="space-y-2">
              {/* Alphabetical Group Divider */}
              <div className="sticky top-[73px] md:top-0 py-1 bg-[#0b0c10]/90 backdrop-blur-md z-10 flex items-center gap-3">
                <span className="text-sm font-black text-violet-400 bg-violet-950/40 px-2 py-0.5 rounded border border-violet-900/30">
                  {letter}
                </span>
                <div className="flex-1 h-px bg-[#1f212d]/60"></div>
              </div>

              {/* Group Songs */}
              <div className="grid gap-2.5">
                {letterSongs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => navigate(`/song/${song.id}`)}
                    className="flex items-center justify-between p-4 bg-[#111219] hover:bg-[#161722] border border-[#1f212d]/70 hover:border-violet-500/30 rounded-2xl cursor-pointer transition-all duration-200 group shadow-sm hover:shadow-violet-500/5 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Song Number Indicator */}
                      <div className="w-10 h-10 rounded-xl bg-gray-900 border border-white/5 flex items-center justify-center font-bold text-xs text-gray-400 shrink-0 group-hover:bg-violet-950/20 group-hover:text-violet-400 transition-colors">
                        {song.number}
                      </div>

                      {/* Title & Tags */}
                      <div className="min-w-0 space-y-1">
                        <h3 className="font-bold text-white text-base leading-tight group-hover:text-violet-400 transition-colors truncate">
                          {song.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Languages */}
                          {song.languages.map((l) => (
                            <span key={l} className="text-[10px] font-bold text-violet-400 bg-violet-950/20 border border-violet-900/30 px-1.5 py-0.25 rounded">
                              {l}
                            </span>
                          ))}
                          {/* Categories */}
                          {song.categories.map((c) => (
                            <span key={c} className="text-[10px] font-bold text-indigo-400 bg-indigo-950/20 border border-indigo-900/30 px-1.5 py-0.25 rounded">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-500 group-hover:text-gray-300 transition-colors pl-2">
                      {song.audioUrl && (
                        <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                      )}
                      <ChevronRight className="w-5 h-5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
