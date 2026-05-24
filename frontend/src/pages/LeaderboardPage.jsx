import { useEffect, useState } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const TIER_COLORS = { BRONZE: '#CD7F32', SILVER: '#C0C0C0', GOLD: '#FFB800', DIAMOND: '#00E5FF' };
const TIER_LABELS = { BRONZE: 'Bronze', SILVER: 'Silver', GOLD: 'Gold', DIAMOND: 'Diamond' };

const PERIODS = [
  { key: 'all', label: 'All Time' },
  { key: 'monthly', label: 'Bulanan' },
  { key: 'weekly', label: 'Mingguan' },
];

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

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Trophy size={20} className="text-[#FFB800]" />
        <h1 className="font-display text-2xl font-black tracking-wide text-white">LEADERBOARD</h1>
      </div>

      {/* Period selector */}
      <div className="flex bg-[#111128] border border-[#2A2A4A] rounded-xl p-1 gap-1">
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              period === p.key ? 'bg-[#00008F] text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* My rank card */}
      {myRank && (
        <div className="bg-gradient-to-r from-[#00008F]/30 to-[#111128] border border-[#00008F]/50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ background: TIER_COLORS[myRank.tier], color: '#000' }}>
            {myRank.name?.[0]}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white text-sm">Posisimu saat ini</p>
            <p className="text-gray-400 text-xs">{myRank.department}</p>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold text-2xl text-white">#{myRank.rank}</p>
            <p className="font-mono text-xs" style={{ color: TIER_COLORS[myRank.tier] }}>{myRank.points?.toLocaleString('id-ID')} pts</p>
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      {leaders.length >= 3 && (
        <div className="flex items-end gap-3 justify-center py-2">
          {[leaders[1], leaders[0], leaders[2]].map((p, pos) => {
            const heights = ['h-20', 'h-28', 'h-16'];
            const podiumPos = [2, 1, 3];
            return (
              <div key={p.id} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base border-2"
                  style={{ background: TIER_COLORS[p.tier] + '33', borderColor: TIER_COLORS[p.tier], color: TIER_COLORS[p.tier] }}>
                  {p.name?.[0]}
                </div>
                <p className="text-xs font-semibold text-white text-center truncate w-full px-1">{p.name?.split(' ')[0]}</p>
                <p className="text-[10px] font-mono" style={{ color: TIER_COLORS[p.tier] }}>{p.points?.toLocaleString()} pts</p>
                <div className={`w-full ${heights[pos]} rounded-t-lg flex items-center justify-center font-display font-black text-2xl`}
                  style={{ background: TIER_COLORS[p.tier] + '33', color: TIER_COLORS[p.tier] }}>
                  #{podiumPos[pos]}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="bg-[#111128] border border-[#2A2A4A] rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">Memuat...</div>
        ) : leaders.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">Belum ada data leaderboard</div>
        ) : (
          leaders.slice(3).map((p, i) => (
            <div key={p.id}
              className={`flex items-center gap-3 px-4 py-3 border-b border-[#2A2A4A] last:border-0 ${p.id === currentUser?.id ? 'bg-[#00008F]/10' : ''}`}>
              <span className="font-mono font-bold text-sm text-gray-400 w-6 text-center">#{p.rank}</span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: TIER_COLORS[p.tier] + '44', color: TIER_COLORS[p.tier] }}>
                {p.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                <p className="text-xs text-gray-500">{p.department}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold" style={{ color: TIER_COLORS[p.tier] }}>
                  {p.points?.toLocaleString('id-ID')}
                </p>
                <p className="text-[10px] text-gray-500">{TIER_LABELS[p.tier]}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
