import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Save, Trash2, Plus, X, Globe, Tag, Music, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';

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

  // Form setup using react-hook-form
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title: songToEdit?.title || '',
      lyrics: songToEdit?.lyrics || '',
      transliteration: songToEdit?.transliteration || '',
      audioUrl: songToEdit?.audioUrl || ''
    }
  });

  // Local state for tags
  const [songLanguages, setSongLanguages] = useState(() => songToEdit ? songToEdit.languages || [] : []);
  const [songCategories, setSongCategories] = useState(() => songToEdit ? songToEdit.categories || [] : []);

  // Tag inputs
  const [newLanguageInput, setNewLanguageInput] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showLanguageSuggestions, setShowLanguageSuggestions] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  // Confirm delete dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Audio Upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [audioSource, setAudioSource] = useState(() => {
    // If editing a song and its audio URL is an external link, default to 'url'
    if (songToEdit?.audioUrl && !songToEdit.audioUrl.includes('/uploads/')) {
      return 'url';
    }
    return 'upload';
  });



  // Form submission handler
  const onSubmit = async (data) => {
    const payload = {
      ...data,
      languages: songLanguages.length > 0 ? songLanguages : ['English'], // Fallback if empty
      categories: songCategories
    };

    // If uploading a file, clear manual audioUrl input from payload
    if (audioSource === 'upload') {
      payload.audioUrl = '';
    }

    try {
      let savedSong = null;
      if (isEditMode) {
        savedSong = await updateSong(id, payload);
      } else {
        savedSong = await addSong(payload);
      }

      // If a file is selected and upload tab is active, execute file upload
      if (audioSource === 'upload' && selectedFile && savedSong) {
        setIsUploading(true);
        await uploadSongAudio(savedSong.id, selectedFile);
        setIsUploading(false);
      }

      navigate(`/song/${savedSong.id || id}`);
    } catch (err) {
      console.error("Failed to save song:", err);
      setIsUploading(false);
    }
  };

  // Delete song handler
  const handleDelete = async () => {
    if (isEditMode) {
      try {
        await deleteSong(id);
        navigate('/');
      } catch (err) {
        console.error("Failed to delete song:", err);
      }
    }
  };


  // Tag management helpers
  const addLanguage = (lang) => {
    const formatted = lang.trim();
    if (formatted && !songLanguages.includes(formatted)) {
      setSongLanguages(prev => [...prev, formatted]);
    }
    setNewLanguageInput('');
    setShowLanguageSuggestions(false);
  };

  const removeLanguage = (lang) => {
    setSongLanguages(prev => prev.filter(l => l !== lang));
  };

  const addCategory = (cat) => {
    const formatted = cat.trim();
    if (formatted && !songCategories.includes(formatted)) {
      setSongCategories(prev => [...prev, formatted]);
    }
    setNewCategoryInput('');
    setShowCategorySuggestions(false);
  };

  const removeCategory = (cat) => {
    setSongCategories(prev => prev.filter(c => c !== cat));
  };

  // Filters for suggestions
  const languageSuggestions = availableLanguages.filter(
    lang => lang.toLowerCase().includes(newLanguageInput.toLowerCase()) && !songLanguages.includes(lang)
  );

  const categorySuggestions = availableCategories.filter(
    cat => cat.toLowerCase().includes(newCategoryInput.toLowerCase()) && !songCategories.includes(cat)
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#1f212d] pb-4">
        <button
          onClick={() => navigate(isEditMode ? `/song/${id}` : '/')}
          className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#111219] flex items-center gap-2 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Cancel</span>
        </button>

        <h2 className="text-lg font-bold text-white">
          {isEditMode ? 'Edit Song Details' : 'Add New Song'}
        </h2>

        <div></div> {/* Spacer */}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Inputs Grid */}
        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Song Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. O Come All Ye Faithful"
              {...register('title', { required: 'Title is required' })}
              className={`w-full px-4 py-3 bg-[#111219] border ${
                errors.title ? 'border-red-500/50 focus:border-red-500' : 'border-[#1f212d] focus:border-violet-500'
              } rounded-2xl text-sm placeholder-gray-600 focus:outline-none transition-colors shadow-inner`}
            />
            {errors.title && (
              <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {errors.title.message}
              </span>
            )}
          </div>

          {/* Languages Tags Selector */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-violet-400" /> Languages (Multiple)
            </label>
            
            {/* Active Langs pills */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {songLanguages.map(lang => (
                <span key={lang} className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-400 bg-violet-950/30 border border-violet-900/40 px-2.5 py-1 rounded-full">
                  {lang}
                  <button type="button" onClick={() => removeLanguage(lang)} className="hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type or select a language..."
                value={newLanguageInput}
                onChange={(e) => {
                  setNewLanguageInput(e.target.value);
                  setShowLanguageSuggestions(true);
                }}
                onFocus={() => setShowLanguageSuggestions(true)}
                className="flex-1 px-4 py-3 bg-[#111219] border border-[#1f212d] focus:border-violet-500 rounded-2xl text-sm placeholder-gray-600 focus:outline-none transition-colors shadow-inner"
              />
              <button
                type="button"
                onClick={() => addLanguage(newLanguageInput)}
                className="px-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Suggestions list */}
            {showLanguageSuggestions && newLanguageInput && languageSuggestions.length > 0 && (
              <ul className="absolute z-30 left-0 right-0 mt-1 bg-[#161722] border border-[#1f212d] rounded-2xl shadow-xl max-h-40 overflow-y-auto divide-y divide-gray-800">
                {languageSuggestions.map(lang => (
                  <li
                    key={lang}
                    onClick={() => addLanguage(lang)}
                    className="px-4 py-2.5 hover:bg-violet-950/20 text-sm font-semibold text-gray-300 hover:text-white cursor-pointer transition-colors"
                  >
                    {lang}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Categories Tags Selector */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" /> Categories (Multiple)
            </label>

            {/* Active Categories pills */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {songCategories.map(cat => (
                <span key={cat} className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-950/30 border border-indigo-900/40 px-2.5 py-1 rounded-full">
                  {cat}
                  <button type="button" onClick={() => removeCategory(cat)} className="hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type or select a category..."
                value={newCategoryInput}
                onChange={(e) => {
                  setNewCategoryInput(e.target.value);
                  setShowCategorySuggestions(true);
                }}
                onFocus={() => setShowCategorySuggestions(true)}
                className="flex-1 px-4 py-3 bg-[#111219] border border-[#1f212d] focus:border-violet-500 rounded-2xl text-sm placeholder-gray-600 focus:outline-none transition-colors shadow-inner"
              />
              <button
                type="button"
                onClick={() => addCategory(newCategoryInput)}
                className="px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Suggestions list */}
            {showCategorySuggestions && newCategoryInput && categorySuggestions.length > 0 && (
              <ul className="absolute z-30 left-0 right-0 mt-1 bg-[#161722] border border-[#1f212d] rounded-2xl shadow-xl max-h-40 overflow-y-auto divide-y divide-gray-800">
                {categorySuggestions.map(cat => (
                  <li
                    key={cat}
                    onClick={() => addCategory(cat)}
                    className="px-4 py-2.5 hover:bg-indigo-950/20 text-sm font-semibold text-gray-300 hover:text-white cursor-pointer transition-colors"
                  >
                    {cat}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Reference Audio Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-emerald-400" /> Reference Audio (Optional)
            </label>
            
            {/* Tabs for audio selection source */}
            <div className="flex gap-1.5 p-1 bg-gray-950 border border-[#1f212d] rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setAudioSource('upload')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  audioSource === 'upload'
                    ? 'bg-[#111219] text-white border border-[#1f212d]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Upload MP3
              </button>
              <button
                type="button"
                onClick={() => setAudioSource('url')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  audioSource === 'url'
                    ? 'bg-[#111219] text-white border border-[#1f212d]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                External URL
              </button>
            </div>

            {audioSource === 'upload' ? (
              <div className="space-y-3">
                {/* Current Active File (for edit mode) */}
                {isEditMode && songToEdit?.audioUrl && !selectedFile && (
                  <div className="flex items-center justify-between p-3.5 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl text-xs">
                    <span className="text-emerald-400 font-medium truncate max-w-[80%]">
                      Active: {songToEdit.audioUrl.split('/').pop()}
                    </span>
                    <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/20">
                      On Server
                    </span>
                  </div>
                )}

                {/* Dropzone File Input */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.name.toLowerCase().endsWith(".mp3")) {
                      setSelectedFile(file);
                    }
                  }}
                  className="border border-dashed border-[#1f212d] hover:border-violet-500/50 rounded-2xl p-6 text-center transition-all bg-[#111219]/20 hover:bg-[#111219]/40 cursor-pointer relative"

                >
                  <input
                    type="file"
                    accept="audio/mp3,audio/mpeg"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <Music className="w-8 h-8 text-gray-500" />
                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white truncate max-w-[250px]">{selectedFile.name}</p>
                        <p className="text-[10px] text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-gray-300">Click to choose or drag MP3 file here</p>
                        <p className="text-[10px] text-gray-500">Maximum size: 15MB. Only MP3 allowed.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Remove Selected Button */}
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Remove selected file
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
          </div>

          {/* Song Lyrics */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Lyrics (Verses & Chorus) <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Enter song lyrics here..."
              rows={10}
              {...register('lyrics', { required: 'Lyrics are required' })}
              className={`w-full px-4 py-3 bg-[#111219] border font-serif ${
                errors.lyrics ? 'border-red-500/50 focus:border-red-500' : 'border-[#1f212d] focus:border-violet-500'
              } rounded-2xl text-sm placeholder-gray-600 focus:outline-none transition-colors shadow-inner`}
            />
            {errors.lyrics && (
              <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {errors.lyrics.message}
              </span>
            )}
          </div>

          {/* Transliteration Lyrics */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Romanized Transliteration (Optional)
            </label>
            <textarea
              placeholder="Enter Romanized / phonetic transliterated lyrics if applicable..."
              rows={8}
              {...register('transliteration')}
              className="w-full px-4 py-3 bg-[#111219] border border-[#1f212d] focus:border-violet-500 rounded-2xl text-sm font-serif placeholder-gray-600 focus:outline-none transition-colors shadow-inner"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[#1f212d]/60">
          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-99 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-violet-600/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                <span>Uploading track...</span>
              </>
            ) : (
              <>
                <Save className="w-4.5 h-4.5" />
                <span>{isEditMode ? 'Update Song Details' : 'Publish Song'}</span>
              </>
            )}
          </button>

          {/* Delete Option for Edit Mode */}
          {isEditMode && (
            <div className="space-y-3">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 bg-red-950/20 hover:bg-red-950/30 border border-red-900/30 text-red-400 hover:text-red-300 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Song</span>
                </button>
              ) : (
                <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-2xl space-y-3 text-center animate-fade-in">
                  <p className="text-xs font-bold text-red-300">Are you sure you want to permanently delete this song?</p>
                  <div className="flex gap-2.5 justify-center">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-400 font-bold text-xs rounded-xl border border-gray-800 transition-colors"
                    >
                      No, Keep it
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-colors"
                    >
                      Yes, Delete it
                    </button>
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
