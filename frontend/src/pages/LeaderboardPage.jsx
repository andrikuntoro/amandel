import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const TIER = {
  BRONZE:  { color:'#CD7F32', bg:'rgba(205,127,50,0.15)',  label:'Bronze'  },
  SILVER:  { color:'#C0C0C0', bg:'rgba(192,192,192,0.12)', label:'Silver'  },
  GOLD:    { color:'#FFB800', bg:'rgba(255,184,0,0.15)',   label:'Gold'    },
  DIAMOND: { color:'#00E5FF', bg:'rgba(0,229,255,0.12)',   label:'Diamond' },
};

const PERIODS = [
  { key:'all',     label:'All Time' },
  { key:'monthly', label:'Bulanan'  },
  { key:'weekly',  label:'Mingguan' },
];

function PodiumBlock({ player, pos }) {
  if (!player) return <div className="flex-1" />;
  const t = TIER[player.tier] || TIER.BRONZE;
  const heights = { 1: 'h-24', 2: 'h-16', 3: 'h-12' };
  const medals  = { 1: '🥇',  2: '🥈',  3: '🥉' };
  const sizes   = { 1: 'w-14 h-14 text-base', 2: 'w-11 h-11 text-sm', 3: 'w-10 h-10 text-xs' };

  return (
    <div className="flex-1 flex flex-col items-center gap-1.5">
      <div className={`${sizes[pos]} rounded-2xl flex items-center justify-center font-black flex-shrink-0`}
        style={{ background: t.bg, border: `2px solid ${t.color}60`, color: t.color,
          boxShadow: pos === 1 ? `0 0 20px ${t.color}40` : 'none' }}>
        {player.name?.[0]}
      </div>
      <p className="text-[11px] font-bold text-white text-center leading-tight px-1 truncate max-w-full">
        {player.name?.split(' ')[0]}
      </p>
      <p className="text-[10px] font-mono" style={{ color: t.color }}>
        {player.points?.toLocaleString()}
      </p>
      <div className={`w-full ${heights[pos]} rounded-t-xl flex items-end justify-center pb-2`}
        style={{ background: `linear-gradient(to top, ${t.color}25, ${t.color}08)`, border: `1px solid ${t.color}30`, borderBottom: 'none' }}>
        <span className="text-xl">{medals[pos]}</span>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05]">
      <div className="skeleton w-6 h-4 rounded" />
      <div className="skeleton w-8 h-8 rounded-xl" />
      <div className="flex-1 space-y-1.5">
        <div className="skeleton w-28 h-3.5 rounded" />
        <div className="skeleton w-20 h-2.5 rounded" />
      </div>
      <div className="skeleton w-16 h-4 rounded" />
    </div>
  );
}

export default function LeaderboardPage() {
  const currentUser = useAuthStore(s => s.user);
  const [period, setPeriod] = useState('all');
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/leaderboard?period=${period}`)
      .then(r => setLeaders(r.data.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const myRank = leaders.find(l => l.id === currentUser?.id);
  const myTier = TIER[currentUser?.tier] || TIER.BRONZE;

  return (
    <div className="space-y-5 animate-fadeUp">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.15)' }}>
          <Trophy size={18} className="text-[#FFB800]" />
        </div>
        <div>
          <h1 className="font-display text-[22px] font-black tracking-wide text-white leading-none">LEADERBOARD</h1>
          <p className="text-[11px] text-[#8888AA]">{leaders.length} pemain terdaftar</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-1.5 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition pressable"
            style={period === p.key
              ? { background: 'linear-gradient(135deg, #1414FF, #0000CC)', color: '#fff' }
              : { color: '#8888AA' }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* My rank card */}
      {myRank && (
        <div className="rounded-2xl p-4 flex items-center gap-3 animate-fadeUp stagger-1"
          style={{ background: `linear-gradient(135deg, ${myTier.color}15, rgba(255,255,255,0.03))`,
            border: `1px solid ${myTier.color}30` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background: myTier.bg, color: myTier.color }}>
            {myRank.name?.[0]}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-white">Posisi kamu</p>
            <p className="text-[11px] text-[#8888AA]">{myRank.department}</p>
          </div>
          <div className="text-right">
            <p className="font-display font-black text-3xl text-white">#{myRank.rank}</p>
            <p className="text-[11px] font-mono font-bold" style={{ color: myTier.color }}>
              {myRank.points?.toLocaleString('id-ID')} pts
            </p>
          </div>
        </div>
      )}

      {/* Podium top 3 */}
      {!loading && leaders.length >= 3 && (
        <div className="flex items-end gap-2 px-2 pt-2 animate-fadeUp stagger-2">
          <PodiumBlock player={leaders[1]} pos={2} />
          <PodiumBlock player={leaders[0]} pos={1} />
          <PodiumBlock player={leaders[2]} pos={3} />
        </div>
      )}

      {/* Full list (4 onwards) */}
      <div className="rounded-2xl overflow-hidden animate-fadeUp stagger-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
        ) : leaders.length === 0 ? (
          <div className="py-14 text-center text-[#8888AA] text-sm">
            <p className="text-3xl mb-3">🏆</p>Belum ada data leaderboard
          </div>
        ) : (
          leaders.slice(3).map((p, i) => {
            const t = TIER[p.tier] || TIER.BRONZE;
            const isMe = p.id === currentUser?.id;
            return (
              <div key={p.id}
                className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0 transition"
                style={{ borderColor: 'rgba(255,255,255,0.05)', background: isMe ? `${t.color}0A` : 'transparent' }}>
                <span className="font-mono font-bold text-sm text-[#8888AA] w-7 text-center">
                  {p.rank}
                </span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0"
                  style={{ background: t.bg, color: t.color }}>
                  {p.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate flex items-center gap-1.5">
                    {p.name}
                    {isMe && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: t.bg, color: t.color }}>YOU</span>}
                  </p>
                  <p className="text-[11px] text-[#8888AA]">{p.department} · {t.label}</p>
                </div>
                <span className="font-mono font-bold text-[13px]" style={{ color: t.color }}>
                  {p.points?.toLocaleString('id-ID')}
                </span>
              </div>
            );
          })
        )}
      </div>
      <div className="h-2" />
    </div>
  );
}
