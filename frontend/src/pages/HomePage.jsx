import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Swords, Calendar, Gift, ChevronRight, Zap, Target } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import api from '../lib/api';

const TIER = {
  BRONZE:  { color:'#CD7F32', bg:'rgba(205,127,50,0.12)',  grad:'from-[#2D1A00] to-[#07070F]', label:'Bronze Ball',    next:300,   icon:'🥉' },
  SILVER:  { color:'#C0C0C0', bg:'rgba(192,192,192,0.10)', grad:'from-[#1A1A2A] to-[#07070F]', label:'Silver Smash',  next:600,   icon:'🥈' },
  GOLD:    { color:'#FFB800', bg:'rgba(255,184,0,0.12)',   grad:'from-[#2D2000] to-[#07070F]', label:'Gold Ace',       next:1200,  icon:'🥇' },
  DIAMOND: { color:'#00E5FF', bg:'rgba(0,229,255,0.10)',   grad:'from-[#001A2D] to-[#07070F]', label:'Diamond Padel', next: null, icon:'💎' },
};

function StatPill({ icon: Icon, value, label, color }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1 py-3 px-2">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-0.5"
        style={{ background: `${color}15` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <span className="font-mono font-black text-[18px] text-white leading-none">{value}</span>
      <span className="text-[10px] text-[#8888AA] font-medium">{label}</span>
    </div>
  );
}

function SkeletonCard() {
  return <div className="skeleton h-16 rounded-xl" />;
}

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [leaderTop, setLeaderTop] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/matches?upcoming=true').catch(() => ({ data: { matches: [] } })),
      api.get('/api/leaderboard?period=all').catch(() => ({ data: { leaderboard: [] } })),
      user?.id ? api.get(`/api/users/${user.id}`).catch(() => ({ data: {} })) : Promise.resolve({ data: {} }),
    ]).then(([m, l, u]) => {
      setMatches(m.data.matches?.slice(0, 3) || []);
      setLeaderTop(l.data.leaderboard?.slice(0, 3) || []);
      setStats(u.data.stats || null);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const tier = TIER[user?.tier] || TIER.BRONZE;
  const progress = tier.next ? Math.min(((user?.totalPoints || 0) / tier.next) * 100, 100) : 100;
  const myRank = leaderTop.find(l => l.id === user?.id);

  const quickLinks = [
    { icon: Trophy, label: 'Leaderboard', to: '/leaderboard', color: '#FFB800', accent: 'rgba(255,184,0,0.12)' },
    { icon: Calendar, label: 'Events',      to: '/events',      color: '#4488FF', accent: 'rgba(68,136,255,0.12)' },
    { icon: Swords,   label: 'Match',       to: '/match',       color: '#FF1721', accent: 'rgba(255,23,33,0.12)' },
    { icon: Gift,     label: 'Rewards',     to: '/rewards',     color: '#00E5FF', accent: 'rgba(0,229,255,0.12)' },
  ];

  return (
    <div className="space-y-5 animate-fadeUp">

      {/* ── Hero Card ── */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tier.grad}`}
        style={{ border: `1px solid ${tier.color}25` }}>
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 -translate-y-8 translate-x-8"
          style={{ background: `radial-gradient(circle, ${tier.color} 0%, transparent 70%)` }} />

        <div className="relative p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
              style={{ background: tier.bg, border: `2px solid ${tier.color}50`, color: tier.color,
                boxShadow: `0 0 20px ${tier.color}30` }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#8888AA] font-medium">Selamat datang,</p>
              <h2 className="font-display text-[22px] font-black tracking-wide text-white truncate leading-tight">
                {user?.name?.toUpperCase()}
              </h2>
              <p className="text-[11px] text-[#8888AA] mt-0.5">{user?.department}</p>
            </div>

            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className="text-[10px] font-black px-2.5 py-1 rounded-lg"
                style={{ color: tier.color, background: tier.bg, border: `1px solid ${tier.color}40` }}>
                {tier.icon} {tier.label}
              </span>
              {myRank && (
                <span className="text-[10px] font-bold text-[#8888AA]">Rank #{myRank.rank}</span>
              )}
            </div>
          </div>

          {/* Points + progress */}
          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${tier.color}20` }}>
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-mono font-black text-3xl" style={{ color: tier.color }}>
                {(user?.totalPoints || 0).toLocaleString('id-ID')}
                <span className="text-sm font-semibold ml-1 text-[#8888AA]">pts</span>
              </span>
              <span className="text-[11px] text-[#8888AA]">
                {tier.next
                  ? `${(tier.next - (user?.totalPoints || 0)).toLocaleString()} pts ke tier berikutnya`
                  : '🏆 Tier Tertinggi!'}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${tier.color}99, ${tier.color})` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      {stats && (
        <div className="rounded-2xl overflow-hidden animate-fadeUp stagger-1"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex divide-x" style={{ '--tw-divide-opacity': 1, borderColor: 'rgba(255,255,255,0.06)' }}>
            <StatPill icon={Swords}  value={stats.matchCount || 0}  label="Matches"    color="#FF1721" />
            <StatPill icon={Trophy}  value={stats.winCount || 0}    label="Wins"       color="#FFB800" />
            <StatPill icon={Zap}     value={user?.totalPoints || 0} label="Total Pts"  color={tier.color} />
            <StatPill icon={Target}  value={stats.mvpCount || 0}    label="MVP"        color="#00E5FF" />
          </div>
        </div>
      )}

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-4 gap-2.5 animate-fadeUp stagger-2">
        {quickLinks.map(({ icon: Icon, label, to, color, accent }) => (
          <button key={to} onClick={() => navigate(to)}
            className="pressable flex flex-col items-center gap-2 py-4 rounded-2xl transition"
            style={{ background: accent, border: `1px solid ${color}25` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}20` }}>
              <Icon size={20} style={{ color }} />
            </div>
            <span className="text-[10px] font-bold text-white/80">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Upcoming Matches ── */}
      <div className="animate-fadeUp stagger-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Swords size={15} className="text-[#FF1721]" /> Jadwal Match
          </h3>
          <button onClick={() => navigate('/match')}
            className="flex items-center gap-0.5 text-[11px] text-[#FFB800] font-semibold pressable">
            Lihat semua <ChevronRight size={13} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2"><SkeletonCard /><SkeletonCard /></div>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-2xl mb-2">🎾</p>
            <p className="text-[#8888AA] text-sm">Belum ada match terjadwal</p>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl pressable"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,23,33,0.1)' }}>
                  <Swords size={18} className="text-[#FF1721]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{m.eventName}</p>
                  <p className="text-[11px] text-[#8888AA] mt-0.5">{m.court} · {m.format}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] font-bold text-[#FFB800]">
                    {new Date(m.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-[10px] text-[#8888AA]">{m.timeStart}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Top 3 Leaderboard ── */}
      <div className="animate-fadeUp stagger-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Trophy size={15} className="text-[#FFB800]" /> Top Pemain
          </h3>
          <button onClick={() => navigate('/leaderboard')}
            className="flex items-center gap-0.5 text-[11px] text-[#FFB800] font-semibold pressable">
            Lihat semua <ChevronRight size={13} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {leaderTop.map((p, i) => {
              const t = TIER[p.tier] || TIER.BRONZE;
              const medals = ['🥇','🥈','🥉'];
              return (
                <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${i < leaderTop.length - 1 ? 'border-b' : ''}`}
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-lg w-7 text-center">{medals[i]}</span>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0"
                    style={{ background: t.bg, color: t.color }}>
                    {p.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-[#8888AA]">{p.department}</p>
                  </div>
                  <span className="font-mono font-bold text-sm" style={{ color: t.color }}>
                    {p.points?.toLocaleString('id-ID')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-2" />
    </div>
  );
}
