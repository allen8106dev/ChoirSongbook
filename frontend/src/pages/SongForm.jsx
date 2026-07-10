import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Save, Trash2, Plus, X, Globe, Tag, Video, ArrowLeft, AlertTriangle, FileText } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';
import {
  MAX_SONG_TITLE,
  MAX_CATEGORY_NAME,
  MAX_LANGUAGE_NAME,
  MAX_LYRICS,
  MAX_YOUTUBE_URL,
} from '../validation';

// ─── Parse existing lyrics string into sections ─────────────────────────────
function parseLyricSections(rawLyrics) {
  if (!rawLyrics) return [{ heading: '', text: '' }];
  const sectionRegex = /^===\s*(.+?)\s*===/m;
  if (!sectionRegex.test(rawLyrics)) {
    return [{ heading: '', text: rawLyrics }];
  }
  const parts = rawLyrics.split(/\n*===\s*(.+?)\s*===\n*/);
  const sections = [];
  for (let i = 1; i < parts.length; i += 2) {
    sections.push({ heading: parts[i] || '', text: (parts[i + 1] || '').trim() });
  }
  return sections.length > 0 ? sections : [{ heading: '', text: rawLyrics }];
}

// ─── Serialize sections back to a string for storage ────────────────────────
function serializeLyricSections(sections) {
  if (sections.length === 1 && !sections[0].heading) {
    return sections[0].text;
  }
  return sections
    .map(s => s.heading ? `=== ${s.heading} ===\n${s.text}` : s.text)
    .join('\n\n');
}

