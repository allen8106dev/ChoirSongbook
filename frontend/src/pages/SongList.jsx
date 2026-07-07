import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, Tag, ChevronRight, X, Volume2, FileDown, SlidersHorizontal, ChevronDown, Star } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';
import { API_BASE_URL } from '../services/api';

// ─── PDF Export Modal ────────────────────────────────────────────────────────
function PdfExportModal({ isOpen, onClose, languages, categories, initialSearch, initialLanguages, initialCategories }) {
  const [search, setSearch] = useState(initialSearch);
  const [selLangs, setSelLangs] = useState(initialLanguages);
  const [selCats, setSelCats] = useState(initialCategories);

  useEffect(() => {
    if (isOpen) {
      setSearch(initialSearch);
      setSelLangs(initialLanguages);
      setSelCats(initialCategories);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleLang = (lang) =>
    setSelLangs(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);

  const toggleCat = (cat) =>
    setSelCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const activeCount = selLangs.length + selCats.length + (search ? 1 : 0);

  const handleDownload = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    selLangs.forEach(l => params.append('languages', l));
    selCats.forEach(c => params.append('categories', c));
    const qs = params.toString();
    window.open(`${API_BASE_URL}/songs/pdf${qs ? '?' + qs : ''}`, '_blank');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg bg-[#111219] border border-[#1f212d] rounded-3xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#1f212d]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <FileDown className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">Export PDF</h3>
                <p className="text-xs text-gray-500">
                  {activeCount === 0 ? 'All songs will be exported' : `${activeCount} filter${activeCount > 1 ? 's' : ''} applied`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[60vh]">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Search className="w-3 h-3" /> Keyword Search
              </label>
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Filter by title, lyrics, tags..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-3 bg-[#0c0d13] border border-[#1f212d] focus:border-violet-500 rounded-xl text-sm placeholder-gray-600 focus:outline-none transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Language
              </label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelLangs([])} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${selLangs.length === 0 ? 'bg-violet-600 text-white' : 'bg-[#0c0d13] text-gray-400 hover:text-white border border-[#1f212d]'}`}>All</button>
                {languages.map(lang => (
                  <button key={lang} onClick={() => toggleLang(lang)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${selLangs.includes(lang) ? 'bg-violet-600 text-white' : 'bg-[#0c0d13] text-gray-400 hover:text-white border border-[#1f212d]'}`}>{lang}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelCats([])} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${selCats.length === 0 ? 'bg-indigo-600 text-white' : 'bg-[#0c0d13] text-gray-400 hover:text-white border border-[#1f212d]'}`}>All</button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => toggleCat(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${selCats.includes(cat) ? 'bg-indigo-600 text-white' : 'bg-[#0c0d13] text-gray-400 hover:text-white border border-[#1f212d]'}`}>{cat}</button>
                ))}
              </div>
            </div>

            {activeCount > 0 && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-gray-500">Only matching songs will be included.</p>
                <button onClick={() => { setSearch(''); setSelLangs([]); setSelCats([]); }} className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors shrink-0 ml-3">Clear all</button>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-[#1f212d] flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
            <button onClick={handleDownload} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/20 transition-all active:scale-95">
              <FileDown className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main SongList Component ─────────────────────────────────────────────────
export default function SongList() {
  const { songs, languages, categories, isLoading, toggleFavourite, isFavourite, currentUser } = useSongbook();
  const navigate = useNavigate();
  const filterRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleLanguage = (lang) =>
    setSelectedLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);

  const toggleCategory = (cat) =>
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLanguages([]);
    setSelectedCategories([]);
  };

  const activeFilterCount = selectedLanguages.length + selectedCategories.length;

  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        song.title.toLowerCase().includes(query) ||
        song.lyrics.toLowerCase().includes(query) ||
        (song.transliteration && song.transliteration.toLowerCase().includes(query)) ||
        song.languages.some(lang => lang.toLowerCase().includes(query)) ||
        song.categories.some(cat => cat.toLowerCase().includes(query));
      const matchesLanguage = selectedLanguages.length === 0 || song.languages.some(lang => selectedLanguages.includes(lang));
      const matchesCategory = selectedCategories.length === 0 || song.categories.some(cat => selectedCategories.includes(cat));
      return matchesSearch && matchesLanguage && matchesCategory;
    });
  }, [songs, searchQuery, selectedLanguages, selectedCategories]);

  const groupedSongs = useMemo(() => {
    const groups = {};
    filteredSongs.forEach(song => {
      const firstLetter = song.title.charAt(0).toUpperCase();
      const key = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
      if (!groups[key]) groups[key] = [];
      groups[key].push(song);
    });
    return Object.keys(groups).sort().reduce((acc, key) => { acc[key] = groups[key]; return acc; }, {});
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
    <div className="space-y-5">
      <PdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        languages={languages}
        categories={categories}
        initialSearch={searchQuery}
        initialLanguages={selectedLanguages}
        initialCategories={selectedCategories}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Songbook</h2>
          <p className="text-sm text-gray-400 mt-0.5">Search and browse lyrics and reference tracks</p>
        </div>
        <button
          onClick={() => setShowPdfModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <FileDown className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {/* Search + Filter Row */}
      <div className="flex gap-2 items-center">
        {/* Search Input */}
        <div className="relative group flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-violet-400 transition-colors" />
          <input
            type="text"
            placeholder="Search titles, lyrics, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-[#111219] border border-[#1f212d] focus:border-violet-500 rounded-xl text-sm placeholder-gray-500 focus:outline-none transition-all duration-200 shadow-inner"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdown Trigger */}
        <div className="relative shrink-0" ref={filterRef}>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
              showFilters || activeFilterCount > 0
                ? 'bg-violet-600/10 border-violet-500/40 text-violet-400'
                : 'bg-[#111219] border-[#1f212d] text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-violet-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Panel */}
          {showFilters && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#111219] border border-[#1f212d] rounded-2xl shadow-2xl shadow-black/50 z-40 p-4 space-y-3.5">
              {/* Language Filter */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Language
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedLanguages([])}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${selectedLanguages.length === 0 ? 'bg-violet-600 text-white' : 'bg-[#0c0d13] text-gray-400 hover:text-white border border-[#1f212d]'}`}
                  >All</button>
                  {languages.map(lang => (
                    <button
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${selectedLanguages.includes(lang) ? 'bg-violet-600 text-white' : 'bg-[#0c0d13] text-gray-400 hover:text-white border border-[#1f212d]'}`}
                    >{lang}</button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Category
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedCategories([])}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${selectedCategories.length === 0 ? 'bg-indigo-600 text-white' : 'bg-[#0c0d13] text-gray-400 hover:text-white border border-[#1f212d]'}`}
                  >All</button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${selectedCategories.includes(cat) ? 'bg-indigo-600 text-white' : 'bg-[#0c0d13] text-gray-400 hover:text-white border border-[#1f212d]'}`}
                    >{cat}</button>
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="pt-2 border-t border-[#1f212d]/60 flex justify-end">
                  <button
                    onClick={() => { setSelectedLanguages([]); setSelectedCategories([]); }}
                    className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active filter chips (compact summary below search) */}
      {(selectedLanguages.length > 0 || selectedCategories.length > 0 || searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-900 border border-[#1f212d] text-gray-400">
              "{searchQuery}" <button onClick={() => setSearchQuery('')}><X className="w-3 h-3 hover:text-white" /></button>
            </span>
          )}
          {selectedLanguages.map(l => (
            <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-950/40 border border-violet-900/30 text-violet-400">
              {l} <button onClick={() => toggleLanguage(l)}><X className="w-3 h-3 hover:text-white" /></button>
            </span>
          ))}
          {selectedCategories.map(c => (
            <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-950/40 border border-indigo-900/30 text-indigo-400">
              {c} <button onClick={() => toggleCategory(c)}><X className="w-3 h-3 hover:text-white" /></button>
            </span>
          ))}
          <button onClick={resetFilters} className="text-[10px] font-bold text-gray-500 hover:text-gray-300 transition-colors">Clear all</button>
        </div>
      )}

      {/* Song List */}
      <div className="space-y-5">
        {filteredSongs.length === 0 ? (
          <div className="text-center py-16 bg-[#111219]/20 border border-dashed border-[#1f212d] rounded-2xl">
            <p className="text-gray-400 font-medium">No songs found matching your search criteria.</p>
            <button onClick={resetFilters} className="mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors">
              Reset Filters
            </button>
          </div>
        ) : (
          Object.entries(groupedSongs).map(([letter, letterSongs]) => (
            <div key={letter} className="space-y-1.5">
              {/* Letter divider */}
              <div className="sticky top-[73px] md:top-0 py-1 bg-[#0b0c10]/90 backdrop-blur-md z-10 flex items-center gap-3">
                <span className="text-xs font-black text-violet-400 bg-violet-950/40 px-2 py-0.5 rounded border border-violet-900/30">{letter}</span>
                <div className="flex-1 h-px bg-[#1f212d]/60"></div>
              </div>

              {/* Songs */}
              <div className="grid gap-1.5">
                {letterSongs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => navigate(`/song/${song.id}`)}
                    className="flex items-center justify-between px-3.5 py-2.5 bg-[#111219] hover:bg-[#161722] border border-[#1f212d]/70 hover:border-violet-500/30 rounded-xl cursor-pointer transition-all duration-150 group shadow-sm hover:shadow-violet-500/5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Song number */}
                      <div className="w-8 h-8 rounded-lg bg-gray-900 border border-white/5 flex items-center justify-center font-bold text-[10px] text-gray-500 shrink-0 group-hover:bg-violet-950/20 group-hover:text-violet-400 transition-colors">
                        {song.number}
                      </div>
                      {/* Title + tags */}
                      <div className="min-w-0 flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white text-sm leading-tight group-hover:text-violet-400 transition-colors truncate">
                          {song.title}
                        </h3>
                        <div className="flex items-center gap-1 flex-wrap">
                          {song.languages.map((l) => (
                            <span key={l} className="text-[9px] font-bold text-violet-400 bg-violet-950/20 border border-violet-900/30 px-1.5 py-0.5 rounded">
                              {l}
                            </span>
                          ))}
                          {song.categories.map((c) => (
                            <span key={c} className="text-[9px] font-bold text-indigo-400 bg-indigo-950/20 border border-indigo-900/30 px-1.5 py-0.5 rounded">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-500 group-hover:text-gray-300 transition-colors pl-2 shrink-0">
                      {song.audioUrl && <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {currentUser.email && (
                        <button
                          onClick={e => { e.stopPropagation(); toggleFavourite(song.id); }}
                          className={`p-1 rounded-lg transition-colors ${isFavourite(song.id) ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
                          title={isFavourite(song.id) ? 'Remove from favourites' : 'Add to favourites'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFavourite(song.id) ? 'fill-yellow-400' : ''}`} />
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
