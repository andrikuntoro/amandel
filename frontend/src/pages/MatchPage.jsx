import { useEffect, useState } from 'react';
import { Swords, Plus, Clock, MapPin, CheckCircle, XCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const COURTS = ['Court A – Epicentrum', 'Court B – Epicentrum', 'Court C – Epicentrum', 'AXA Tower Rooftop', 'Lainnya'];
const FORMATS = ['Singles', 'Doubles', 'Round Robin', 'Friendly'];
const STATUS_COLORS = {
  UPCOMING: 'text-blue-400 bg-blue-400/10',
  PENDING_RESULT: 'text-yellow-400 bg-yellow-400/10',
  PENDING_VALIDATE: 'text-orange-400 bg-orange-400/10',
  VALIDATED: 'text-green-400 bg-green-400/10',
  REJECTED: 'text-red-400 bg-red-400/10',
};
const STATUS_LABELS = {
  UPCOMING: 'Akan Datang', PENDING_RESULT: 'Input Skor', PENDING_VALIDATE: 'Menunggu Validasi',
  VALIDATED: 'Tervalidasi', REJECTED: 'Ditolak',
};

export default function MatchPage() {
  const user = useAuthStore(s => s.user);
  const [matches, setMatches] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showResult, setShowResult] = useState(null);
  const [form, setForm] = useState({ eventName: '', court: COURTS[0], format: 'Doubles', date: '', timeStart: '', notes: '', players: [] });
  const [creating, setCreating] = useState(false);
  const [scores, setScores] = useState({});
  const [mvp, setMvp] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchData = () => {
    setLoading(true);
    const q = filter === 'mine' ? '?mine=true' : filter === 'upcoming' ? '?upcoming=true' : '';
    api.get(`/api/matches${q}`).then(r => setMatches(r.data.matches || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);
  useEffect(() => {
    api.get('/api/users').then(r => setMembers(r.data.users || [])).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/matches', form);
      toast.success('Match berhasil dibuat!');
      setShowCreate(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal membuat match');
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitResult = async () => {
    try {
      const scoreArr = showResult.players.map(p => ({
        userId: p.userId,
        score: parseInt(scores[p.userId] || 0),
        sets: [],
      }));
      await api.put(`/api/matches/${showResult.id}/result`, { scores: scoreArr, mvpUserId: mvp });
      toast.success('Hasil match dikirim!');
      setShowResult(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal kirim hasil');
    }
  };

  const handleValidate = async (matchId) => {
    try {
      await api.put(`/api/matches/${matchId}/validate`);
      toast.success('Match divalidasi, poin dikreditkan!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal validasi');
    }
  };

  const handleReject = async (matchId) => {
    try {
      await api.put(`/api/matches/${matchId}/reject`);
      toast.success('Match ditolak');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal tolak');
    }
  };

  const togglePlayer = (m) => {
    const exists = form.players.find(p => p.userId === m.id);
    if (exists) {
      setForm({ ...form, players: form.players.filter(p => p.userId !== m.id) });
    } else {
      const team = form.players.length % 2 === 0 ? 0 : 1;
      setForm({ ...form, players: [...form.players, { userId: m.id, team }] });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords size={20} className="text-[#FF1721]" />
          <h1 className="font-display text-2xl font-black tracking-wide text-white">MATCH</h1>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 bg-[#FF1721] hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition">
          <Plus size={16} /> Buat Match
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[['all','Semua'], ['mine','Match Saya'], ['upcoming','Akan Datang']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === k ? 'bg-[#FF1721] text-white' : 'bg-[#111128] border border-[#2A2A4A] text-gray-400 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#111128] border border-[#2A2A4A] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white text-lg">Buat Match Baru</h2>
                <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <input type="text" value={form.eventName} onChange={e => setForm({...form, eventName: e.target.value})} placeholder="Nama Match / Event" required
                  className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF1721]" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.format} onChange={e => setForm({...form, format: e.target.value})}
                    className="bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF1721]">
                    {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select value={form.court} onChange={e => setForm({...form, court: e.target.value})}
                    className="bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF1721]">
                    {COURTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required
                    className="bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF1721]" />
                  <input type="time" value={form.timeStart} onChange={e => setForm({...form, timeStart: e.target.value})} required
                    className="bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF1721]" />
                </div>

                {/* Player selector */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Pilih Pemain ({form.players.length} dipilih)</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {members.map(m => {
                      const sel = form.players.find(p => p.userId === m.id);
                      return (
                        <button key={m.id} type="button" onClick={() => togglePlayer(m)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition text-left ${sel ? 'bg-[#FF1721]/20 border border-[#FF1721]/40 text-white' : 'bg-[#080814] border border-[#2A2A4A] text-gray-300 hover:border-gray-500'}`}>
                          <span className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold">{m.name?.[0]}</span>
                          <span className="flex-1">{m.name}</span>
                          {sel && <span className="text-[10px] text-[#FF1721] font-bold">Team {sel.team + 1}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" disabled={creating}
                  className="w-full bg-[#FF1721] hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
                  {creating ? 'Membuat...' : 'BUAT MATCH'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Submit Result Modal */}
      {showResult && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111128] border border-[#2A2A4A] rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">Input Skor</h2>
              <button onClick={() => setShowResult(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3 mb-4">
              {showResult.players?.map(p => (
                <div key={p.userId} className="flex items-center gap-3">
                  <span className="text-sm text-white flex-1">{p.user?.name}</span>
                  <span className="text-xs text-gray-500 w-14">Team {p.team + 1}</span>
                  <input type="number" min={0} value={scores[p.userId] || ''} onChange={e => setScores({...scores, [p.userId]: e.target.value})}
                    placeholder="Skor" className="w-16 bg-[#080814] border border-[#2A2A4A] rounded px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-[#FF1721]" />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-2">MVP</label>
              <select value={mvp} onChange={e => setMvp(e.target.value)}
                className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF1721]">
                <option value="">Tidak ada MVP</option>
                {showResult.players?.map(p => <option key={p.userId} value={p.userId}>{p.user?.name}</option>)}
              </select>
            </div>
            <button onClick={handleSubmitResult}
              className="w-full bg-[#FF1721] hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition">
              KIRIM HASIL
            </button>
          </div>
        </div>
      )}

      {/* Match List */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Memuat match...</div>
      ) : matches.length === 0 ? (
        <div className="bg-[#111128] border border-[#2A2A4A] rounded-xl p-12 text-center text-gray-500">
          Belum ada match
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(m => (
            <div key={m.id} className="bg-[#111128] border border-[#2A2A4A] rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-white">{m.eventName}</h3>
                  <p className="text-xs text-gray-400">{m.format}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[m.status]}`}>
                  {STATUS_LABELS[m.status]}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-gray-400 mb-3">
                <span className="flex items-center gap-1"><Clock size={11} />
                  {new Date(m.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · {m.timeStart}
                </span>
                <span className="flex items-center gap-1"><MapPin size={11} />{m.court}</span>
              </div>

              {m.players?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {m.players.map(p => (
                    <span key={p.userId} className="text-[10px] px-2 py-0.5 rounded-full border border-[#2A2A4A] text-gray-300">
                      {p.user?.name?.split(' ')[0]} T{p.team + 1}
                    </span>
                  ))}
                </div>
              )}

              {m.status === 'UPCOMING' && m.players?.some(p => p.userId === user?.id) && (
                <button onClick={() => { setShowResult(m); setScores({}); setMvp(''); }}
                  className="w-full bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFB800] text-xs font-bold py-2 rounded-lg hover:bg-[#FFB800]/20 transition">
                  INPUT SKOR
                </button>
              )}

              {m.status === 'PENDING_VALIDATE' && user?.role === 'ADMIN' && (
                <div className="flex gap-2">
                  <button onClick={() => handleValidate(m.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold py-2 rounded-lg hover:bg-green-500/20 transition">
                    <CheckCircle size={14} /> Validasi
                  </button>
                  <button onClick={() => handleReject(m.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold py-2 rounded-lg hover:bg-red-500/20 transition">
                    <XCircle size={14} /> Tolak
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
