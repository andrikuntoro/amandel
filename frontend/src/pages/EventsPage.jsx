import { useEffect, useState } from 'react';
import { Calendar, Plus, MapPin, Clock, Users, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const COURTS = ['Court A – Epicentrum', 'Court B – Epicentrum', 'Court C – Epicentrum', 'AXA Tower Rooftop', 'Lainnya'];
const EVENT_TYPES = ['Friendly', 'Tournament', 'Workshop', 'Social', 'Lainnya'];

export default function EventsPage() {
  const user = useAuthStore(s => s.user);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'Friendly', description: '', date: '', timeStart: '', timeEnd: '', court: COURTS[0], maxPlayers: 8 });
  const [creating, setCreating] = useState(false);

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
      setForm({ title: '', type: 'Friendly', description: '', date: '', timeStart: '', timeEnd: '', court: COURTS[0], maxPlayers: 8 });
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal membuat event');
    } finally {
      setCreating(false);
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      await api.post(`/api/events/${eventId}/rsvp`, { status });
      toast.success(status === 'ACCEPTED' ? 'Konfirmasi hadir!' : 'Kamu menolak undangan');
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal RSVP');
    }
  };

  const statusColors = { ACTIVE: 'text-green-400 bg-green-400/10', DRAFT: 'text-yellow-400 bg-yellow-400/10', COMPLETED: 'text-gray-400 bg-gray-400/10', CANCELLED: 'text-red-400 bg-red-400/10' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-[#00008F]" />
          <h1 className="font-display text-2xl font-black tracking-wide text-white">EVENTS</h1>
        </div>
        {user?.role === 'ADMIN' && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 bg-[#00008F] hover:bg-blue-800 text-white text-sm font-bold px-4 py-2 rounded-lg transition">
            <Plus size={16} /> Buat Event
          </button>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#111128] border border-[#2A2A4A] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white text-lg">Buat Event Baru</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Nama Event" required
                  className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00008F]" />
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00008F]">
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Deskripsi (opsional)" rows={2}
                  className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00008F] resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Tanggal</label>
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required
                      className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00008F]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Mulai</label>
                    <input type="time" value={form.timeStart} onChange={e => setForm({...form, timeStart: e.target.value})} required
                      className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00008F]" />
                  </div>
                </div>
                <select value={form.court} onChange={e => setForm({...form, court: e.target.value})}
                  className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00008F]">
                  {COURTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Maks. Pemain</label>
                  <input type="number" value={form.maxPlayers} onChange={e => setForm({...form, maxPlayers: parseInt(e.target.value)})} min={2} max={32}
                    className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00008F]" />
                </div>
                <button type="submit" disabled={creating}
                  className="w-full bg-[#00008F] hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
                  {creating ? 'Membuat...' : 'BUAT EVENT'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Events list */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Memuat events...</div>
      ) : events.length === 0 ? (
        <div className="bg-[#111128] border border-[#2A2A4A] rounded-xl p-12 text-center text-gray-500">
          Belum ada event aktif
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(ev => (
            <div key={ev.id} className="bg-[#111128] border border-[#2A2A4A] rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-white">{ev.title}</h3>
                  <span className="text-xs">{ev.type}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[ev.status]}`}>{ev.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {new Date(ev.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })} · {ev.timeStart}
                </span>
                <span className="flex items-center gap-1"><MapPin size={11} /> {ev.court}</span>
                <span className="flex items-center gap-1"><Users size={11} /> {ev._count?.invitations || 0}/{ev.maxPlayers} peserta</span>
                {ev.pointReward > 0 && <span className="text-[#FFB800]">+{ev.pointReward} pts</span>}
              </div>

              {ev.description && <p className="text-xs text-gray-500 mb-3">{ev.description}</p>}

              {ev.status === 'ACTIVE' && (
                <div className="flex gap-2">
                  <button onClick={() => handleRSVP(ev.id, 'ACCEPTED')}
                    className="flex-1 flex items-center justify-center gap-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold py-2 rounded-lg hover:bg-green-500/20 transition">
                    <Check size={14} /> Hadir
                  </button>
                  <button onClick={() => handleRSVP(ev.id, 'DECLINED')}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold py-2 rounded-lg hover:bg-red-500/20 transition">
                    <X size={14} /> Tidak Bisa
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
