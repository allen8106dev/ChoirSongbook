import { useState } from 'react';
import { Mail, Plus, Trash2, Edit2, Globe, Tag, Check, X, ShieldAlert, Building2, AlertTriangle } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';
import { MAX_ORG_NAME, MAX_LANGUAGE_NAME, MAX_CATEGORY_NAME } from '../validation';

export default function AdminSettings() {
  const {
    languages,
    categories,
    currentUser,
    organizations,
    ownedOrganization,
    activeOrganization,
    activeOrganizationId,
    switchOrganization,
    adminEmails,
    addAdminEmail,
    removeAdminEmail,
    createOrganization,
    renameCategory,
    deleteCategory,
    renameLanguage,
    deleteLanguage
  } = useSongbook();

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newOrganizationName, setNewOrganizationName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [organizationError, setOrganizationError] = useState('');
  const [editingLanguage, setEditingLanguage] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [renameLanguageError, setRenameLanguageError] = useState('');
  const [renameCategoryError, setRenameCategoryError] = useState('');

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

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    setOrganizationError('');
    const name = newOrganizationName.trim();
    if (!name) {
      setOrganizationError('Please enter an organization name.');
      return;
    }
    if (name.length > MAX_ORG_NAME) {
      setOrganizationError(`Organization name must not exceed ${MAX_ORG_NAME} characters.`);
      return;
    }
    try {
      await createOrganization(name);
      setNewOrganizationName('');
    } catch {
      setOrganizationError('Could not create organization. Please try again.');
    }
  };

  const handleRenameLanguageSubmit = (oldName) => {
    const newName = editingLanguage?.newName?.trim();
    if (!newName) { setRenameLanguageError('Language name must not be empty.'); return; }
    if (newName.length > MAX_LANGUAGE_NAME) { setRenameLanguageError(`Language name must not exceed ${MAX_LANGUAGE_NAME} characters.`); return; }
    setRenameLanguageError('');
    renameLanguage(oldName, newName);
    setEditingLanguage(null);
  };

  const handleRenameCategorySubmit = (oldName) => {
    const newName = editingCategory?.newName?.trim();
    if (!newName) { setRenameCategoryError('Category name must not be empty.'); return; }
    if (newName.length > MAX_CATEGORY_NAME) { setRenameCategoryError(`Category name must not exceed ${MAX_CATEGORY_NAME} characters.`); return; }
    setRenameCategoryError('');
    renameCategory(oldName, newName);
    setEditingCategory(null);
  };

  const RowShell = ({ children }) => (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#1f212d] bg-gray-900/30 p-3">
      {children}
    </div>
  );

  const EditableRow = ({
    name,
    isEditing,
    editValue,
    editError,
    maxLength,
    onEdit,
    onEditChange,
    onEditSubmit,
    onEditCancel,
    onDelete,
    accentClass,
    inputBorderClass = 'border-violet-500/60',
    saveButtonClass = 'bg-emerald-600 hover:bg-emerald-500',
  }) => (
    <RowShell>
      {isEditing ? (
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={editValue}
              maxLength={maxLength}
              onChange={onEditChange}
              className={`min-w-0 flex-1 rounded-2xl bg-gray-950 px-4 py-3 text-sm text-white focus:outline-none border ${editError ? 'border-red-500/50' : inputBorderClass}`}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <button onClick={onEditSubmit} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl px-4 text-sm font-semibold text-white ${saveButtonClass}`}>
                <Check className="w-4 h-4" /> Save
              </button>
              <button onClick={onEditCancel} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-gray-800 px-4 text-sm font-semibold text-gray-300 hover:text-white">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
          {editError && (
            <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {editError}
            </span>
          )}
        </div>
      ) : (
        <>
          <span className={`min-w-0 break-words text-sm font-medium leading-snug ${accentClass || 'text-gray-300'}`}>{name}</span>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:gap-1.5">
            <button onClick={onEdit} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gray-800/60 px-3 text-gray-200 transition-colors hover:bg-violet-950/20 hover:text-violet-300 sm:min-h-0 sm:p-1.5 sm:text-gray-500 sm:hover:bg-violet-950/20" title="Edit" aria-label="Edit">
              <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
            <button onClick={onDelete} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gray-800/60 px-3 text-gray-200 transition-colors hover:bg-red-950/20 hover:text-red-300 sm:min-h-0 sm:p-1.5 sm:text-gray-500 sm:hover:bg-red-950/20" title="Delete" aria-label="Delete">
              <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </>
      )}
    </RowShell>
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
          <p className="text-sm sm:text-xs text-gray-500">Manage members, language tags, and categories</p>
        </div>
      </div>

      {/* Organization Management */}
      <div className="w-full p-4 sm:p-5 bg-[#111219] border border-[#1f212d] rounded-3xl space-y-4 overflow-hidden">
        <div>
          <h3 className="flex items-center gap-2 text-[15px] sm:text-sm font-semibold text-white sm:uppercase sm:tracking-wider">
            <Building2 className="w-4 h-4 text-violet-400" /> Organization
          </h3>
          <p className="text-sm sm:text-xs text-gray-400 mt-1">
            Songs, members, categories, and languages are scoped to the selected organization.
          </p>
        </div>

        {organizations.length > 0 && (
          <div className="space-y-3">
            <select
              value={activeOrganizationId}
              onChange={(event) => switchOrganization(event.target.value)}
              className="w-full rounded-2xl border border-[#1f212d] bg-gray-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-violet-500"
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>

            {activeOrganization && (
              <div className="grid gap-2 text-sm text-gray-300 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#1f212d] bg-gray-900/30 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Owner</p>
                  <p className="mt-1 break-words font-semibold">{activeOrganization.owner_email}</p>
                </div>
                <div className="rounded-2xl border border-[#1f212d] bg-gray-900/30 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Songs</p>
                  <p className="mt-1 font-semibold">{activeOrganization.song_count}</p>
                </div>
                <div className="rounded-2xl border border-[#1f212d] bg-gray-900/30 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Members</p>
                  <p className="mt-1 font-semibold">{adminEmails.length}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!ownedOrganization && activeOrganization?.owner_email?.toLowerCase() === currentUser?.email?.toLowerCase() && (
        <form onSubmit={handleCreateOrganization} className="space-y-2">
          <div className="grid gap-2 sm:flex sm:flex-row">
            <input
              type="text"
              placeholder="Create another organization"
              value={newOrganizationName}
              maxLength={MAX_ORG_NAME}
              onChange={(e) => { setNewOrganizationName(e.target.value); setOrganizationError(''); }}
              className="flex-1 px-4 py-3 bg-gray-950 border border-[#1f212d] focus:border-violet-500 rounded-2xl text-sm placeholder-gray-600 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-500 sm:shrink-0 sm:text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Create Org
            </button>
          </div>
          {organizationError && <p className="text-sm font-semibold text-red-400">{organizationError}</p>}
        </form>
        )}
      </div>

      {/* Member Email Management */}
      <div className="w-full p-4 sm:p-5 bg-[#111219] border border-[#1f212d] rounded-3xl space-y-4 overflow-hidden">
        <div>
          <h3 className="flex items-center gap-2 text-[15px] sm:text-sm font-semibold text-white sm:uppercase sm:tracking-wider">
            <Mail className="w-4 h-4 text-violet-400" /> Member Access Controls
          </h3>
          <p className="text-sm sm:text-xs text-gray-400 mt-1">
            Members can be part of multiple organizations. Add approved Google emails below.
          </p>
        </div>

        {/* Admin list */}
        <div className="grid gap-3">
          {adminEmails.map((email) => (
            <RowShell key={email}>
              <span className="min-w-0 break-words text-sm font-medium leading-snug text-gray-200">{email}</span>
            {email !== 'allen8106.dev@gmail.com' ? (
                <button
                  onClick={() => removeAdminEmail(email)}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gray-800/60 px-4 text-sm font-semibold text-gray-200 transition-colors hover:bg-red-950/20 hover:text-red-300 sm:min-h-0 sm:w-fit sm:px-3 sm:py-1.5 sm:text-gray-500 sm:hover:bg-red-950/20 sm:justify-self-end"
                  title="Remove Admin Role"
                  aria-label="Remove member"
                >
                  <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              ) : (
              <span className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-violet-900/30 bg-violet-950/20 px-4 text-sm font-semibold text-violet-300 sm:min-h-0 sm:w-fit sm:px-3 sm:py-1.5 sm:text-[9px] sm:font-black sm:uppercase sm:justify-self-end">
                Developer
              </span>
              )}
            </RowShell>
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
              <Plus className="w-3.5 h-3.5" /> Add Member
            </button>
          </div>
          {emailError && <p className="text-sm font-semibold text-red-400">{emailError}</p>}
        </form>
      </div>

      {/* Global Languages Editor */}
      <div className="w-full p-4 sm:p-5 bg-[#111219] border border-[#1f212d] rounded-3xl space-y-4 overflow-hidden">
    <div>
      <h3 className="flex items-center gap-2 text-[15px] sm:text-sm font-semibold text-white sm:uppercase sm:tracking-wider">
        <Globe className="w-4 h-4 text-violet-400" />
        Manage Language Tags
      </h3>

      <p className="text-sm sm:text-xs text-gray-400 mt-1">
        Renaming updates all songs. Deleting removes the tag globally.
      </p>
    </div>

    <div className="grid gap-3">
      {languages.map((lang) => (
        <EditableRow
          key={lang}
          name={lang}
          isEditing={editingLanguage?.oldName === lang}
          editValue={editingLanguage?.newName ?? lang}
          editError={editingLanguage?.oldName === lang ? renameLanguageError : ''}
          maxLength={MAX_LANGUAGE_NAME}
          onEdit={() => { setEditingLanguage({ oldName: lang, newName: lang }); setRenameLanguageError(''); }}
          onEditChange={(e) => { setEditingLanguage((current) => ({ ...(current || { oldName: lang }), newName: e.target.value })); setRenameLanguageError(''); }}
          onEditSubmit={() => handleRenameLanguageSubmit(lang)}
          onEditCancel={() => { setEditingLanguage(null); setRenameLanguageError(''); }}
          onDelete={() => deleteLanguage(lang)}
          accentClass="text-violet-300"
          saveButtonClass="bg-violet-600 hover:bg-violet-500"
        />
      ))}

      {languages.length === 0 && (
        <p className="py-4 text-center text-sm text-gray-600">
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
            <EditableRow
              key={cat}
              name={cat}
              isEditing={editingCategory?.oldName === cat}
              editValue={editingCategory?.newName ?? cat}
              editError={editingCategory?.oldName === cat ? renameCategoryError : ''}
              maxLength={MAX_CATEGORY_NAME}
              onEdit={() => { setEditingCategory({ oldName: cat, newName: cat }); setRenameCategoryError(''); }}
              onEditChange={(e) => { setEditingCategory((current) => ({ ...(current || { oldName: cat }), newName: e.target.value })); setRenameCategoryError(''); }}
              onEditSubmit={() => handleRenameCategorySubmit(cat)}
              onEditCancel={() => { setEditingCategory(null); setRenameCategoryError(''); }}
              onDelete={() => deleteCategory(cat)}
              accentClass="text-indigo-300"
              saveButtonClass="bg-emerald-600 hover:bg-emerald-500"
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
