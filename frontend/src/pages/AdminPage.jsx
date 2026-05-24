import { useEffect, useState } from 'react';
import { Shield, Users, Swords, Gift, Bell, Download, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

const STATUS_COLORS = { ACTIVE: 'text-green-400', PENDING: 'text-yellow-400', INACTIVE: 'text-gray-400', BANNED: 'text-red-400' };

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState(null);
  const [tab, setTab] = useState('stats');
  const [broadcast, setBroadcast] = useState({ title: '', body: '' });
  const [memberFilter, setMemberFilter] = useState('');

  const fetchAll = () => {
    api.get('/api/admin/stats').then(r => setStats(r.data.stats)).catch(() => {});
    api.get('/api/admin/activity').then(r => setActivity(r.data)).catch(() => {});
    api.get('/api/users').then(r => setMembers(r.data.users || [])).catch(() => {});
  };

  useEffect(() => { fetchAll(); }, []);

  const handleStatusUpdate = async (userId, status) => {
    try {
      await api.put(`/api/users/${userId}/status`, { status });
      toast.success(`Status diubah: ${status}`);
      fetchAll();
    } catch (err) {
      toast.error('Gagal update status');
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/admin/broadcast', { ...broadcast, type: 'system' });
      toast.success(data.message);
      setBroadcast({ title: '', body: '' });
    } catch (err) {
      toast.error('Gagal broadcast');
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/api/admin/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'amandel-report.csv';
      a.click();
    } catch {
      toast.error('Gagal export');
    }
  };

  const filteredMembers = members.filter(m =>
    !memberFilter || m.status === memberFilter
  );

  const statCards = stats ? [
    { label: 'Total Member', value: stats.memberCount, sub: `${stats.activeMembers} aktif`, color: '#00008F' },
    { label: 'Pending Approval', value: stats.pendingMembers, color: '#FFB800' },
    { label: 'Match Menunggu', value: stats.pendingValidate, color: '#FF1721' },
    { label: 'Redeem Pending', value: stats.redemptionPending, color: '#00E5FF' },
    { label: 'Event Aktif', value: stats.eventCount, color: '#00008F' },
    { label: 'Total Poin', value: stats.totalPointsCirculating?.toLocaleString('id-ID'), color: '#FFB800' },
  ] : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-[#00008F]" />
          <h1 className="font-display text-2xl font-black tracking-wide text-white">ADMIN PANEL</h1>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-1 bg-[#111128] border border-[#2A2A4A] text-gray-300 text-xs font-bold px-3 py-1.5 rounded-lg hover:border-[#FFB800] transition">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#111128] border border-[#2A2A4A] rounded-xl p-1 gap-1 overflow-x-auto">
        {[['stats', 'Dashboard'], ['members', 'Members'], ['activity', 'Aktivitas'], ['broadcast', 'Broadcast']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition ${tab === k ? 'bg-[#00008F] text-white' : 'text-gray-400 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === 'stats' && (
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(s => (
            <div key={s.label} className="bg-[#111128] border border-[#2A2A4A] rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="font-mono font-black text-2xl" style={{ color: s.color }}>{s.value}</p>
              {s.sub && <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      {tab === 'members' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[['', 'Semua'], ['PENDING', 'Pending'], ['ACTIVE', 'Aktif'], ['BANNED', 'Banned']].map(([k, l]) => (
              <button key={k} onClick={() => setMemberFilter(k)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${memberFilter === k ? 'bg-[#00008F] text-white' : 'bg-[#111128] border border-[#2A2A4A] text-gray-400'}`}>
                {l}
              </button>
            ))}
          </div>
          {filteredMembers.map(m => (
            <div key={m.id} className="bg-[#111128] border border-[#2A2A4A] rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white text-sm">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.email} · {m.department}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                    <span className="text-[10px] text-gray-500">ID: {m.employeeId || '—'}</span>
                    <span className="text-[10px] font-mono text-[#FFB800]">{m.totalPoints} pts</span>
                  </div>
                </div>
              </div>
              {m.status === 'PENDING' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleStatusUpdate(m.id, 'ACTIVE')}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-bold py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition">
                    <CheckCircle size={12} /> Approve
                  </button>
                  <button onClick={() => handleStatusUpdate(m.id, 'BANNED')}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-bold py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition">
                    <XCircle size={12} /> Tolak
                  </button>
                </div>
              )}
              {m.status === 'ACTIVE' && (
                <button onClick={() => handleStatusUpdate(m.id, 'INACTIVE')}
                  className="w-full mt-3 text-xs font-bold py-1.5 rounded-lg bg-gray-500/10 border border-gray-500/30 text-gray-400 hover:bg-gray-500/20 transition">
                  Nonaktifkan
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Activity */}
      {tab === 'activity' && activity && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Match Terbaru</h3>
            <div className="space-y-2">
              {activity.recentMatches?.map(m => (
                <div key={m.id} className="bg-[#111128] border border-[#2A2A4A] rounded-lg px-4 py-3 flex justify-between">
                  <div>
                    <p className="text-sm text-white">{m.eventName}</p>
                    <p className="text-xs text-gray-500">{m.createdBy?.name} · {m.format}</p>
                  </div>
                  <span className="text-xs text-gray-500 self-center">{new Date(m.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Redemption Terbaru</h3>
            <div className="space-y-2">
              {activity.recentRedemptions?.map(r => (
                <div key={r.id} className="bg-[#111128] border border-[#2A2A4A] rounded-lg px-4 py-3 flex justify-between">
                  <div>
                    <p className="text-sm text-white">{r.user?.name}</p>
                    <p className="text-xs text-gray-500">{r.reward?.name}</p>
                  </div>
                  <span className="text-xs text-gray-500 self-center">{new Date(r.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Member Baru</h3>
            <div className="space-y-2">
              {activity.recentMembers?.map(m => (
                <div key={m.id} className="bg-[#111128] border border-[#2A2A4A] rounded-lg px-4 py-3 flex justify-between">
                  <div>
                    <p className="text-sm text-white">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.department}</p>
                  </div>
                  <span className={`text-xs font-bold self-center ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Broadcast */}
      {tab === 'broadcast' && (
        <div className="bg-[#111128] border border-[#2A2A4A] rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Bell size={16} /> Broadcast Notifikasi</h3>
          <form onSubmit={handleBroadcast} className="space-y-3">
            <input type="text" value={broadcast.title} onChange={e => setBroadcast({...broadcast, title: e.target.value})} placeholder="Judul notifikasi" required
              className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00008F]" />
            <textarea value={broadcast.body} onChange={e => setBroadcast({...broadcast, body: e.target.value})} placeholder="Isi pesan..." rows={3} required
              className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00008F] resize-none" />
            <button type="submit" className="w-full bg-[#00008F] hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition">
              KIRIM KE SEMUA MEMBER
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