export default function SongForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const {
    songs,
    languages: availableLanguages,
    categories: availableCategories,
    activeOrganizationId,
    addSong,
    updateSong,
    deleteSong,
  } = useSongbook();

  const songToEdit = isEditMode ? songs.find(s => s.id === id) : null;

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title: songToEdit?.title || '',
      audioUrl: songToEdit?.audio_url || '',
    },
  });

  // Tags
  const [songLanguages, setSongLanguages] = useState(() => songToEdit ? songToEdit.languages || [] : []);
  const [songCategories, setSongCategories] = useState(() => songToEdit ? songToEdit.categories || [] : []);
  const [newLanguageInput, setNewLanguageInput] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [languageError, setLanguageError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [showLanguageSuggestions, setShowLanguageSuggestions] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  // Multi-section lyrics
  const [lyricSections, setLyricSections] = useState(() => parseLyricSections(songToEdit?.lyrics));
  const [activeLyricTab, setActiveLyricTab] = useState(0);
  const [lyricsError, setLyricsError] = useState('');

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Total serialized lyrics length (across all sections)
  const totalLyricsLength = serializeLyricSections(lyricSections).length;

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    const serializedLyrics = serializeLyricSections(lyricSections);

    // Lyrics validation
    if (lyricSections.every(s => !s.text.trim())) {
      setLyricsError('Lyrics are required.');
      return;
    }
    if (serializedLyrics.length > MAX_LYRICS) {
      setLyricsError(`Lyrics must not exceed ${MAX_LYRICS.toLocaleString()} characters.`);
      return;
    }
    setLyricsError('');

    const payload = {
      title: data.title.trim(),
      audio_url: data.audioUrl ? data.audioUrl.trim() : '',
      lyrics: serializedLyrics,
      transliteration: '',
      languages: songLanguages.length > 0 ? songLanguages : ['English'],
      categories: songCategories,
    };

    try {
      let savedSong = null;
      if (isEditMode) {
        savedSong = await updateSong(id, payload);
      } else {
        savedSong = await addSong(payload);
      }
      navigate(`/org/${activeOrganizationId}/song/${savedSong.id || id}`);
    } catch (err) {
      console.error('Failed to save song:', err);
    }
  };

  const handleDelete = async () => {
    if (isEditMode) {
      try { await deleteSong(id); navigate(`/org/${activeOrganizationId}`); }
      catch (err) { console.error('Failed to delete song:', err); }
    }
  };

  // ─── Tag helpers ─────────────────────────────────────────────────────────
  const addLanguage = (lang) => {
    const f = lang.trim();
    if (!f) { setNewLanguageInput(''); setShowLanguageSuggestions(false); return; }
    if (f.length > MAX_LANGUAGE_NAME) {
      setLanguageError(`Language name must not exceed ${MAX_LANGUAGE_NAME} characters.`);
      return;
    }
    setLanguageError('');
    if (!songLanguages.includes(f)) setSongLanguages(p => [...p, f]);
    setNewLanguageInput(''); setShowLanguageSuggestions(false);
  };
  const removeLanguage = (lang) => setSongLanguages(p => p.filter(l => l !== lang));

  const addCategory = (cat) => {
    const f = cat.trim();
    if (!f) { setNewCategoryInput(''); setShowCategorySuggestions(false); return; }
    if (f.length > MAX_CATEGORY_NAME) {
      setCategoryError(`Category name must not exceed ${MAX_CATEGORY_NAME} characters.`);
      return;
    }
    setCategoryError('');
    if (!songCategories.includes(f)) setSongCategories(p => [...p, f]);
    setNewCategoryInput(''); setShowCategorySuggestions(false);
  };
  const removeCategory = (cat) => setSongCategories(p => p.filter(c => c !== cat));

  const languageSuggestions = availableLanguages.filter(
    l => l.toLowerCase().includes(newLanguageInput.toLowerCase()) && !songLanguages.includes(l)
  );
  const categorySuggestions = availableCategories.filter(
    c => c.toLowerCase().includes(newCategoryInput.toLowerCase()) && !songCategories.includes(c)
  );

  // ─── Lyric section helpers ────────────────────────────────────────────────
  const addLyricSection = () => {
    setLyricSections(p => [...p, { heading: '', text: '' }]);
    setActiveLyricTab(lyricSections.length);
  };

  const removeLyricSection = (idx) => {
    if (lyricSections.length === 1) return;
    setLyricSections(p => p.filter((_, i) => i !== idx));
    setActiveLyricTab(prev => Math.min(prev, lyricSections.length - 2));
  };

  const updateSection = (idx, field, value) => {
    if (field === 'text' && value.length > MAX_LYRICS) return;
    setLyricSections(p => p.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    if (field === 'text') setLyricsError('');
  };

  const lyricsOverLimit = totalLyricsLength > MAX_LYRICS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1f212d] pb-4">
        <button
          onClick={() => navigate(isEditMode ? `/org/${activeOrganizationId}/song/${id}` : `/org/${activeOrganizationId}`)}
          className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#111219] flex items-center gap-2 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /><span>Cancel</span>
        </button>
        <h2 className="text-lg font-bold text-white">{isEditMode ? 'Edit Song Details' : 'Add New Song'}</h2>
        <div />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Song Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. O Come All Ye Faithful"
            maxLength={MAX_SONG_TITLE}
            {...register('title', {
              required: 'Title is required.',
              maxLength: { value: MAX_SONG_TITLE, message: `Title must not exceed ${MAX_SONG_TITLE} characters.` },
              validate: v => v.trim().length > 0 || 'Title must not be empty.',
            })}
            className={`w-full px-4 py-3 bg-[#111219] border ${errors.title ? 'border-red-500/50' : 'border-[#1f212d] focus:border-violet-500'} rounded-2xl text-sm placeholder-gray-600 focus:outline-none transition-colors shadow-inner`}
          />
          {errors.title && (
            <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {errors.title.message}
            </span>
          )}
        </div>

        {/* Languages + Categories side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Languages */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-violet-400" /> Languages
            </label>
            {songLanguages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {songLanguages.map(lang => (
                  <span key={lang} className="inline-flex items-center gap-1 text-xs font-bold text-violet-400 bg-violet-950/30 border border-violet-900/40 px-2 py-0.5 rounded-full">
                    {lang}
                    <button type="button" onClick={() => removeLanguage(lang)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type or select..."
                value={newLanguageInput}
                maxLength={MAX_LANGUAGE_NAME}
                onChange={(e) => { setNewLanguageInput(e.target.value); setShowLanguageSuggestions(true); setLanguageError(''); }}
                onFocus={() => setShowLanguageSuggestions(true)}
                onBlur={() => setShowLanguageSuggestions(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLanguage(newLanguageInput); } }}
                className="flex-1 px-3 py-2.5 bg-[#111219] border border-[#1f212d] focus:border-violet-500 rounded-xl text-sm placeholder-gray-600 focus:outline-none transition-colors"
              />
              <button type="button" onClick={() => addLanguage(newLanguageInput)} className="px-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {languageError && (
              <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {languageError}
              </span>
            )}
            {showLanguageSuggestions && languageSuggestions.length > 0 && (
              <ul className="absolute z-30 left-0 right-0 mt-1 bg-[#161722] border border-[#1f212d] rounded-xl shadow-xl max-h-36 overflow-y-auto divide-y divide-gray-800/50">
                {languageSuggestions.map(lang => (
                  <li key={lang} onMouseDown={(e) => e.preventDefault()} onClick={() => addLanguage(lang)} className="px-3 py-2 hover:bg-violet-950/20 text-sm font-semibold text-gray-300 hover:text-white cursor-pointer transition-colors">{lang}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Categories */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" /> Categories
            </label>
            {songCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {songCategories.map(cat => (
                  <span key={cat} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 bg-indigo-950/30 border border-indigo-900/40 px-2 py-0.5 rounded-full">
                    {cat}
                    <button type="button" onClick={() => removeCategory(cat)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type or select..."
                value={newCategoryInput}
                maxLength={MAX_CATEGORY_NAME}
                onChange={(e) => { setNewCategoryInput(e.target.value); setShowCategorySuggestions(true); setCategoryError(''); }}
                onFocus={() => setShowCategorySuggestions(true)}
                onBlur={() => setShowCategorySuggestions(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(newCategoryInput); } }}
                className="flex-1 px-3 py-2.5 bg-[#111219] border border-[#1f212d] focus:border-violet-500 rounded-xl text-sm placeholder-gray-600 focus:outline-none transition-colors"
              />
              <button type="button" onClick={() => addCategory(newCategoryInput)} className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {categoryError && (
              <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {categoryError}
              </span>
            )}
            {showCategorySuggestions && categorySuggestions.length > 0 && (
              <ul className="absolute z-30 left-0 right-0 mt-1 bg-[#161722] border border-[#1f212d] rounded-xl shadow-xl max-h-36 overflow-y-auto divide-y divide-gray-800/50">
                {categorySuggestions.map(cat => (
                  <li key={cat} onMouseDown={(e) => e.preventDefault()} onClick={() => addCategory(cat)} className="px-3 py-2 hover:bg-indigo-950/20 text-sm font-semibold text-gray-300 hover:text-white cursor-pointer transition-colors">{cat}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Lyrics — multi-section with tabs */}
        <div className="space-y-2">
          {/* Header row: label + tab strip + add button */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-violet-400" /> Lyrics <span className="text-red-500">*</span>
            </label>

            {/* Tabs */}
            <div className="flex items-center gap-1 flex-wrap">
              {lyricSections.map((section, idx) => (
                <div key={idx} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveLyricTab(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeLyricTab === idx
                        ? 'bg-violet-600 text-white'
                        : 'bg-[#111219] text-gray-400 hover:text-white border border-[#1f212d]'
                    }`}
                  >
                    {section.heading || `Section ${idx + 1}`}
                  </button>
                  {lyricSections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLyricSection(idx)}
                      className="ml-0.5 p-0.5 text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addLyricSection}
                title="Add lyric section"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-gray-400 hover:text-violet-400 hover:bg-violet-950/20 border border-dashed border-[#1f212d] hover:border-violet-600/40 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Section heading input */}
          <input
            type="text"
            placeholder="Section heading (e.g. English, Malayalam...)"
            value={lyricSections[activeLyricTab]?.heading || ''}
            onChange={e => updateSection(activeLyricTab, 'heading', e.target.value)}
            className="w-full px-3 py-2 bg-[#111219] border border-[#1f212d] focus:border-violet-500/50 rounded-xl text-xs font-semibold placeholder-gray-600 focus:outline-none transition-colors"
          />

          {/* Lyrics textarea */}
          <textarea
            placeholder="Enter lyrics for this section..."
            rows={12}
            value={lyricSections[activeLyricTab]?.text || ''}
            onChange={e => updateSection(activeLyricTab, 'text', e.target.value)}
            className={`w-full px-4 py-3 bg-[#111219] border ${lyricsOverLimit ? 'border-red-500/50' : 'border-[#1f212d] focus:border-violet-500'} rounded-2xl text-sm font-serif placeholder-gray-600 focus:outline-none transition-colors shadow-inner`}
          />

          {/* Character counter */}
          <div className="flex items-center justify-between">
            <div>
              {(lyricsError || lyricSections.every(s => !s.text.trim())) && (
                <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {lyricsError || 'Lyrics are required.'}
                </span>
              )}
            </div>
            <span className={`text-xs font-mono tabular-nums ${lyricsOverLimit ? 'text-red-400 font-semibold' : 'text-gray-600'}`}>
              Characters: {totalLyricsLength.toLocaleString()} / {MAX_LYRICS.toLocaleString()}
            </span>
          </div>
        </div>

        {/* YouTube URL */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-red-400" /> YouTube URL (Optional)
          </label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            maxLength={MAX_YOUTUBE_URL}
            {...register('audioUrl', {
              maxLength: { value: MAX_YOUTUBE_URL, message: `URL must not exceed ${MAX_YOUTUBE_URL} characters.` },
            })}
            className={`w-full px-4 py-3 bg-[#111219] border ${errors.audioUrl ? 'border-red-500/50' : 'border-[#1f212d] focus:border-violet-500'} rounded-2xl text-sm placeholder-gray-600 focus:outline-none transition-colors shadow-inner`}
          />
          {errors.audioUrl ? (
            <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {errors.audioUrl.message}
            </span>
          ) : (
            <p className="text-xs text-gray-500">Paste a YouTube video link to show it below the lyrics.</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[#1f212d]/60">
          <button
            type="submit"
            disabled={lyricsOverLimit}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-violet-600/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /><span>{isEditMode ? 'Update Song Details' : 'Publish Song'}</span>
          </button>

          {isEditMode && (
            <div className="space-y-3">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 bg-red-950/20 hover:bg-red-950/30 border border-red-900/30 text-red-400 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Delete Song
                </button>
              ) : (
                <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-2xl space-y-3 text-center">
                  <p className="text-xs font-bold text-red-300">Permanently delete this song?</p>
                  <div className="flex gap-2.5 justify-center">
                    <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-400 font-bold text-xs rounded-xl border border-gray-800 transition-colors">No, Keep it</button>
                    <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-colors">Yes, Delete</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
