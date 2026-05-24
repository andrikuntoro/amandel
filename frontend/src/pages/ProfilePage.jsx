import { useState, useEffect } from 'react';
import { User, Bell, LogOut, Edit2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const TIER_COLORS = { BRONZE: '#CD7F32', SILVER: '#C0C0C0', GOLD: '#FFB800', DIAMOND: '#00E5FF' };
const TIER_LABELS = { BRONZE: 'Bronze Ball', SILVER: 'Silver Smash', GOLD: 'Gold Ace', DIAMOND: 'Diamond Padel' };

export default function ProfilePage() {
  const { user, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', phone: user?.phone || '' });
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [pointLogs, setPointLogs] = useState([]);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    api.get('/api/notifications').then(r => setNotifications(r.data.notifications || [])).catch(() => {});
    if (user?.id) {
      api.get(`/api/users/${user.id}`).then(r => {
        setStats(r.data.stats);
        setPointLogs(r.data.stats?.pointLogs || []);
      }).catch(() => {});
    }
  }, [user?.id]);

  const handleSave = async () => {
    try {
      const { data } = await api.put(`/api/users/${user.id}`, form);
      setAuth(data.user, useAuthStore.getState().token);
      toast.success('Profil diperbarui!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal update profil');
    }
  };

  const handleReadAll = async () => {
    await api.put('/api/notifications/read-all').catch(() => {});
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    toast.success('Semua notifikasi ditandai dibaca');
  };

  const tierColor = TIER_COLORS[user?.tier] || '#888';
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#111128] to-[#080814] border border-[#2A2A4A] rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border-2"
            style={{ background: `${tierColor}22`, borderColor: tierColor, color: tierColor }}>
            {user?.name?.[0]}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-black text-white tracking-wide">{user?.name}</h2>
            <p className="text-gray-400 text-sm">{user?.department}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{ color: tierColor, borderColor: tierColor, background: `${tierColor}22` }}>
                {TIER_LABELS[user?.tier]}
              </span>
              <span className="font-mono font-bold text-sm" style={{ color: tierColor }}>
                {user?.totalPoints?.toLocaleString()} pts
              </span>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} className="p-2 rounded-lg bg-[#2A2A4A] hover:bg-[#3A3A6A] transition">
            <Edit2 size={16} className="text-gray-400" />
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#2A2A4A]">
            <div className="text-center">
              <p className="font-mono font-bold text-xl text-white">{stats.matchCount}</p>
              <p className="text-xs text-gray-500">Total Match</p>
            </div>
            <div className="text-center">
              <p className="font-mono font-bold text-xl text-white">{stats.winCount}</p>
              <p className="text-xs text-gray-500">Menang</p>
            </div>
            <div className="text-center">
              <p className="font-mono font-bold text-xl text-white">{user?.totalPoints?.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Pts</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-[#111128] border border-[#2A2A4A] rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-white">Edit Profil</h3>
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nama Lengkap"
            className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00008F]" />
          <input type="text" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="Departemen"
            className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00008F]" />
          <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="No. HP"
            className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00008F]" />
          <div className="flex gap-2">
            <button onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-1 bg-[#00008F] hover:bg-blue-800 text-white text-sm font-bold py-2.5 rounded-lg transition">
              <Save size={14} /> Simpan
            </button>
            <button onClick={() => setEditing(false)}
              className="px-4 py-2.5 border border-[#2A2A4A] text-gray-400 rounded-lg text-sm hover:border-gray-500 transition">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-[#111128] border border-[#2A2A4A] rounded-xl p-1 gap-1">
        <button onClick={() => setTab('profile')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${tab === 'profile' ? 'bg-[#00008F] text-white' : 'text-gray-400'}`}>
          Info
        </button>
        <button onClick={() => setTab('points')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${tab === 'points' ? 'bg-[#00008F] text-white' : 'text-gray-400'}`}>
          Poin Log
        </button>
        <button onClick={() => setTab('notif')}
          className={`flex-1 relative py-2 rounded-lg text-xs font-semibold transition ${tab === 'notif' ? 'bg-[#00008F] text-white' : 'text-gray-400'}`}>
          Notifikasi {unreadCount > 0 && <span className="ml-1 bg-[#FF1721] text-white text-[9px] px-1 rounded-full">{unreadCount}</span>}
        </button>
      </div>

      {tab === 'profile' && (
        <div className="bg-[#111128] border border-[#2A2A4A] rounded-xl p-4 space-y-3">
          {[
            { label: 'Email', value: user?.email },
            { label: 'Employee ID', value: user?.employeeId || '—' },
            { label: 'Departemen', value: user?.department },
            { label: 'No. HP', value: user?.phone || '—' },
            { label: 'Member Sejak', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-[#2A2A4A] last:border-0">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-sm text-white font-medium">{value}</span>
            </div>
          ))}
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center justify-center gap-2 border border-red-900 text-red-400 hover:bg-red-900/20 text-sm font-bold py-2.5 rounded-lg transition mt-2">
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}

      {tab === 'points' && (
        <div className="bg-[#111128] border border-[#2A2A4A] rounded-xl overflow-hidden">
          {pointLogs.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">Belum ada riwayat poin</div>
          ) : pointLogs.map((log, i) => (
            <div key={log.id} className={`flex items-center justify-between px-4 py-3 ${i < pointLogs.length - 1 ? 'border-b border-[#2A2A4A]' : ''}`}>
              <div>
                <p className="text-sm text-white capitalize">{log.reason.replace(/_/g, ' ')}</p>
                <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleDateString('id-ID')}</p>
              </div>
              <span className={`font-mono font-bold text-sm ${log.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {log.points > 0 ? '+' : ''}{log.points} pts
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'notif' && (
        <div className="space-y-2">
          {unreadCount > 0 && (
            <button onClick={handleReadAll} className="w-full text-xs text-[#FFB800] hover:underline text-right">
              Tandai semua dibaca
            </button>
          )}
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">Tidak ada notifikasi</div>
          ) : (
            <div className="bg-[#111128] border border-[#2A2A4A] rounded-xl overflow-hidden">
              {notifications.map((n, i) => (
                <div key={n.id}
                  className={`px-4 py-3 ${!n.isRead ? 'bg-[#00008F]/10' : ''} ${i < notifications.length - 1 ? 'border-b border-[#2A2A4A]' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${!n.isRead ? 'text-white' : 'text-gray-300'}`}>{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.body}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#FF1721] flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">{new Date(n.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
