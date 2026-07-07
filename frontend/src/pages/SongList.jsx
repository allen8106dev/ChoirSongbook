import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, Tag, ChevronRight, X, Volume2, FileDown } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';
import { API_BASE_URL } from '../services/api';

// ─── PDF Export Modal ────────────────────────────────────────────────────────
function PdfExportModal({ isOpen, onClose, languages, categories, initialSearch, initialLanguages, initialCategories }) {
  const [search, setSearch] = useState(initialSearch);
  const [selLangs, setSelLangs] = useState(initialLanguages);
  const [selCats, setSelCats] = useState(initialCategories);

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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg bg-[#111219] border border-[#1f212d] rounded-3xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden animate-scale-in"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#1f212d]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <FileDown className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">Export PDF</h3>
                <p className="text-xs text-gray-500">
                  {activeCount === 0 ? 'All songs will be exported' : `${activeCount} filter${activeCount > 1 ? 's' : ''} applied`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[60vh]">

            {/* Search */}
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
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Language Filters */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Language
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelLangs([])}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selLangs.length === 0
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20'
                      : 'bg-[#0c0d13] text-gray-400 hover:text-white border border-[#1f212d]'
                  }`}
                >
                  All
                </button>
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => toggleLang(lang)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      selLangs.includes(lang)
                        ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20'
                        : 'bg-[#0c0d13] text-gray-400 hover:text-white border border-[#1f212d]'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filters */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelCats([])}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selCats.length === 0
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'bg-[#0c0d13] text-gray-400 hover:text-white border border-[#1f212d]'
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => toggleCat(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      selCats.includes(cat)
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                        : 'bg-[#0c0d13] text-gray-400 hover:text-white border border-[#1f212d]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Active filters summary */}
            {activeCount > 0 && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-gray-500">
                  Only songs matching the selected filters will be included.
                </p>
                <button
                  onClick={() => { setSearch(''); setSelLangs([]); setSelCats([]); }}
                  className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors shrink-0 ml-3"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-[#1f212d] flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/20 transition-all active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main SongList Component ─────────────────────────────────────────────────
export default function SongList() {
  const { songs, languages, categories, isLoading } = useSongbook();
  const navigate = useNavigate();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // PDF modal state
  const [showPdfModal, setShowPdfModal] = useState(false);

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
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        song.title.toLowerCase().includes(query) ||
        song.lyrics.toLowerCase().includes(query) ||
        (song.transliteration && song.transliteration.toLowerCase().includes(query)) ||
        song.languages.some(lang => lang.toLowerCase().includes(query)) ||
        song.categories.some(cat => cat.toLowerCase().includes(query));

      const matchesLanguage = selectedLanguages.length === 0 ||
        song.languages.some(lang => selectedLanguages.includes(lang));

      const matchesCategory = selectedCategories.length === 0 ||
        song.categories.some(cat => selectedCategories.includes(cat));

      return matchesSearch && matchesLanguage && matchesCategory;
    });
  }, [songs, searchQuery, selectedLanguages, selectedCategories]);

  // Group songs by starting letter
  const groupedSongs = useMemo(() => {
    const groups = {};
    filteredSongs.forEach(song => {
      const firstLetter = song.title.charAt(0).toUpperCase();
      const key = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
      if (!groups[key]) groups[key] = [];
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
      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        languages={languages}
        categories={categories}
        initialSearch={searchQuery}
        initialLanguages={selectedLanguages}
        initialCategories={selectedCategories}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Songbook</h2>
          <p className="text-sm text-gray-400">Search and browse lyrics and reference tracks</p>
        </div>
        <button
          onClick={() => setShowPdfModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <FileDown className="w-4 h-4" />
          Export PDF
        </button>
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
          {/* Language Filters */}
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
                          {song.languages.map((l) => (
                            <span key={l} className="text-[10px] font-bold text-violet-400 bg-violet-950/20 border border-violet-900/30 px-1.5 py-0.25 rounded">
                              {l}
                            </span>
                          ))}
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
