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
    <div className="p-3 bg-gray-900/30 border border-[#1f212d]/60 rounded-xl">
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={editValue}
            onChange={onEditChange}
            className="flex-1 min-w-0 px-3 py-1.5 bg-gray-950 border border-violet-500/60 rounded-xl text-xs text-white focus:outline-none"
            autoFocus
          />
          <button onClick={onEditSubmit} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 shrink-0">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={onEditCancel} className="p-1.5 bg-gray-800 text-gray-400 rounded-lg hover:text-white shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-semibold truncate min-w-0 ${accentClass || 'text-gray-300'}`}>{name}</span>
          <div className="flex gap-1.5 shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-950/20 transition-colors" title="Rename">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/20 transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-950/40 border border-violet-900/30 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-violet-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white">Developer Console</h2>
          <p className="text-xs text-gray-500">Manage admin privileges, language tags, and global categories</p>
        </div>
      </div>

      {/* Admin Email Management */}
      <div className="p-5 bg-[#111219] border border-[#1f212d] rounded-3xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4 text-violet-400" /> Admin Access Controls
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Admins can add/edit songs and upload audio. Add approved Google emails below.
          </p>
        </div>

        {/* Admin list */}
        <div className="grid gap-2">
          {adminEmails.map((email) => (
            <div key={email} className="flex items-center justify-between gap-2 p-3 bg-gray-900/30 border border-[#1f212d]/60 rounded-xl">
              <span className="text-xs font-semibold text-gray-300 truncate min-w-0">{email}</span>
              {email !== 'allen@example.com' ? (
                <button
                  onClick={() => removeAdminEmail(email)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/20 transition-colors shrink-0"
                  title="Remove Admin Role"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-[9px] font-black uppercase text-violet-400 bg-violet-950/20 border border-violet-900/30 px-2 py-0.5 rounded shrink-0">
                  Primary Dev
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Add email form — stacked on mobile, row on larger */}
        <form onSubmit={handleAddEmail} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="choir.member@gmail.com"
              value={newAdminEmail}
              onChange={(e) => { setNewAdminEmail(e.target.value); setEmailError(''); }}
              className="flex-1 px-4 py-2.5 bg-gray-950 border border-[#1f212d] focus:border-violet-500 rounded-2xl text-xs placeholder-gray-600 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add Admin
            </button>
          </div>
          {emailError && <p className="text-xs font-semibold text-red-400">{emailError}</p>}
        </form>
      </div>

      {/* Global Languages Editor */}
      <div className="p-5 bg-[#111219] border border-[#1f212d] rounded-3xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-violet-400" /> Manage Language Tags
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Renaming updates all songs. Deleting removes the tag globally.
          </p>
        </div>

        <div className="grid gap-2">
          {languages.map((lang) => (
            <TagRow
              key={lang}
              name={lang}
              isEditing={editingLanguage?.oldName === lang}
              editValue={editingLanguage?.newName ?? lang}
              onEdit={() => setEditingLanguage({ oldName: lang, newName: lang })}
              onEditChange={(e) => setEditingLanguage({ ...editingLanguage, newName: e.target.value })}
              onEditSubmit={() => handleRenameLanguageSubmit(lang)}
              onEditCancel={() => setEditingLanguage(null)}
              onDelete={() => deleteLanguage(lang)}
              accentClass="text-violet-300"
            />
          ))}
          {languages.length === 0 && (
            <p className="text-xs text-gray-600 text-center py-4">No language tags yet</p>
          )}
        </div>
      </div>

      {/* Global Categories Editor */}
      <div className="p-5 bg-[#111219] border border-[#1f212d] rounded-3xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-400" /> Manage Categories
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Renaming updates all songs. Deleting removes it from all songs.
          </p>
        </div>

        <div className="grid gap-2">
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
            <p className="text-xs text-gray-600 text-center py-4">No categories yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
