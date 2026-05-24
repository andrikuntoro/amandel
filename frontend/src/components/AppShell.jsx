import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Bell, Home, Trophy, Calendar, Swords, Gift, Shield, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import api from '../lib/api';

const TIER_CONFIG = {
  BRONZE:  { color: '#CD7F32', bg: 'rgba(205,127,50,0.15)',  label: 'Bronze'  },
  SILVER:  { color: '#C0C0C0', bg: 'rgba(192,192,192,0.12)', label: 'Silver'  },
  GOLD:    { color: '#FFB800', bg: 'rgba(255,184,0,0.15)',   label: 'Gold'    },
  DIAMOND: { color: '#00E5FF', bg: 'rgba(0,229,255,0.15)',   label: 'Diamond' },
};

export default function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    api.get('/api/notifications')
      .then(r => setNotifCount(r.data.notifications.filter(n => !n.isRead).length))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/',           icon: Home,     label: 'Home',     exact: true },
    { to: '/leaderboard',icon: Trophy,   label: 'Rank'                  },
    { to: '/events',     icon: Calendar, label: 'Events'                },
    { to: '/match',      icon: Swords,   label: 'Match'                 },
    { to: '/rewards',    icon: Gift,     label: 'Rewards'               },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  const tier = TIER_CONFIG[user?.tier] || TIER_CONFIG.BRONZE;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#07070F]">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #1414FF 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 -right-24 w-64 h-64 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #FFB800 0%, transparent 70%)' }} />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40" style={{ background: 'rgba(7,7,15,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* AXA brand accent line */}
        <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #00008F 0%, #FF1721 50%, #FFB800 100%)' }} />

        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 pressable">
            <div className="flex flex-col leading-none">
              <span className="font-display text-[22px] font-black tracking-[0.15em] text-white">AMANDEL</span>
              <span className="text-[#FF1721] text-[8px] tracking-[0.3em] font-bold -mt-0.5">PADEL CLUB</span>
            </div>
          </button>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Notification */}
            <button onClick={() => navigate('/profile')}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition pressable"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Bell size={17} className="text-gray-400" />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] bg-[#FF1721] rounded-full animate-glow" />
              )}
            </button>

            {/* Avatar + menu */}
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl pressable transition"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black"
                  style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.color}44` }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <span className="hidden sm:block text-xs font-semibold text-gray-200 max-w-[80px] truncate">
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown size={12} className={`text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl overflow-hidden z-50 animate-scaleIn"
                    style={{ background: '#141428', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: tier.color }}>{tier.label} · {user?.totalPoints?.toLocaleString()} pts</p>
                    </div>
                    <button onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-300 hover:bg-white/[0.04] transition">
                      <User size={14} className="text-gray-500" /> Profil Saya
                    </button>
                    <button onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-400 hover:bg-white/[0.04] transition border-t border-white/[0.06]">
                      <LogOut size={14} /> Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 safe-bottom pt-5">
        <Outlet />
      </main>

      {/* ── Bottom navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40"
        style={{ background: 'rgba(7,7,15,0.92)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-lg mx-auto flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) => `
                flex-1 flex flex-col items-center gap-0.5 py-3 text-[9px] font-bold tracking-wide transition-all pressable
                ${isActive ? '' : 'text-gray-600 hover:text-gray-400'}
              `}
              style={({ isActive }) => isActive ? { color: tier.color } : {}}>
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isActive ? 'scale-105' : ''}`}
                      style={isActive ? { background: tier.bg } : {}}>
                      <Icon size={18} />
                    </div>
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: tier.color }} />
                    )}
                  </div>
                  <span className="uppercase">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
