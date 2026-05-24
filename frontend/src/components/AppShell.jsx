import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Bell, Home, Trophy, Calendar, Swords, Gift, Shield, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import api from '../lib/api';

export default function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    api.get('/api/notifications').then(r => {
      setNotifCount(r.data.notifications.filter(n => !n.isRead).length);
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home', exact: true },
    { to: '/leaderboard', icon: Trophy, label: 'Rank' },
    { to: '/events', icon: Calendar, label: 'Events' },
    { to: '/match', icon: Swords, label: 'Match' },
    { to: '/rewards', icon: Gift, label: 'Rewards' },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  const tierColors = { BRONZE: '#CD7F32', SILVER: '#C0C0C0', GOLD: '#FFB800', DIAMOND: '#00E5FF' };

  return (
    <div className="flex flex-col min-h-screen bg-[#080814]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#080814]/95 backdrop-blur border-b border-[#2A2A4A]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <span className="font-display text-2xl font-black tracking-widest text-white">AMANDEL</span>
            <span className="hidden sm:inline text-[#FF1721] text-[9px] tracking-[0.25em] font-bold ml-2">PADEL CLUB</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button
              className="relative p-2 rounded-lg hover:bg-[#111128] transition"
              onClick={() => navigate('/profile')}
            >
              <Bell size={20} className="text-gray-400" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF1721] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>

            {/* Avatar / user menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-[#111128] border border-[#2A2A4A] rounded-lg px-3 py-1.5 hover:border-[#00008F] transition"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: tierColors[user?.tier] || '#555', color: '#000' }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-white hidden sm:block">{user?.name?.split(' ')[0]}</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-[#111128] border border-[#2A2A4A] rounded-xl shadow-2xl overflow-hidden z-50">
                  <button onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-300 hover:bg-[#1a1a3a] transition">
                    <User size={14} /> Profil
                  </button>
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-[#1a1a3a] transition">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-24 pt-4">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#080814]/95 backdrop-blur border-t border-[#2A2A4A]">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-3 text-[10px] font-semibold transition ${
                  isActive ? 'text-[#FFB800]' : 'text-gray-500 hover:text-gray-300'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
