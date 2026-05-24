import { useEffect, useState } from 'react';
import { Swords, Plus, Clock, MapPin, CheckCircle, XCircle, X, Loader2, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const COURTS  = ['Court A – Epicentrum','Court B – Epicentrum','Court C – Epicentrum','AXA Tower Rooftop','Lainnya'];
const FORMATS = ['Singles','Doubles','Round Robin','Friendly'];

const STATUS_CONFIG = {
  UPCOMING:          { label:'Akan Datang',          color:'#4488FF', bg:'rgba(68,136,255,0.12)'    },
  PENDING_RESULT:    { label:'Input Skor',            color:'#FFB800', bg:'rgba(255,184,0,0.12)'     },
  PENDING_VALIDATE:  { label:'Menunggu Validasi',     color:'#F97316', bg:'rgba(249,115,22,0.12)'    },
  VALIDATED:         { label:'Tervalidasi',           color:'#22C55E', bg:'rgba(34,197,94,0.12)'     },
  REJECTED:          { label:'Ditolak',               color:'#FF1721', bg:'rgba(255,23,33,0.12)'     },
};

function Modal({ title, onClose, children }) {
  return (
    <div className="sheet-overlay flex items-end sm:items-center justify-center p-4">
      <div className="animate-slideUp w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl"
        style={{ background: '#0D0D1E', border: '1px solid rgba(255,255,255,0.10)' }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="font-bold text-white text-[16px]">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center pressable"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function MatchPage() {
  const user = useAuthStore(s => s.user);
  const [matches, setMatches]     = useState([]);
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showResult, setShowResult] = useState(null);
  const [form, setForm]           = useState({ eventName:'', court:COURTS[0], format:'Doubles', date:'', timeStart:'', notes:'', players:[] });
  const [creating, setCreating]   = useState(false);
  const [scores, setScores]       = useState({});
  const [mvp, setMvp]             = useState('');
  const [filter, setFilter]       = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    const q = filter === 'mine' ? '?mine=true' : filter === 'upcoming' ? '?upcoming=true' : '';
    api.get(`/api/matches${q}`).then(r => setMatches(r.data.matches || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);
  useEffect(() => { api.get('/api/users').then(r => setMembers(r.data.users || [])).catch(() => {}); }, []);

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
    setSubmitting(true);
    try {
      const scoreArr = showResult.players.map(p => ({ userId: p.userId, score: parseInt(scores[p.userId] || 0), sets: [] }));
      await api.put(`/api/matches/${showResult.id}/result`, { scores: scoreArr, mvpUserId: mvp });
      toast.success('Hasil match dikirim!');
      setShowResult(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal kirim hasil');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (matchId) => {
    try {
      await api.put(`/api/matches/${matchId}/validate`);
      toast.success('Match divalidasi, poin dikreditkan!');
      fetchData();
    } catch (err) { toast.error('Gagal validasi'); }
  };

  const handleReject = async (matchId) => {
    try {
      await api.put(`/api/matches/${matchId}/reject`);
      toast.success('Match ditolak');
      fetchData();
    } catch (err) { toast.error('Gagal tolak'); }
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

  const FILTERS = [['all','Semua'],['mine','Match Saya'],['upcoming','Akan Datang']];

  return (
    <div className="space-y-5 animate-fadeUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,23,33,0.15)' }}>
            <Swords size={18} className="text-[#FF1721]" />
          </div>
          <div>
            <h1 className="font-display text-[22px] font-black tracking-wide text-white leading-none">MATCH</h1>
            <p className="text-[11px] text-[#8888AA]">{matches.length} match ditemukan</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="pressable flex items-center gap-1.5 text-white text-[13px] font-bold px-4 py-2.5 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #FF1721, #CC0010)' }}>
          <Plus size={15} /> Buat Match
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className="pressable flex-shrink-0 px-4 py-2 rounded-xl text-[12px] font-bold transition"
            style={filter === k
              ? { background: 'linear-gradient(135deg, #FF1721, #CC0010)', color: '#fff' }
              : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8888AA' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Create Match Modal */}
      {showCreate && (
        <Modal title="Buat Match Baru" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Nama Match</label>
              <input type="text" value={form.eventName} onChange={e => setForm({...form, eventName: e.target.value})} required placeholder="e.g. Friday Doubles" className="input-base" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Format</label>
                <select value={form.format} onChange={e => setForm({...form, format: e.target.value})} className="input-base appearance-none">
                  {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Court</label>
                <select value={form.court} onChange={e => setForm({...form, court: e.target.value})} className="input-base appearance-none">
                  {COURTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Tanggal</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required className="input-base" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Waktu</label>
                <input type="time" value={form.timeStart} onChange={e => setForm({...form, timeStart: e.target.value})} required className="input-base" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">
                Pilih Pemain <span className="text-[#FF1721]">({form.players.length} dipilih)</span>
              </label>
              <div className="max-h-44 overflow-y-auto space-y-1.5 rounded-xl p-2"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {members.map(m => {
                  const sel = form.players.find(p => p.userId === m.id);
                  return (
                    <button key={m.id} type="button" onClick={() => togglePlayer(m)}
                      className="pressable w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition"
                      style={sel
                        ? { background: 'rgba(255,23,33,0.15)', border: '1px solid rgba(255,23,33,0.3)', color: '#fff' }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#aaa' }}>
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
                        style={{ background: sel ? 'rgba(255,23,33,0.2)' : 'rgba(255,255,255,0.08)', color: sel ? '#FF1721' : '#888' }}>
                        {m.name?.[0]}
                      </span>
                      <span className="flex-1 font-medium">{m.name}</span>
                      {sel && <span className="text-[10px] font-black px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,23,33,0.2)', color: '#FF1721' }}>T{sel.team + 1}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" disabled={creating}
              className="pressable w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #FF1721, #CC0010)' }}>
              {creating ? <Loader2 size={16} className="animate-spin-slow" /> : 'BUAT MATCH'}
            </button>
          </form>
        </Modal>
      )}

      {/* Submit Result Modal */}
      {showResult && (
        <Modal title="Input Hasil Match" onClose={() => setShowResult(null)}>
          <div className="space-y-3 mb-5">
            {showResult.players?.map(p => (
              <div key={p.userId} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black"
                  style={{ background: `rgba(255,23,33,0.1)`, color: '#FF1721' }}>
                  {p.user?.name?.[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{p.user?.name}</p>
                  <p className="text-[10px] text-[#8888AA]">Team {p.team + 1}</p>
                </div>
                <input type="number" min={0}
                  value={scores[p.userId] || ''}
                  onChange={e => setScores({...scores, [p.userId]: e.target.value})}
                  placeholder="0"
                  className="w-16 text-center font-mono font-bold text-white rounded-lg py-2 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
              </div>
            ))}
          </div>

          <div className="mb-5">
            <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-2">
              <Star size={11} className="inline mr-1" />MVP (opsional)
            </label>
            <select value={mvp} onChange={e => setMvp(e.target.value)} className="input-base appearance-none">
              <option value="">Tidak ada MVP</option>
              {showResult.players?.map(p => <option key={p.userId} value={p.userId}>{p.user?.name}</option>)}
            </select>
          </div>

          <button onClick={handleSubmitResult} disabled={submitting}
            className="pressable w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #FF1721, #CC0010)' }}>
            {submitting ? <Loader2 size={16} className="animate-spin-slow" /> : 'KIRIM HASIL MATCH'}
          </button>
        </Modal>
      )}

      {/* Match list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl mb-3">🏓</p>
          <p className="text-white font-semibold mb-1">Belum ada match</p>
          <p className="text-[#8888AA] text-[13px]">Buat match baru dan undang pemain lain</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(m => {
            const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.UPCOMING;
            const isMyMatch = m.players?.some(p => p.userId === user?.id);
            const team0 = m.players?.filter(p => p.team === 0) || [];
            const team1 = m.players?.filter(p => p.team === 1) || [];

            return (
              <div key={m.id} className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${isMyMatch ? 'rgba(255,23,33,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="h-0.5" style={{ background: sc.color }} />
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white text-[14px]">{m.eventName}</h3>
                      <p className="text-[11px] text-[#8888AA] mt-0.5">{m.format}</p>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg"
                      style={{ color: sc.color, background: sc.bg }}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex gap-4 text-[11px] text-[#8888AA] mb-3">
                    <span className="flex items-center gap-1.5"><Clock size={11} />
                      {new Date(m.date).toLocaleDateString('id-ID', { day:'numeric', month:'short' })} · {m.timeStart}
                    </span>
                    <span className="flex items-center gap-1.5"><MapPin size={11} />{m.court?.split('–')[0]?.trim()}</span>
                  </div>

                  {/* Teams VS layout */}
                  {m.players?.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 flex flex-wrap gap-1">
                        {team0.map(p => (
                          <span key={p.userId} className="text-[10px] font-bold px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(68,136,255,0.12)', color: '#4488FF' }}>
                            {p.user?.name?.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                      {team1.length > 0 && (
                        <>
                          <span className="text-[11px] font-black text-[#8888AA] flex-shrink-0">VS</span>
                          <div className="flex-1 flex flex-wrap gap-1 justify-end">
                            {team1.map(p => (
                              <span key={p.userId} className="text-[10px] font-bold px-2 py-1 rounded-lg"
                                style={{ background: 'rgba(255,23,33,0.12)', color: '#FF6666' }}>
                                {p.user?.name?.split(' ')[0]}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {(m.status === 'UPCOMING' || m.status === 'PENDING_RESULT') && isMyMatch && (
                    <button onClick={() => { setShowResult(m); setScores({}); setMvp(''); }}
                      className="pressable w-full text-[13px] font-bold py-2.5 rounded-xl transition"
                      style={{ background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.25)', color: '#FFB800' }}>
                      INPUT SKOR
                    </button>
                  )}

                  {m.status === 'PENDING_VALIDATE' && user?.role === 'ADMIN' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleValidate(m.id)}
                        className="pressable flex-1 flex items-center justify-center gap-1.5 text-[13px] font-bold py-2.5 rounded-xl transition"
                        style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}>
                        <CheckCircle size={14} /> Validasi
                      </button>
                      <button onClick={() => handleReject(m.id)}
                        className="pressable flex-1 flex items-center justify-center gap-1.5 text-[13px] font-bold py-2.5 rounded-xl transition"
                        style={{ background: 'rgba(255,23,33,0.10)', border: '1px solid rgba(255,23,33,0.2)', color: '#FF6666' }}>
                        <XCircle size={14} /> Tolak
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="h-2" />
    </div>
  );
}
