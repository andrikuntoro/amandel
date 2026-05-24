import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Swords, Calendar, Gift, TrendingUp, Star } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import api from '../lib/api';

const TIER_COLORS = { BRONZE: '#CD7F32', SILVER: '#C0C0C0', GOLD: '#FFB800', DIAMOND: '#00E5FF' };
const TIER_LABELS = { BRONZE: 'Bronze Ball', SILVER: 'Silver Smash', GOLD: 'Gold Ace', DIAMOND: 'Diamond Padel' };
const TIER_NEXT = { BRONZE: 100, SILVER: 300, GOLD: 600, DIAMOND: null };

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [leaderTop, setLeaderTop] = useState([]);

  useEffect(() => {
    api.get('/api/matches?upcoming=true').then(r => setMatches(r.data.matches?.slice(0, 3) || [])).catch(() => {});
    api.get('/api/leaderboard?period=all').then(r => setLeaderTop(r.data.leaderboard?.slice(0, 3) || [])).catch(() => {});
  }, []);

  const tierColor = TIER_COLORS[user?.tier] || '#888';
  const nextTierPts = TIER_NEXT[user?.tier];
  const progress = nextTierPts ? Math.min((user?.totalPoints / nextTierPts) * 100, 100) : 100;

  const quickLinks = [
    { icon: Trophy, label: 'Leaderboard', to: '/leaderboard', color: '#FFB800' },
    { icon: Calendar, label: 'Events', to: '/events', color: '#00008F' },
    { icon: Swords, label: 'Match', to: '/match', color: '#FF1721' },
    { icon: Gift, label: 'Rewards', to: '/rewards', color: '#00E5FF' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero / Profile Card */}
      <div className="bg-gradient-to-br from-[#111128] to-[#080814] border border-[#2A2A4A] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-gray-400 text-xs mb-1">Selamat datang,</p>
            <h2 className="text-2xl font-display font-black tracking-wide text-white">{user?.name?.toUpperCase()}</h2>
            <p className="text-gray-400 text-xs mt-1">{user?.department}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold px-3 py-1 rounded-full border"
              style={{ color: tierColor, borderColor: tierColor, background: `${tierColor}22` }}>
              {TIER_LABELS[user?.tier]}
            </span>
          </div>
        </div>

        {/* Points */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-mono font-bold text-3xl" style={{ color: tierColor }}>
              {user?.totalPoints?.toLocaleString('id-ID')}
            </span>
            <span className="text-gray-500 text-xs">
              {nextTierPts ? `/ ${nextTierPts.toLocaleString()} pts ke tier berikutnya` : '🏆 Tier tertinggi!'}
            </span>
          </div>
          <div className="h-2 bg-[#2A2A4A] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: tierColor }} />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-4 gap-3">
        {quickLinks.map(({ icon: Icon, label, to, color }) => (
          <button key={to} onClick={() => navigate(to)}
            className="bg-[#111128] border border-[#2A2A4A] rounded-xl p-3 flex flex-col items-center gap-2 hover:border-[#2A2A6A] transition">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}22` }}>
              <Icon size={20} style={{ color }} />
            </div>
            <span className="text-[10px] font-semibold text-gray-400">{label}</span>
          </button>
        ))}
      </div>

      {/* Upcoming Matches */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white flex items-center gap-2"><Swords size={16} className="text-[#FF1721]" /> Jadwal Match</h3>
          <button onClick={() => navigate('/match')} className="text-xs text-[#FFB800] hover:underline">Lihat semua</button>
        </div>
        {matches.length === 0 ? (
          <div className="bg-[#111128] border border-[#2A2A4A] rounded-xl p-6 text-center text-gray-500 text-sm">
            Belum ada match terjadwal
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map(m => (
              <div key={m.id} className="bg-[#111128] border border-[#2A2A4A] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white text-sm">{m.eventName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.court} · {m.format}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#FFB800] font-mono">
                    {new Date(m.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs text-gray-500">{m.timeStart}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top 3 Leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white flex items-center gap-2"><Trophy size={16} className="text-[#FFB800]" /> Top Pemain</h3>
          <button onClick={() => navigate('/leaderboard')} className="text-xs text-[#FFB800] hover:underline">Lihat semua</button>
        </div>
        <div className="bg-[#111128] border border-[#2A2A4A] rounded-xl overflow-hidden">
          {leaderTop.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${i < leaderTop.length - 1 ? 'border-b border-[#2A2A4A]' : ''}`}>
              <span className="font-mono font-bold text-sm w-6 text-center"
                style={{ color: i === 0 ? '#FFB800' : i === 1 ? '#C0C0C0' : '#CD7F32' }}>
                #{p.rank}
              </span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: TIER_COLORS[p.tier] || '#555', color: '#000' }}>
                {p.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                <p className="text-xs text-gray-500">{p.department}</p>
              </div>
              <span className="font-mono font-bold text-sm" style={{ color: TIER_COLORS[p.tier] }}>
                {p.points?.toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
