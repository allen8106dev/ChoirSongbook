import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Save, Trash2, Plus, X, Globe, Tag, Music, ArrowLeft, AlertTriangle, FileText } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';

// ─── Parse existing lyrics string into sections ─────────────────────────────
// Format stored: "=== Heading ===\nlyrics\n\n=== Heading2 ===\nlyrics2"
// If no section markers found, treat whole string as first section.
function parseLyricSections(rawLyrics) {
  if (!rawLyrics) return [{ heading: '', text: '' }];
  const sectionRegex = /^===\s*(.+?)\s*===/m;
  if (!sectionRegex.test(rawLyrics)) {
    return [{ heading: '', text: rawLyrics }];
  }
  const parts = rawLyrics.split(/\n*===\s*(.+?)\s*===\n*/);
  // parts: ['', 'heading1', 'text1', 'heading2', 'text2', ...]
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
    addSong,
    updateSong,
    deleteSong,
    uploadSongAudio
  } = useSongbook();

  const songToEdit = isEditMode ? songs.find(s => s.id === id) : null;

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title: songToEdit?.title || '',
      audioUrl: songToEdit?.audioUrl || ''
    }
  });

  // Tags
  const [songLanguages, setSongLanguages] = useState(() => songToEdit ? songToEdit.languages || [] : []);
  const [songCategories, setSongCategories] = useState(() => songToEdit ? songToEdit.categories || [] : []);
  const [newLanguageInput, setNewLanguageInput] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showLanguageSuggestions, setShowLanguageSuggestions] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  // Multi-section lyrics
  const [lyricSections, setLyricSections] = useState(() => parseLyricSections(songToEdit?.lyrics));
  const [activeLyricTab, setActiveLyricTab] = useState(0);

  // Audio
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const showAudioComingSoon = !isEditMode;
  const [audioSource, setAudioSource] = useState(() => {
    if (songToEdit?.audioUrl && !songToEdit.audioUrl.includes('/uploads/')) return 'url';
    return 'upload';
  });

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    const payload = {
      ...data,
      lyrics: serializeLyricSections(lyricSections),
      transliteration: '',
      languages: songLanguages.length > 0 ? songLanguages : ['English'],
      categories: songCategories
    };
    if (audioSource === 'upload') payload.audioUrl = '';

    try {
      let savedSong = null;
      if (isEditMode) {
        savedSong = await updateSong(id, payload);
      } else {
        savedSong = await addSong(payload);
      }
      if (audioSource === 'upload' && selectedFile && savedSong) {
        setIsUploading(true);
        await uploadSongAudio(savedSong.id, selectedFile);
        setIsUploading(false);
      }
      navigate(`/song/${savedSong.id || id}`);
    } catch (err) {
      console.error('Failed to save song:', err);
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (isEditMode) {
      try { await deleteSong(id); navigate('/'); }
      catch (err) { console.error('Failed to delete song:', err); }
    }
  };

  // ─── Tag helpers ─────────────────────────────────────────────────────────
  const addLanguage = (lang) => {
    const f = lang.trim();
    if (f && !songLanguages.includes(f)) setSongLanguages(p => [...p, f]);
    setNewLanguageInput(''); setShowLanguageSuggestions(false);
  };
  const removeLanguage = (lang) => setSongLanguages(p => p.filter(l => l !== lang));

  const addCategory = (cat) => {
    const f = cat.trim();
    if (f && !songCategories.includes(f)) setSongCategories(p => [...p, f]);
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
    setLyricSections(p => p.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1f212d] pb-4">
        <button
          onClick={() => navigate(isEditMode ? `/song/${id}` : '/')}
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
            {...register('title', { required: 'Title is required' })}
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
                onChange={(e) => { setNewLanguageInput(e.target.value); setShowLanguageSuggestions(true); }}
                onFocus={() => setShowLanguageSuggestions(true)}
                className="flex-1 px-3 py-2.5 bg-[#111219] border border-[#1f212d] focus:border-violet-500 rounded-xl text-sm placeholder-gray-600 focus:outline-none transition-colors"
              />
              <button type="button" onClick={() => addLanguage(newLanguageInput)} className="px-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {showLanguageSuggestions && newLanguageInput && languageSuggestions.length > 0 && (
              <ul className="absolute z-30 left-0 right-0 mt-1 bg-[#161722] border border-[#1f212d] rounded-xl shadow-xl max-h-36 overflow-y-auto divide-y divide-gray-800/50">
                {languageSuggestions.map(lang => (
                  <li key={lang} onClick={() => addLanguage(lang)} className="px-3 py-2 hover:bg-violet-950/20 text-sm font-semibold text-gray-300 hover:text-white cursor-pointer transition-colors">{lang}</li>
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
                onChange={(e) => { setNewCategoryInput(e.target.value); setShowCategorySuggestions(true); }}
                onFocus={() => setShowCategorySuggestions(true)}
                className="flex-1 px-3 py-2.5 bg-[#111219] border border-[#1f212d] focus:border-violet-500 rounded-xl text-sm placeholder-gray-600 focus:outline-none transition-colors"
              />
              <button type="button" onClick={() => addCategory(newCategoryInput)} className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {showCategorySuggestions && newCategoryInput && categorySuggestions.length > 0 && (
              <ul className="absolute z-30 left-0 right-0 mt-1 bg-[#161722] border border-[#1f212d] rounded-xl shadow-xl max-h-36 overflow-y-auto divide-y divide-gray-800/50">
                {categorySuggestions.map(cat => (
                  <li key={cat} onClick={() => addCategory(cat)} className="px-3 py-2 hover:bg-indigo-950/20 text-sm font-semibold text-gray-300 hover:text-white cursor-pointer transition-colors">{cat}</li>
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
              {/* Add section button */}
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
            placeholder={`Section heading (e.g. English, Malayalam...)`}
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
            className="w-full px-4 py-3 bg-[#111219] border border-[#1f212d] focus:border-violet-500 rounded-2xl text-sm font-serif placeholder-gray-600 focus:outline-none transition-colors shadow-inner"
          />
          {lyricSections.every(s => !s.text.trim()) && (
            <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Lyrics are required
            </span>
          )}
        </div>

        {/* Reference Audio — below lyrics */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-emerald-400" /> Reference Audio (Optional)
          </label>

          {showAudioComingSoon ? (
            <div className="rounded-2xl border border-dashed border-[#1f212d] bg-[#111219]/30 px-4 py-5 text-center space-y-1.5">
              <p className="text-sm font-bold text-white">Coming soon</p>
              <p className="text-xs text-gray-500">MP3 upload and external audio URL support will be available here later.</p>
            </div>
          ) : (
            <>
              {/* Source toggle */}
              <div className="flex gap-1.5 p-1 bg-gray-950 border border-[#1f212d] rounded-2xl w-fit">
                {['upload', 'url'].map(src => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setAudioSource(src)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      audioSource === src ? 'bg-[#111219] text-white border border-[#1f212d]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {src === 'upload' ? 'Upload MP3' : 'External URL'}
                  </button>
                ))}
              </div>

              {audioSource === 'upload' ? (
                <div className="space-y-2">
                  {isEditMode && songToEdit?.audioUrl && !selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-xs">
                      <span className="text-emerald-400 font-medium truncate max-w-[80%]">Active: {songToEdit.audioUrl.split('/').pop()}</span>
                      <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/20">On Server</span>
                    </div>
                  )}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && file.name.toLowerCase().endsWith('.mp3')) setSelectedFile(file);
                    }}
                    className="border border-dashed border-[#1f212d] hover:border-violet-500/50 rounded-2xl p-5 text-center transition-all bg-[#111219]/20 hover:bg-[#111219]/40 cursor-pointer relative"
                  >
                    <input
                      type="file"
                      accept="audio/mp3,audio/mpeg"
                      onChange={(e) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-1.5">
                      <Music className="w-7 h-7 text-gray-500" />
                      {selectedFile ? (
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[250px]">{selectedFile.name}</p>
                          <p className="text-[10px] text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-gray-300">Click to choose or drag MP3 here</p>
                          <p className="text-[10px] text-gray-500">Max 15MB · MP3 only</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedFile && (
                    <button type="button" onClick={() => setSelectedFile(null)} className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                      <X className="w-3.5 h-3.5" /> Remove file
                    </button>
                  )}
                </div>
              ) : (
                <input
                  type="url"
                  placeholder="e.g. https://domain.com/audio/hymn.mp3"
                  {...register('audioUrl')}
                  className="w-full px-4 py-3 bg-[#111219] border border-[#1f212d] focus:border-violet-500 rounded-2xl text-sm placeholder-gray-600 focus:outline-none transition-colors shadow-inner"
                />
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[#1f212d]/60">
          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-violet-600/10 transition-all cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /><span>Uploading track...</span></>
            ) : (
              <><Save className="w-4 h-4" /><span>{isEditMode ? 'Update Song Details' : 'Publish Song'}</span></>
            )}
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
