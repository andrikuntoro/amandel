import { useState, useEffect } from 'react';
import { LogOut, Edit2, Save, X, Bell, Swords, Trophy, Zap, Star, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const TIER = {
  BRONZE:  { color:'#CD7F32', bg:'rgba(205,127,50,0.15)',  label:'Bronze Ball',    next:300  },
  SILVER:  { color:'#C0C0C0', bg:'rgba(192,192,192,0.12)', label:'Silver Smash',   next:600  },
  GOLD:    { color:'#FFB800', bg:'rgba(255,184,0,0.15)',   label:'Gold Ace',        next:1200 },
  DIAMOND: { color:'#00E5FF', bg:'rgba(0,229,255,0.12)',   label:'Diamond Padel',  next:null },
};

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider">{label}</span>
      <span className="text-[13px] font-medium text-white">{value || '—'}</span>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-0.5"
        style={{ background: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <span className="font-mono font-black text-[20px] text-white leading-none">{value}</span>
      <span className="text-[10px] font-medium text-[#8888AA]">{label}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', phone: user?.phone || '' });
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [pointLogs, setPointLogs] = useState([]);
  const [tab, setTab] = useState('info');
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      const { data } = await api.put(`/api/users/${user.id}`, form);
      setAuth(data.user, useAuthStore.getState().token);
      toast.success('Profil diperbarui!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal update profil');
    } finally {
      setSaving(false);
    }
  };

  const handleReadAll = async () => {
    await api.put('/api/notifications/read-all').catch(() => {});
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    toast.success('Semua notifikasi dibaca');
  };

  const tier = TIER[user?.tier] || TIER.BRONZE;
  const progress = tier.next ? Math.min(((user?.totalPoints || 0) / tier.next) * 100, 100) : 100;
  const unread = notifications.filter(n => !n.isRead).length;

  const TABS = [
    { k:'info',   l:'Info'          },
    { k:'points', l:'Poin Log'      },
    { k:'notif',  l:`Notif${unread > 0 ? ` (${unread})` : ''}` },
  ];

  return (
    <div className="space-y-5 animate-fadeUp">
      {/* ── Profile hero ── */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${tier.color}18 0%, rgba(255,255,255,0.03) 100%)`, border: `1px solid ${tier.color}25` }}>
        {/* Top glow */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${tier.color}80, transparent)` }} />

        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
              style={{ background: tier.bg, border: `2px solid ${tier.color}60`, color: tier.color,
                boxShadow: `0 0 24px ${tier.color}30` }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-display text-[20px] font-black text-white leading-tight">{user?.name}</h2>
              <p className="text-[11px] text-[#8888AA] mt-0.5">{user?.department}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-lg"
                  style={{ color: tier.color, background: tier.bg, border: `1px solid ${tier.color}40` }}>
                  {tier.label}
                </span>
                <span className="font-mono font-bold text-[12px]" style={{ color: tier.color }}>
                  {(user?.totalPoints || 0).toLocaleString()} pts
                </span>
              </div>
            </div>

            <button onClick={() => setEditing(!editing)}
              className="w-9 h-9 rounded-xl flex items-center justify-center pressable flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}>
              {editing ? <X size={16} className="text-gray-400" /> : <Edit2 size={15} className="text-gray-400" />}
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-[#8888AA] mb-1.5">
              <span>{tier.label}</span>
              <span>{tier.next ? `${(tier.next - (user?.totalPoints || 0)).toLocaleString()} pts lagi` : '🏆 Tier Tertinggi!'}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${tier.color}80, ${tier.color})` }} />
            </div>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="flex divide-x" style={{ borderTop: `1px solid ${tier.color}15`, '--tw-divide-opacity':1 }}>
            <StatCard icon={Swords}  value={stats.matchCount || 0}  label="Matches"   color="#FF1721" />
            <StatCard icon={Trophy}  value={stats.winCount || 0}    label="Menang"    color="#FFB800" />
            <StatCard icon={Zap}     value={user?.totalPoints || 0} label="Total Pts" color={tier.color} />
            <StatCard icon={Star}    value={stats.mvpCount || 0}    label="MVP"       color="#00E5FF" />
          </div>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="rounded-2xl p-4 space-y-3 animate-scaleIn"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <h3 className="font-bold text-white text-[14px]">Edit Profil</h3>
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nama Lengkap" className="input-base" />
          <input type="text" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="Departemen" className="input-base" />
          <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="No. HP" className="input-base" />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="pressable flex-1 flex items-center justify-center gap-1.5 text-white font-bold py-3 rounded-xl disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #1414FF, #0000CC)' }}>
              {saving ? '...' : <><Save size={14} /> Simpan</>}
            </button>
            <button onClick={() => setEditing(false)}
              className="pressable px-5 py-3 rounded-xl font-semibold text-[#8888AA]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(({ k, l }) => (
          <button key={k} onClick={() => setTab(k)}
            className="flex-1 py-2.5 rounded-xl text-[12px] font-bold transition pressable"
            style={tab === k ? { background: 'linear-gradient(135deg, #1414FF, #0000CC)', color: '#fff' } : { color: '#8888AA' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === 'info' && (
        <div className="rounded-2xl overflow-hidden animate-fadeIn"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-4 pt-4 pb-1 space-y-0">
            <InfoRow label="Email"       value={user?.email} />
            <InfoRow label="Employee ID" value={user?.employeeId} />
            <InfoRow label="Departemen"  value={user?.department} />
            <InfoRow label="No. HP"      value={user?.phone} />
            <InfoRow label="Member Sejak" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }) : null} />
          </div>
          <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="pressable w-full flex items-center justify-center gap-2 text-[#FF6666] font-bold py-3 rounded-xl transition"
              style={{ background: 'rgba(255,23,33,0.08)', border: '1px solid rgba(255,23,33,0.2)' }}>
              <LogOut size={16} /> Keluar dari akun
            </button>
          </div>
        </div>
      )}

      {/* Points log tab */}
      {tab === 'points' && (
        <div className="rounded-2xl overflow-hidden animate-fadeIn"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {pointLogs.length === 0 ? (
            <div className="py-12 text-center text-[#8888AA]">
              <p className="text-3xl mb-3">📊</p>Belum ada riwayat poin
            </div>
          ) : pointLogs.map((log, i) => (
            <div key={log.id} className="flex items-center justify-between px-4 py-3.5 border-b last:border-0"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div>
                <p className="text-[13px] font-semibold text-white capitalize">{log.reason.replace(/_/g, ' ')}</p>
                <p className="text-[10px] text-[#8888AA] mt-0.5">{new Date(log.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}</p>
              </div>
              <span className={`font-mono font-black text-[15px] ${log.points > 0 ? 'text-[#22C55E]' : 'text-[#FF6666]'}`}>
                {log.points > 0 ? '+' : ''}{log.points}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Notifications tab */}
      {tab === 'notif' && (
        <div className="space-y-3 animate-fadeIn">
          {unread > 0 && (
            <button onClick={handleReadAll}
              className="pressable w-full flex items-center justify-center gap-1.5 text-[12px] font-bold py-2.5 rounded-xl"
              style={{ background: 'rgba(255,184,0,0.10)', border: '1px solid rgba(255,184,0,0.2)', color: '#FFB800' }}>
              <Bell size={13} /> Tandai semua dibaca
            </button>
          )}
          {notifications.length === 0 ? (
            <div className="rounded-2xl py-12 text-center text-[#8888AA]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-3xl mb-3">🔔</p>Tidak ada notifikasi
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {notifications.map((n, i) => (
                <div key={n.id} className={`px-4 py-3.5 border-b last:border-0 transition ${!n.isRead ? '' : ''}`}
                  style={{ borderColor: 'rgba(255,255,255,0.05)', background: !n.isRead ? 'rgba(20,20,255,0.06)' : 'transparent' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ background: !n.isRead ? '#FF1721' : 'transparent' }} />
                    <div className="flex-1">
                      <p className={`text-[13px] font-semibold leading-tight ${!n.isRead ? 'text-white' : 'text-gray-300'}`}>{n.title}</p>
                      <p className="text-[11px] text-[#8888AA] mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-gray-600 mt-1.5">
                        {new Date(n.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="h-2" />
    </div>
  );
}
