import { useEffect, useState } from 'react';
import { Shield, Users, Swords, Gift, Bell, Download, CheckCircle, XCircle, TrendingUp, Zap, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

const MEMBER_STATUS = {
  ACTIVE:   { label:'Aktif',    color:'#22C55E', bg:'rgba(34,197,94,0.12)'    },
  PENDING:  { label:'Pending',  color:'#FFB800', bg:'rgba(255,184,0,0.12)'    },
  INACTIVE: { label:'Inaktif',  color:'#8888AA', bg:'rgba(136,136,170,0.12)'  },
  BANNED:   { label:'Banned',   color:'#FF1721', bg:'rgba(255,23,33,0.12)'    },
};

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="rounded-2xl p-4 relative overflow-hidden"
      style={{ background: `${color}0A`, border: `1px solid ${color}20` }}>
      <div className="absolute top-3 right-3 opacity-20">
        <Icon size={28} style={{ color }} />
      </div>
      <p className="text-[10px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">{label}</p>
      <p className="font-mono font-black text-[26px] leading-none" style={{ color }}>{value ?? '—'}</p>
      {sub && <p className="text-[10px] text-[#8888AA] mt-1.5">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats]           = useState(null);
  const [members, setMembers]       = useState([]);
  const [activity, setActivity]     = useState(null);
  const [tab, setTab]               = useState('stats');
  const [broadcast, setBroadcast]   = useState({ title:'', body:'' });
  const [memberFilter, setMemberFilter] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const fetchAll = () => {
    api.get('/api/admin/stats').then(r => setStats(r.data.stats)).catch(() => {});
    api.get('/api/admin/activity').then(r => setActivity(r.data)).catch(() => {});
    api.get('/api/users').then(r => setMembers(r.data.users || [])).catch(() => {});
  };

  useEffect(() => { fetchAll(); }, []);

  const handleStatusUpdate = async (userId, status) => {
    try {
      await api.put(`/api/users/${userId}/status`, { status });
      toast.success(`Status: ${status}`);
      fetchAll();
    } catch { toast.error('Gagal update status'); }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setBroadcasting(true);
    try {
      const { data } = await api.post('/api/admin/broadcast', { ...broadcast, type: 'system' });
      toast.success(data.message);
      setBroadcast({ title:'', body:'' });
    } catch { toast.error('Gagal broadcast'); } finally { setBroadcasting(false); }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/api/admin/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = 'amandel-report.csv'; a.click();
    } catch { toast.error('Gagal export'); }
  };

  const filteredMembers = members.filter(m => !memberFilter || m.status === memberFilter);

  const TABS = [['stats','Dashboard'],['members','Members'],['activity','Aktivitas'],['broadcast','Broadcast']];

  return (
    <div className="space-y-5 animate-fadeUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(20,20,255,0.15)' }}>
            <Shield size={18} className="text-blue-400" />
          </div>
          <div>
            <h1 className="font-display text-[22px] font-black tracking-wide text-white leading-none">ADMIN</h1>
            <p className="text-[11px] text-[#8888AA]">Panel manajemen</p>
          </div>
        </div>
        <button onClick={handleExport}
          className="pressable flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#8888AA' }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className="pressable flex-shrink-0 px-4 py-2.5 rounded-xl text-[12px] font-bold transition"
            style={tab === k ? { background: 'linear-gradient(135deg, #1414FF, #0000CC)', color: '#fff' } : { color: '#8888AA' }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Dashboard ── */}
      {tab === 'stats' && stats && (
        <div className="space-y-5 animate-fadeIn">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Member"     value={stats.memberCount}                           sub={`${stats.activeMembers} aktif`}  color="#4488FF" icon={Users}     />
            <StatCard label="Pending Approval" value={stats.pendingMembers}                        sub="perlu disetujui"                 color="#FFB800" icon={Shield}    />
            <StatCard label="Validasi Match"   value={stats.pendingValidate}                       sub="menunggu review"                 color="#FF1721" icon={Swords}    />
            <StatCard label="Redeem Pending"   value={stats.redemptionPending}                     sub="perlu diproses"                  color="#00E5FF" icon={Gift}      />
            <StatCard label="Event Aktif"      value={stats.eventCount}                            sub="sedang berjalan"                 color="#22C55E" icon={Activity}  />
            <StatCard label="Total Poin"       value={stats.totalPointsCirculating?.toLocaleString('id-ID')} sub="beredar di komunitas" color="#A855F7" icon={Zap}       />
          </div>
        </div>
      )}

      {/* ── Members ── */}
      {tab === 'members' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[['','Semua'],['PENDING','Pending'],['ACTIVE','Aktif'],['INACTIVE','Inaktif'],['BANNED','Banned']].map(([k, l]) => (
              <button key={k} onClick={() => setMemberFilter(k)}
                className="pressable flex-shrink-0 px-3.5 py-2 rounded-xl text-[12px] font-bold transition"
                style={memberFilter === k
                  ? { background: 'linear-gradient(135deg, #1414FF, #0000CC)', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8888AA' }}>
                {l}
              </button>
            ))}
          </div>

          {filteredMembers.length === 0 ? (
            <div className="rounded-2xl py-10 text-center text-[#8888AA]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              Tidak ada member
            </div>
          ) : filteredMembers.map(m => {
            const ms = MEMBER_STATUS[m.status] || MEMBER_STATUS.INACTIVE;
            return (
              <div key={m.id} className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                    {m.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-white text-[13px]">{m.name}</p>
                      <span className="text-[9px] font-black px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ color: ms.color, background: ms.bg }}>{ms.label}</span>
                    </div>
                    <p className="text-[11px] text-[#8888AA] truncate">{m.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-[#8888AA]">{m.department}</span>
                      {m.employeeId && <span className="text-[10px] text-[#8888AA]">· {m.employeeId}</span>}
                      <span className="text-[10px] font-mono font-bold text-[#FFB800]">{m.totalPoints} pts</span>
                    </div>
                  </div>
                </div>

                {m.status === 'PENDING' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleStatusUpdate(m.id, 'ACTIVE')}
                      className="pressable flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold py-2 rounded-xl"
                      style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}>
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button onClick={() => handleStatusUpdate(m.id, 'BANNED')}
                      className="pressable flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold py-2 rounded-xl"
                      style={{ background: 'rgba(255,23,33,0.10)', border: '1px solid rgba(255,23,33,0.2)', color: '#FF6666' }}>
                      <XCircle size={13} /> Tolak
                    </button>
                  </div>
                )}
                {m.status === 'ACTIVE' && (
                  <button onClick={() => handleStatusUpdate(m.id, 'INACTIVE')}
                    className="pressable w-full mt-3 text-[12px] font-bold py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8888AA' }}>
                    Nonaktifkan
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Activity ── */}
      {tab === 'activity' && activity && (
        <div className="space-y-5 animate-fadeIn">
          {[
            { title:'Match Terbaru', data: activity.recentMatches, render: m => ({ main: m.eventName, sub: `${m.createdBy?.name} · ${m.format}`, right: new Date(m.createdAt).toLocaleDateString('id-ID') }) },
            { title:'Redemption Terbaru', data: activity.recentRedemptions, render: r => ({ main: r.user?.name, sub: r.reward?.name, right: new Date(r.createdAt).toLocaleDateString('id-ID') }) },
            { title:'Member Baru', data: activity.recentMembers, render: m => ({ main: m.name, sub: m.department, right: MEMBER_STATUS[m.status]?.label || m.status, rightColor: MEMBER_STATUS[m.status]?.color }) },
          ].map(({ title, data, render }) => data?.length > 0 && (
            <div key={title}>
              <p className="text-[11px] font-bold text-[#8888AA] uppercase tracking-wider mb-2">{title}</p>
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {data.map((item, i) => {
                  const { main, sub, right, rightColor } = render(item);
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{main}</p>
                        <p className="text-[10px] text-[#8888AA]">{sub}</p>
                      </div>
                      <span className="text-[10px] font-bold flex-shrink-0" style={{ color: rightColor || '#8888AA' }}>{right}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Broadcast ── */}
      {tab === 'broadcast' && (
        <div className="animate-fadeIn">
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,184,0,0.12)' }}>
                <Bell size={18} className="text-[#FFB800]" />
              </div>
              <div>
                <p className="font-bold text-white text-[14px]">Broadcast Notifikasi</p>
                <p className="text-[11px] text-[#8888AA]">Kirim pesan ke semua member aktif</p>
              </div>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Judul</label>
                <input type="text" value={broadcast.title} onChange={e => setBroadcast({...broadcast, title: e.target.value})}
                  placeholder="Judul notifikasi" required className="input-base" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Pesan</label>
                <textarea value={broadcast.body} onChange={e => setBroadcast({...broadcast, body: e.target.value})}
                  placeholder="Isi pesan broadcast..." rows={4} required className="input-base resize-none" />
              </div>
              <button type="submit" disabled={broadcasting}
                className="pressable w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #1414FF, #0000CC)' }}>
                {broadcasting ? '...' : <><Bell size={15} /> KIRIM KE SEMUA MEMBER</>}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="h-2" />
    </div>
  );
}
