import { useLayoutEffect, useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Music, PlusCircle, Settings, Star, BookOpen, Building2 } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';
import AuthDropdown from './AuthDropdown';

function MobileOrgTitle({ name }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  if (!name) return null;

  return (
    <div className="md:hidden relative mb-3" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="max-w-full flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors"
      >
        <span className="truncate max-w-[16rem]">{name}</span>
        <span className="shrink-0 text-gray-600">›</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 rounded-xl border border-[#1f212d] bg-[#111219] px-3 py-2 text-xs font-semibold text-gray-200 shadow-xl max-w-[min(20rem,calc(100vw-2rem))] break-words">
          {name}
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const { organizations, activeOrganizationId, switchOrganization, activeOrganization, isActiveOrgAdmin, isActiveOrgMember, isDeveloper } = useSongbook();
  const location = useLocation();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  const orgBase = activeOrganizationId ? `/org/${activeOrganizationId}` : '/';
  const logoTarget = isDeveloper ? '/' : orgBase;
  const appName = activeOrganization?.name || 'Choir Songbook';
  const isDeveloperHome = isDeveloper && location.pathname === '/';

  const navItems = [
    ...(!isDeveloperHome ? [{ to: orgBase, label: activeOrganization?.name || 'Home', icon: BookOpen, exact: true }] : []),
    ...(isActiveOrgMember && !isDeveloperHome && activeOrganizationId
      ? [{ to: `${orgBase}/admin/add`, label: 'Add Song', icon: PlusCircle }]
      : []),
    ...(isActiveOrgAdmin && !isDeveloper && activeOrganizationId
      ? [{ to: `${orgBase}/admin/settings`, label: 'Console', icon: Settings }]
      : []),
    ...(!isDeveloper ? [{ to: '/profile', label: 'Favourites', icon: Star }] : [])
  ];

  const handleOrganizationChange = (organizationId) => {
    switchOrganization(organizationId);
    navigate(`/org/${organizationId}`);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0b0c10] text-[#eaeaea] font-sans antialiased selection:bg-violet-600 selection:text-white">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-[#111219] border-r border-[#1f212d] shrink-0">
        <div className="px-5 py-4 border-b border-[#1f212d] flex items-center justify-between gap-2">
          <Link to={logoTarget} className="flex items-center gap-3 group min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
              <Music className="w-4.5 h-4.5 text-white" />
            </div>

            <div className="min-w-0">
              <h1 className="font-bold text-base tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent truncate">
                {appName}
              </h1>
              <p className="text-[10px] text-gray-500 font-medium">
                Choir Songbook
              </p>
            </div>
          </Link>

          <AuthDropdown />
        </div>
        {organizations.length > 0 && (
          <div className="border-b border-[#1f212d] px-4 py-3">
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <Building2 className="h-3 w-3" /> Organization
            </label>
            <select
              value={activeOrganizationId}
              onChange={(event) => handleOrganizationChange(event.target.value)}
              className="w-full rounded-xl border border-[#1f212d] bg-[#0b0c10] px-3 py-2 text-xs font-semibold text-gray-200 outline-none focus:border-violet-500"
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex-1 px-4 py-5 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-violet-600/10 border-l-4 border-violet-500 text-violet-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#111219] border-b border-[#1f212d]">
          <Link to={logoTarget} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">Choir Songbook</span>
          </Link>
          <AuthDropdown />
        </header>

        <main className="flex-1 p-3 sm:p-5 md:p-10 max-w-4xl mx-auto w-full">
          <MobileOrgTitle name={activeOrganization?.name} />
          {children}
        </main>
      </div>

      {/* Bottom Navigation */}
      {navItems.length > 0 && (
      <nav className="md:hidden fixed left-0 right-0 bottom-0 h-16 bg-[#111219] border-t border-[#1f212d] flex items-center justify-around z-40">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive ? 'text-violet-400' : 'text-gray-500'
              }`}
            >
              <item.icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      )}
    </div>
  );
}
