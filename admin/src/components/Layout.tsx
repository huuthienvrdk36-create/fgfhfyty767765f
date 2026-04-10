import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Building2, Calendar, CreditCard, 
  MessageSquare, Star, FileText, Settings, LogOut, MapPin, Inbox,
  Radio, Package, UserCircle, Globe, Cpu, History, Bell, BarChart3, Search
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import GlobalSearchModal from './GlobalSearchModal';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/live-monitor', icon: Radio, label: 'Live Monitor' },
  { to: '/geo-ops', icon: Globe, label: 'Geo Ops (City)' },
  { to: '/market-control', icon: Cpu, label: 'Market Control' },
  { to: '/providers', icon: Building2, label: 'Мастера (Control)' },
  { to: '/customers', icon: UserCircle, label: 'Клиенты' },
  { to: '/services', icon: Package, label: 'Услуги' },
  { to: '/map', icon: MapPin, label: 'Карта' },
  { to: '/provider-inbox', icon: Inbox, label: 'Provider Inbox' },
  { to: '/bookings', icon: Calendar, label: 'Бронирования' },
  { to: '/quotes', icon: FileText, label: 'Заявки' },
  { to: '/payments', icon: CreditCard, label: 'Платежи' },
  { to: '/disputes', icon: MessageSquare, label: 'Споры' },
  { to: '/reviews', icon: Star, label: 'Отзывы' },
  { to: '/notifications', icon: Bell, label: 'Уведомления' },
  { to: '/reports', icon: BarChart3, label: 'Отчёты' },
  { to: '/audit-log', icon: History, label: 'Audit Log' },
  { to: '/users', icon: Users, label: 'Пользователи' },
  { to: '/organizations', icon: Building2, label: 'Организации' },
  { to: '/settings', icon: Settings, label: 'Настройки' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">Auto Platform</h1>
          <p className="text-sm text-slate-400">Админ панель</p>
        </div>
        
        {/* Global Search Button */}
        <div className="p-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left text-sm">Поиск...</span>
            <kbd className="px-1.5 py-0.5 bg-slate-600 rounded text-xs">⌘K</kbd>
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-700'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName || user?.email}
              </p>
              <p className="text-xs text-slate-400">Администратор</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
