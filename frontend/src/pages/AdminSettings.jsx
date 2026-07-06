import { useState } from 'react';
import { Mail, Plus, Trash2, Edit2, Globe, Tag, Check, X, ShieldAlert } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';

export default function AdminSettings() {
  const {
    languages,
    categories,
    adminEmails,
    addAdminEmail,
    removeAdminEmail,
    renameCategory,
    deleteCategory,
    renameLanguage,
    deleteLanguage
  } = useSongbook();

  // Local state for admin email form
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Editing state for languages
  const [editingLanguage, setEditingLanguage] = useState(null); // { oldName, newName }
  // Editing state for categories
  const [editingCategory, setEditingCategory] = useState(null); // { oldName, newName }

  // Admin emails handler
  const handleAddEmail = (e) => {
    e.preventDefault();
    setEmailError('');
    const email = newAdminEmail.trim();

    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    addAdminEmail(email);
    setNewAdminEmail('');
  };

  // Language rename handler
  const handleRenameLanguageSubmit = (oldName) => {
    if (!editingLanguage || !editingLanguage.newName.trim()) return;
    renameLanguage(oldName, editingLanguage.newName.trim());
    setEditingLanguage(null);
  };

  // Category rename handler
  const handleRenameCategorySubmit = (oldName) => {
    if (!editingCategory || !editingCategory.newName.trim()) return;
    renameCategory(oldName, editingCategory.newName.trim());
    setEditingCategory(null);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-950/40 border border-violet-900/30 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Developer Console</h2>
          <p className="text-xs text-gray-500">Manage admin privileges, languages tags, and global categories</p>
        </div>
      </div>

      {/* Admin Email Management Section */}
      <div className="p-6 bg-[#111219] border border-[#1f212d] rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Mail className="w-4 h-4 text-violet-400" /> Admin Access Controls
        </h3>
        <p className="text-xs text-gray-400">
          Admins can add/edit songs and upload MP3 audio. Add approved Google emails below.
        </p>

        {/* List of Admins */}
        <div className="grid gap-2">
          {adminEmails.map((email) => (
            <div key={email} className="flex items-center justify-between p-3.5 bg-gray-900/30 border border-[#1f212d]/60 rounded-xl">
              <span className="text-xs font-semibold text-gray-300">{email}</span>
              {email !== 'allen@example.com' ? (
                <button
                  onClick={() => removeAdminEmail(email)}
                  className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remove Admin Role"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-[9px] font-black uppercase text-violet-400 bg-violet-950/20 border border-violet-900/30 px-2 py-0.5 rounded">
                  Primary Dev
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Add Email Form */}
        <form onSubmit={handleAddEmail} className="space-y-2.5">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. choir.member@gmail.com"
              value={newAdminEmail}
              onChange={(e) => {
                setNewAdminEmail(e.target.value);
                setEmailError('');
              }}
              className="flex-1 px-4 py-3 bg-gray-950 border border-[#1f212d] focus:border-violet-500 rounded-2xl text-xs placeholder-gray-600 focus:outline-none transition-colors shadow-inner"
            />
            <button
              type="submit"
              className="px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl flex items-center justify-center font-bold text-xs transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Admin
            </button>
          </div>
          {emailError && (
            <p className="text-xs font-semibold text-red-400">{emailError}</p>
          )}
        </form>
      </div>

      {/* Global Languages Editor */}
      <div className="p-6 bg-[#111219] border border-[#1f212d] rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-violet-400" /> Manage Languages Tags
        </h3>
        <p className="text-xs text-gray-400">
          Renaming a language updates it in all corresponding songs. Deleting removes the tag globally.
        </p>

        <div className="grid gap-2">
          {languages.map((lang) => (
            <div key={lang} className="flex items-center justify-between p-3.5 bg-gray-900/30 border border-[#1f212d]/60 rounded-xl">
              {editingLanguage && editingLanguage.oldName === lang ? (
                <div className="flex items-center gap-2 flex-1 mr-4">
                  <input
                    type="text"
                    value={editingLanguage.newName}
                    onChange={(e) => setEditingLanguage({ ...editingLanguage, newName: e.target.value })}
                    className="flex-1 px-3 py-1.5 bg-gray-950 border border-violet-500/60 rounded-xl text-xs text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRenameLanguageSubmit(lang)}
                    className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingLanguage(null)}
                    className="p-1.5 bg-gray-800 text-gray-400 rounded-lg hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-xs font-semibold text-gray-300">{lang}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingLanguage({ oldName: lang, newName: lang })}
                      className="p-1 text-gray-500 hover:text-violet-400 transition-colors"
                      title="Rename Language"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteLanguage(lang)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      title="Delete Language Tag"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Global Categories Editor */}
      <div className="p-6 bg-[#111219] border border-[#1f212d] rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Tag className="w-4 h-4 text-indigo-400" /> Manage Categories
        </h3>
        <p className="text-xs text-gray-400">
          Renaming a category updates it in all corresponding songs. Deleting removes it from all songs.
        </p>

        <div className="grid gap-2">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center justify-between p-3.5 bg-gray-900/30 border border-[#1f212d]/60 rounded-xl">
              {editingCategory && editingCategory.oldName === cat ? (
                <div className="flex items-center gap-2 flex-1 mr-4">
                  <input
                    type="text"
                    value={editingCategory.newName}
                    onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                    className="flex-1 px-3 py-1.5 bg-gray-950 border border-violet-500/60 rounded-xl text-xs text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRenameCategorySubmit(cat)}
                    className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="p-1.5 bg-gray-800 text-gray-400 rounded-lg hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-xs font-semibold text-gray-300">{cat}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingCategory({ oldName: cat, newName: cat })}
                      className="p-1 text-gray-500 hover:text-violet-400 transition-colors"
                      title="Rename Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
