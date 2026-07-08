import { NavLink, Link, useLocation } from 'react-router-dom';
import { Music, PlusCircle, Settings, Star, BookOpen } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';
import AuthDropdown from './AuthDropdown';

export default function Layout({ children }) {
  const { currentUser } = useSongbook();
  const location = useLocation();

  const isAtLeastAdmin =
    currentUser.role === 'admin' || currentUser.role === 'developer';
  const isDeveloper = currentUser.role === 'developer';

  const navItems = [
    { to: '/', label: 'Songbook', icon: BookOpen, exact: true },
    ...(isAtLeastAdmin
      ? [{ to: '/admin/add', label: 'Add Song', icon: PlusCircle }]
      : []),
    ...(isDeveloper
      ? [{ to: '/admin/settings', label: 'Console', icon: Settings }]
      : []),
    { to: '/profile', label: 'Favourites', icon: Star }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0b0c10] text-[#eaeaea] font-sans antialiased selection:bg-violet-600 selection:text-white">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-[#111219] border-r border-[#1f212d] shrink-0">
        <div className="px-5 py-4 border-b border-[#1f212d] flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
              <Music className="w-4.5 h-4.5 text-white" />
            </div>

            <div className="min-w-0">
              <h1 className="font-bold text-base tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent truncate">
                Choir Songbook
              </h1>
              <p className="text-[10px] text-gray-500 font-medium">
                Mobile-First Hymnal
              </p>
            </div>
          </Link>

          <AuthDropdown />
        </div>

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
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
              <Music className="w-4 h-4 text-white" />
            </div>

            <span className="font-bold text-base tracking-tight text-white">
              Choir Book
            </span>
          </Link>

          <AuthDropdown />
        </header>

        <main className="flex-1 p-3 sm:p-5 md:p-10 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Bottom Navigation */}
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
    </div>
  );
}