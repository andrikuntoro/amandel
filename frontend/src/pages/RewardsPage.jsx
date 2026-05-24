import { useEffect, useState } from 'react';
import { Gift, ShoppingBag, X, Plus, Loader2, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const CATEGORIES = ['Equipment','Apparel','Training','Booking','Exclusive'];

const CAT_CONFIG = {
  Equipment: { color:'#4488FF', bg:'rgba(68,136,255,0.12)',  emoji:'🎾' },
  Apparel:   { color:'#A855F7', bg:'rgba(168,85,247,0.12)',  emoji:'👕' },
  Training:  { color:'#22C55E', bg:'rgba(34,197,94,0.12)',   emoji:'🏋️' },
  Booking:   { color:'#FFB800', bg:'rgba(255,184,0,0.12)',   emoji:'📅' },
  Exclusive: { color:'#00E5FF', bg:'rgba(0,229,255,0.12)',   emoji:'💎' },
};

const REDEEM_STATUS = {
  PENDING:   { label:'Menunggu',   color:'#FFB800', bg:'rgba(255,184,0,0.12)',   icon: Clock },
  APPROVED:  { label:'Disetujui', color:'#4488FF', bg:'rgba(68,136,255,0.12)',  icon: CheckCircle },
  DELIVERED: { label:'Terkirim',  color:'#22C55E', bg:'rgba(34,197,94,0.12)',   icon: Truck },
  REJECTED:  { label:'Ditolak',   color:'#FF1721', bg:'rgba(255,23,33,0.12)',   icon: XCircle },
};

function Modal({ title, onClose, children }) {
  return (
    <div className="sheet-overlay flex items-end sm:items-center justify-center p-4">
      <div className="animate-slideUp w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl"
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

export default function RewardsPage() {
  const { user, setAuth } = useAuthStore();
  const [tab, setTab]                 = useState('catalog');
  const [rewards, setRewards]         = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [redeeming, setRedeeming]     = useState(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [newReward, setNewReward]     = useState({ name:'', description:'', pointCost:'', stock:'', category:'Equipment' });

  const fetchRewards = () => {
    setLoading(true);
    api.get('/api/rewards').then(r => setRewards(r.data.rewards || [])).catch(() => {}).finally(() => setLoading(false));
  };
  const fetchRedemptions = () => {
    api.get('/api/redemptions').then(r => setRedemptions(r.data.redemptions || [])).catch(() => {});
  };

  useEffect(() => { fetchRewards(); fetchRedemptions(); }, []);

  const handleRedeem = async (reward) => {
    if (user.totalPoints < reward.pointCost) {
      toast.error(`Butuh ${(reward.pointCost - user.totalPoints).toLocaleString()} pts lagi`);
      return;
    }
    setRedeeming(reward.id);
    try {
      await api.post('/api/redemptions', { rewardId: reward.id });
      toast.success(`✓ Berhasil redeem ${reward.name}!`);
      fetchRewards(); fetchRedemptions();
      const me = await api.get('/api/auth/me');
      setAuth(me.data.user, useAuthStore.getState().token);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal redeem');
    } finally {
      setRedeeming(null);
    }
  };

  const handleCreateReward = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/rewards', { ...newReward, pointCost: parseInt(newReward.pointCost), stock: parseInt(newReward.stock) });
      toast.success('Reward berhasil dibuat!');
      setShowCreate(false);
      fetchRewards();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal buat reward');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/api/redemptions/${id}/status`, { status });
      toast.success(`Status: ${status}`);
      fetchRedemptions();
    } catch { toast.error('Gagal update'); }
  };

  const set = (k) => (e) => setNewReward(r => ({ ...r, [k]: e.target.value }));

  const canAfford = (cost) => (user?.totalPoints || 0) >= cost;

  return (
    <div className="space-y-5 animate-fadeUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.12)' }}>
            <Gift size={18} className="text-[#00E5FF]" />
          </div>
          <div>
            <h1 className="font-display text-[22px] font-black tracking-wide text-white leading-none">REWARDS</h1>
            <p className="text-[11px] text-[#8888AA]">{rewards.length} reward tersedia</p>
          </div>
        </div>
        {user?.role === 'ADMIN' && (
          <button onClick={() => setShowCreate(true)}
            className="pressable flex items-center gap-1.5 text-white text-[13px] font-bold px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)', color: '#00E5FF' }}>
            <Plus size={15} /> Tambah
          </button>
        )}
      </div>

      {/* Points hero */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(255,184,0,0.15) 0%, rgba(255,255,255,0.03) 100%)', border: '1px solid rgba(255,184,0,0.25)' }}>
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-5 opacity-10">
          <Gift size={72} className="text-[#FFB800]" />
        </div>
        <p className="text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1">Poin tersedia</p>
        <p className="font-mono font-black text-[38px] text-[#FFB800] leading-none">
          {(user?.totalPoints || 0).toLocaleString('id-ID')}
        </p>
        <p className="text-[11px] text-[#8888AA] mt-1.5 font-medium">pts dapat ditukar dengan reward</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {[['catalog','Katalog',rewards.length],['history','Riwayat',redemptions.length]].map(([k,l,count]) => (
          <button key={k} onClick={() => setTab(k)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold transition pressable"
            style={tab === k ? { background: 'linear-gradient(135deg, #00b8d4, #007a8f)', color: '#fff' } : { color: '#8888AA' }}>
            {l} {count > 0 && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: tab === k ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)' }}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Create Reward Modal */}
      {showCreate && (
        <Modal title="Tambah Reward" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreateReward} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Nama Reward</label>
              <input type="text" value={newReward.name} onChange={set('name')} placeholder="Nama reward" required className="input-base" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Deskripsi</label>
              <textarea value={newReward.description} onChange={set('description')} placeholder="Deskripsi reward" rows={2} required className="input-base resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Point Cost</label>
                <input type="number" value={newReward.pointCost} onChange={set('pointCost')} placeholder="500" required min={1} className="input-base" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Stok</label>
                <input type="number" value={newReward.stock} onChange={set('stock')} placeholder="10" required min={0} className="input-base" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Kategori</label>
              <select value={newReward.category} onChange={set('category')} className="input-base appearance-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" className="pressable w-full text-white font-bold py-3.5 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #00b8d4, #007a8f)' }}>
              SIMPAN REWARD
            </button>
          </form>
        </Modal>
      )}

      {/* Catalog */}
      {tab === 'catalog' && (
        loading ? (
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
        ) : rewards.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-4xl mb-3">🎁</p>
            <p className="text-white font-semibold mb-1">Belum ada reward</p>
            <p className="text-[#8888AA] text-[13px]">Admin belum menambahkan reward</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rewards.map(r => {
              const cc = CAT_CONFIG[r.category] || CAT_CONFIG.Equipment;
              const affordable = canAfford(r.pointCost);
              const outOfStock = r.stock < 1;

              return (
                <div key={r.id} className="rounded-2xl p-4 flex items-start gap-3 transition"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${affordable && !outOfStock ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                    opacity: outOfStock ? 0.6 : 1 }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: cc.bg }}>
                    {cc.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-[14px] leading-tight">{r.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
                        style={{ color: cc.color, background: cc.bg }}>{r.category}</span>
                    </div>
                    <p className="text-[11px] text-[#8888AA] mt-0.5 line-clamp-2 leading-relaxed">{r.description}</p>
                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="font-mono font-black text-[15px] text-[#FFB800]">{r.pointCost.toLocaleString()} pts</span>
                      <span className="text-[10px] text-[#8888AA]">Stok: {r.stock}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRedeem(r)} disabled={!!redeeming || outOfStock || !affordable}
                    className="pressable flex-shrink-0 text-[12px] font-black px-3 py-2.5 rounded-xl transition disabled:opacity-40"
                    style={affordable && !outOfStock
                      ? { background: 'rgba(255,184,0,0.15)', border: '1px solid rgba(255,184,0,0.3)', color: '#FFB800' }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8888AA' }}>
                    {redeeming === r.id ? <Loader2 size={14} className="animate-spin-slow" /> : outOfStock ? 'Habis' : 'REDEEM'}
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* History */}
      {tab === 'history' && (
        redemptions.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-4xl mb-3">📦</p>
            <p className="text-white font-semibold mb-1">Belum ada riwayat</p>
            <p className="text-[#8888AA] text-[13px]">Riwayat redemption akan muncul di sini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {redemptions.map(r => {
              const sc = REDEEM_STATUS[r.status] || REDEEM_STATUS.PENDING;
              const StatusIcon = sc.icon;
              return (
                <div key={r.id} className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-[14px]">{r.reward?.name}</p>
                      {user?.role === 'ADMIN' && (
                        <p className="text-[11px] text-[#8888AA] mt-0.5">{r.user?.name} · {r.user?.department}</p>
                      )}
                      <p className="text-[11px] text-[#8888AA]">{new Date(r.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1.5 rounded-xl flex-shrink-0"
                      style={{ color: sc.color, background: sc.bg }}>
                      <StatusIcon size={11} /> {sc.label}
                    </span>
                  </div>
                  <p className="font-mono font-bold text-[13px] text-[#FFB800]">{r.reward?.pointCost?.toLocaleString()} pts</p>

                  {user?.role === 'ADMIN' && r.status === 'PENDING' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleStatusUpdate(r.id, 'APPROVED')}
                        className="pressable flex-1 text-[12px] font-bold py-2 rounded-xl"
                        style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}>
                        Approve
                      </button>
                      <button onClick={() => handleStatusUpdate(r.id, 'REJECTED')}
                        className="pressable flex-1 text-[12px] font-bold py-2 rounded-xl"
                        style={{ background: 'rgba(255,23,33,0.10)', border: '1px solid rgba(255,23,33,0.2)', color: '#FF6666' }}>
                        Reject
                      </button>
                    </div>
                  )}
                  {user?.role === 'ADMIN' && r.status === 'APPROVED' && (
                    <button onClick={() => handleStatusUpdate(r.id, 'DELIVERED')}
                      className="pressable w-full mt-3 text-[12px] font-bold py-2 rounded-xl"
                      style={{ background: 'rgba(68,136,255,0.12)', border: '1px solid rgba(68,136,255,0.25)', color: '#4488FF' }}>
                      Tandai Terkirim
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
      <div className="h-2" />
    </div>
  );
}
