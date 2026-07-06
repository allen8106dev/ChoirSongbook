import { NavLink, Link, useLocation } from 'react-router-dom';
import { Music, PlusCircle, Settings, User, BookOpen } from 'lucide-react';
import { useSongbook } from '../context/SongbookContext';

export default function Layout({ children }) {
  const { currentUser } = useSongbook();
  const location = useLocation();

  const isAtLeastAdmin = currentUser.role === 'admin' || currentUser.role === 'developer';
  const isDeveloper = currentUser.role === 'developer';

  const navItems = [
    { to: '/', label: 'Songbook', icon: BookOpen, exact: true },
    ...(isAtLeastAdmin ? [{ to: '/admin/add', label: 'Add Song', icon: PlusCircle }] : []),
    ...(isDeveloper ? [{ to: '/admin/settings', label: 'Console', icon: Settings }] : []),
    { to: '/profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0b0c10] text-[#eaeaea] font-sans antialiased selection:bg-violet-600 selection:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-[#111219] border-r border-[#1f212d] shrink-0">
        <div className="p-6 border-b border-[#1f212d]">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform duration-300">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Choir Songbook
              </h1>
              <p className="text-xs text-gray-500 font-medium">Mobile-First Hymnal</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border-l-4 border-violet-500 text-violet-400 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <a
            href="http://localhost:8000/api/songs/pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent transition-all duration-200"
          >
            <svg className="w-5 h-5 shrink-0 text-violet-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Printable PDF</span>
          </a>
        </nav>


        {/* User Identity Info */}
        <div className="p-4 border-t border-[#1f212d] bg-[#0c0d13]">
          <div className="flex items-center gap-3 p-2.5 rounded-xl glass-panel">
            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center font-bold text-sm text-violet-400 border border-white/5 uppercase">
              {currentUser.email ? currentUser.email.charAt(0) : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{currentUser.email || 'Guest User'}</p>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 border ${
                currentUser.role === 'developer'
                  ? 'bg-violet-950/40 text-violet-400 border-violet-500/30'
                  : currentUser.role === 'admin'
                  ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/30'
                  : 'bg-gray-900/60 text-gray-400 border-gray-800'
              }`}>
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-[#111219] border-b border-[#1f212d] sticky top-0 z-30">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              Choir Book
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
              currentUser.role === 'developer'
                ? 'bg-violet-950/40 text-violet-400 border-violet-500/30'
                : currentUser.role === 'admin'
                ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/30'
                : 'bg-gray-900/60 text-gray-400 border-gray-800'
            }`}>
              {currentUser.role}
            </span>
          </div>
        </header>

        {/* Dynamic Route Container */}
        <main className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#111219]/95 backdrop-blur-md border-t border-[#1f212d] flex items-center justify-around px-4 z-40">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.to 
            : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                isActive ? 'text-violet-400' : 'text-gray-500'
              }`}
            >
              <item.icon className="w-5.5 h-5.5 mb-0.5" />
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
