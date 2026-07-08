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

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [editingLanguage, setEditingLanguage] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

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

  const handleRenameLanguageSubmit = (oldName) => {
    if (!editingLanguage || !editingLanguage.newName.trim()) return;
    renameLanguage(oldName, editingLanguage.newName.trim());
    setEditingLanguage(null);
  };

  const handleRenameCategorySubmit = (oldName) => {
    if (!editingCategory || !editingCategory.newName.trim()) return;
    renameCategory(oldName, editingCategory.newName.trim());
    setEditingCategory(null);
  };

  // Reusable list row — handles both view and edit mode
  const TagRow = ({ name, isEditing, editValue, onEdit, onEditChange, onEditSubmit, onEditCancel, onDelete, accentClass }) => (
    <div className="w-full rounded-2xl border border-[#1f212d]/60 bg-gray-900/30 p-4 sm:p-3">
      {isEditing ? (
        <div className="grid gap-3">
          <input
            type="text"
            value={editValue}
            onChange={onEditChange}
            className="w-full min-w-0 px-4 py-3 bg-gray-950 border border-violet-500/60 rounded-2xl text-sm text-white focus:outline-none"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button onClick={onEditSubmit} className="inline-flex items-center justify-center gap-1.5 min-h-11 px-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 shrink-0 text-sm font-semibold">
              <Check className="w-4 h-4" /> Save
            </button>
            <button onClick={onEditCancel} className="inline-flex items-center justify-center gap-1.5 min-h-11 px-4 bg-gray-800 text-gray-300 rounded-2xl hover:text-white shrink-0 text-sm font-semibold">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
          <span className={`min-w-0 text-sm font-semibold leading-snug break-words ${accentClass || 'text-gray-300'}`}>{name}</span>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-1.5 sm:shrink-0">
            <button onClick={onEdit} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-gray-800/60 px-3 text-gray-200 transition-colors hover:bg-violet-950/20 hover:text-violet-300 sm:min-h-0 sm:p-1.5 sm:text-gray-500 sm:hover:bg-violet-950/20" title="Rename">
              <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="sm:hidden text-sm font-semibold">Rename</span>
            </button>
            <button onClick={onDelete} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-gray-800/60 px-3 text-gray-200 transition-colors hover:bg-red-950/20 hover:text-red-300 sm:min-h-0 sm:p-1.5 sm:text-gray-500 sm:hover:bg-red-950/20" title="Delete">
              <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="sm:hidden text-sm font-semibold">Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-violet-950/40 border border-violet-900/30 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-violet-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[1.55rem] sm:text-xl font-bold text-white leading-tight">Developer Console</h2>
          <p className="text-sm sm:text-xs text-gray-500">Manage admin privileges, language tags, and global categories</p>
        </div>
      </div>

      {/* Admin Email Management */}
      <div className="w-full p-4 sm:p-5 bg-[#111219] border border-[#1f212d] rounded-3xl space-y-4 overflow-hidden">
        <div>
          <h3 className="flex items-center gap-2 text-[15px] sm:text-sm font-semibold text-white sm:uppercase sm:tracking-wider">
            <Mail className="w-4 h-4 text-violet-400" /> Admin Access Controls
          </h3>
          <p className="text-sm sm:text-xs text-gray-400 mt-1">
            Admins can add/edit songs and upload audio. Add approved Google emails below.
          </p>
        </div>

        {/* Admin list */}
        <div className="grid gap-3">
          {adminEmails.map((email) => (
            <div key={email} className="grid gap-3 rounded-2xl border border-[#1f212d]/60 bg-gray-900/30 p-4">
              <span className="min-w-0 break-words text-sm font-semibold text-gray-200 leading-snug">{email}</span>
              {email !== 'allen@example.com' ? (
                <button
                  onClick={() => removeAdminEmail(email)}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-gray-800/60 px-4 text-sm font-semibold text-gray-200 transition-colors hover:bg-red-950/20 hover:text-red-300 sm:min-h-0 sm:w-fit sm:px-3 sm:py-1.5 sm:text-gray-500 sm:hover:bg-red-950/20 sm:justify-self-end"
                  title="Remove Admin Role"
                >
                  <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  <span>Remove</span>
                </button>
              ) : (
                <span className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-violet-900/30 bg-violet-950/20 px-4 text-sm font-semibold text-violet-300 sm:min-h-0 sm:w-fit sm:px-3 sm:py-1.5 sm:text-[9px] sm:font-black sm:uppercase sm:justify-self-end">
                  Primary Dev
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Add email form */}
        <form onSubmit={handleAddEmail} className="space-y-2">
          <div className="grid gap-2 sm:flex sm:flex-row">
            <input
              type="text"
              placeholder="choir.member@gmail.com"
              value={newAdminEmail}
              onChange={(e) => { setNewAdminEmail(e.target.value); setEmailError(''); }}
              className="flex-1 px-4 py-3 bg-gray-950 border border-[#1f212d] focus:border-violet-500 rounded-2xl text-sm placeholder-gray-600 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-500 sm:shrink-0 sm:text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Admin
            </button>
          </div>
          {emailError && <p className="text-sm font-semibold text-red-400">{emailError}</p>}
        </form>
      </div>

  {/* Global Languages Editor */}
  <div className="w-full p-4 sm:p-5 bg-[#111219] border border-[#1f212d] rounded-2xl space-y-4">
    <div>
      <h3 className="flex items-center gap-2 text-[15px] sm:text-sm font-semibold text-white sm:uppercase sm:tracking-wider">
        <Globe className="w-4 h-4 text-violet-400" />
        Manage Language Tags
      </h3>

      <p className="text-sm sm:text-xs text-gray-400 mt-1">
        Renaming updates all songs. Deleting removes the tag globally.
      </p>
    </div>

    <div className="space-y-2">
      {languages.map((lang) => (
        <div
          key={lang}
          className="flex items-center justify-between border border-[#1f212d] rounded-xl p-3"
        >
          <span className="text-violet-300 font-medium">
            {lang}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setEditingLanguage({ oldName: lang, newName: lang })
              }
              className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm"
            >
              Rename
            </button>

            <button
              onClick={() => deleteLanguage(lang)}
              className="px-3 py-2 rounded-lg bg-red-900 text-white text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ))}

    {languages.length === 0 && (
      <p className="text-sm text-gray-600 text-center py-4">
        No language tags yet
      </p>
    )}
  </div>
</div>

      {/* Global Categories Editor */}
      <div className="w-full p-4 sm:p-5 bg-[#111219] border border-[#1f212d] rounded-3xl space-y-4 overflow-hidden">
        <div>
          <h3 className="flex items-center gap-2 text-[15px] sm:text-sm font-semibold text-white sm:uppercase sm:tracking-wider">
            <Tag className="w-4 h-4 text-indigo-400" /> Manage Categories
          </h3>
          <p className="text-sm sm:text-xs text-gray-400 mt-1">
            Renaming updates all songs. Deleting removes it from all songs.
          </p>
        </div>

        <div className="grid gap-3">
          {categories.map((cat) => (
            <TagRow
              key={cat}
              name={cat}
              isEditing={editingCategory?.oldName === cat}
              editValue={editingCategory?.newName ?? cat}
              onEdit={() => setEditingCategory({ oldName: cat, newName: cat })}
              onEditChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
              onEditSubmit={() => handleRenameCategorySubmit(cat)}
              onEditCancel={() => setEditingCategory(null)}
              onDelete={() => deleteCategory(cat)}
              accentClass="text-indigo-300"
            />
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-4">No categories yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
