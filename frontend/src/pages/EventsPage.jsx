import { useEffect, useState } from 'react';
import { Calendar, Plus, MapPin, Clock, Users, Check, X, Loader2, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const COURTS = ['Court A – Epicentrum','Court B – Epicentrum','Court C – Epicentrum','AXA Tower Rooftop','Lainnya'];
const EVENT_TYPES = ['Friendly','Tournament','Workshop','Social','Lainnya'];

const TYPE_CONFIG = {
  Friendly:   { color:'#4488FF', bg:'rgba(68,136,255,0.12)',  emoji:'🤝' },
  Tournament: { color:'#FFB800', bg:'rgba(255,184,0,0.12)',   emoji:'🏆' },
  Workshop:   { color:'#00E5FF', bg:'rgba(0,229,255,0.12)',   emoji:'📚' },
  Social:     { color:'#A855F7', bg:'rgba(168,85,247,0.12)',  emoji:'🎉' },
  Lainnya:    { color:'#8888AA', bg:'rgba(136,136,170,0.12)', emoji:'📌' },
};

const STATUS_CONFIG = {
  ACTIVE:    { label:'Aktif',      color:'#22C55E', bg:'rgba(34,197,94,0.12)'   },
  DRAFT:     { label:'Draft',      color:'#FFB800', bg:'rgba(255,184,0,0.12)'   },
  COMPLETED: { label:'Selesai',    color:'#8888AA', bg:'rgba(136,136,170,0.12)' },
  CANCELLED: { label:'Dibatalkan', color:'#FF1721', bg:'rgba(255,23,33,0.12)'   },
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

export default function EventsPage() {
  const user = useAuthStore(s => s.user);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title:'', type:'Friendly', description:'', date:'', timeStart:'', timeEnd:'', court:COURTS[0], maxPlayers:8 });
  const [creating, setCreating] = useState(false);
  const [rsvping, setRsvping] = useState(null);

  const fetchEvents = () => {
    setLoading(true);
    api.get('/api/events').then(r => setEvents(r.data.events || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/events', form);
      toast.success('Event berhasil dibuat!');
      setShowCreate(false);
      setForm({ title:'', type:'Friendly', description:'', date:'', timeStart:'', timeEnd:'', court:COURTS[0], maxPlayers:8 });
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal membuat event');
    } finally {
      setCreating(false);
    }
  };

  const handleRSVP = async (eventId, status) => {
    setRsvping(eventId + status);
    try {
      await api.post(`/api/events/${eventId}/rsvp`, { status });
      toast.success(status === 'ACCEPTED' ? '✓ Konfirmasi hadir!' : 'Kamu menolak undangan');
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal RSVP');
    } finally {
      setRsvping(null);
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5 animate-fadeUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(20,20,255,0.15)' }}>
            <Calendar size={18} className="text-blue-400" />
          </div>
          <div>
            <h1 className="font-display text-[22px] font-black tracking-wide text-white leading-none">EVENTS</h1>
            <p className="text-[11px] text-[#8888AA]">{events.length} event tersedia</p>
          </div>
        </div>
        {user?.role === 'ADMIN' && (
          <button onClick={() => setShowCreate(true)}
            className="pressable flex items-center gap-1.5 text-white text-[13px] font-bold px-4 py-2.5 rounded-xl transition"
            style={{ background: 'linear-gradient(135deg, #1414FF, #0000CC)' }}>
            <Plus size={15} /> Buat Event
          </button>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Buat Event Baru" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Nama Event</label>
              <input type="text" value={form.title} onChange={set('title')} placeholder="Nama event" required className="input-base" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Tipe</label>
              <select value={form.type} onChange={set('type')} className="input-base appearance-none">
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Deskripsi</label>
              <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Deskripsi event (opsional)"
                className="input-base resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Tanggal</label>
                <input type="date" value={form.date} onChange={set('date')} required className="input-base" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Mulai</label>
                <input type="time" value={form.timeStart} onChange={set('timeStart')} required className="input-base" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Lokasi</label>
              <select value={form.court} onChange={set('court')} className="input-base appearance-none">
                {COURTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Maks. Pemain</label>
              <input type="number" value={form.maxPlayers} onChange={set('maxPlayers')} min={2} max={32} className="input-base" />
            </div>
            <button type="submit" disabled={creating}
              className="pressable w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #1414FF, #0000CC)' }}>
              {creating ? <Loader2 size={16} className="animate-spin-slow" /> : 'BUAT EVENT'}
            </button>
          </form>
        </Modal>
      )}

      {/* Events list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl mb-3">📅</p>
          <p className="text-white font-semibold mb-1">Belum ada event</p>
          <p className="text-[#8888AA] text-[13px]">Event aktif akan muncul di sini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(ev => {
            const tc = TYPE_CONFIG[ev.type] || TYPE_CONFIG.Lainnya;
            const sc = STATUS_CONFIG[ev.status] || STATUS_CONFIG.DRAFT;
            const participantPct = ev.maxPlayers ? ((ev._count?.invitations || 0) / ev.maxPlayers) * 100 : 0;

            return (
              <div key={ev.id} className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Top accent bar */}
                <div className="h-1" style={{ background: tc.color }} />

                <div className="p-4">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ background: tc.bg }}>
                        {tc.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-[14px] leading-tight">{ev.title}</h3>
                        <span className="text-[11px] font-semibold" style={{ color: tc.color }}>{ev.type}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg flex-shrink-0"
                      style={{ color: sc.color, background: sc.bg }}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-[#8888AA] mb-3">
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} className="text-[#8888AA]" />
                      {new Date(ev.date).toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short' })} · {ev.timeStart}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-[#8888AA]" />
                      <span className="truncate">{ev.court}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={11} className="text-[#8888AA]" />
                      {ev._count?.invitations || 0}/{ev.maxPlayers} peserta
                    </span>
                    {ev.pointReward > 0 && (
                      <span className="text-[#FFB800] font-bold">+{ev.pointReward} pts</span>
                    )}
                  </div>

                  {/* Participant progress */}
                  <div className="h-1 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${participantPct}%`, background: tc.color }} />
                  </div>

                  {ev.description && (
                    <p className="text-[11px] text-[#8888AA] mb-3 leading-relaxed">{ev.description}</p>
                  )}

                  {/* RSVP buttons */}
                  {ev.status === 'ACTIVE' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleRSVP(ev.id, 'ACCEPTED')}
                        disabled={rsvping === ev.id + 'ACCEPTED'}
                        className="pressable flex-1 flex items-center justify-center gap-1.5 text-[13px] font-bold py-2.5 rounded-xl transition disabled:opacity-50"
                        style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}>
                        {rsvping === ev.id + 'ACCEPTED' ? <Loader2 size={14} className="animate-spin-slow" /> : <><Check size={14} /> Hadir</>}
                      </button>
                      <button onClick={() => handleRSVP(ev.id, 'DECLINED')}
                        disabled={rsvping === ev.id + 'DECLINED'}
                        className="pressable flex-1 flex items-center justify-center gap-1.5 text-[13px] font-bold py-2.5 rounded-xl transition disabled:opacity-50"
                        style={{ background: 'rgba(255,23,33,0.10)', border: '1px solid rgba(255,23,33,0.2)', color: '#FF6666' }}>
                        {rsvping === ev.id + 'DECLINED' ? <Loader2 size={14} className="animate-spin-slow" /> : <><X size={14} /> Tidak Bisa</>}
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
