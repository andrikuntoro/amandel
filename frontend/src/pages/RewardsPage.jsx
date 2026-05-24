import { useEffect, useState } from 'react';
import { Gift, ShoppingBag, Check, X, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const CATEGORIES = ['Equipment', 'Apparel', 'Training', 'Booking', 'Exclusive'];

export default function RewardsPage() {
  const { user, setAuth } = useAuthStore();
  const [tab, setTab] = useState('catalog');
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newReward, setNewReward] = useState({ name: '', description: '', pointCost: '', stock: '', category: 'Equipment' });

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
      toast.error(`Poin tidak cukup! Butuh ${reward.pointCost} pts`);
      return;
    }
    setRedeeming(reward.id);
    try {
      await api.post('/api/redemptions', { rewardId: reward.id });
      toast.success(`Berhasil redeem ${reward.name}!`);
      fetchRewards();
      fetchRedemptions();
      // Refresh user points
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
      toast.success(`Status diupdate: ${status}`);
      fetchRedemptions();
    } catch (err) {
      toast.error('Gagal update status');
    }
  };

  const statusColors = {
    PENDING: 'text-yellow-400 bg-yellow-400/10',
    APPROVED: 'text-blue-400 bg-blue-400/10',
    DELIVERED: 'text-green-400 bg-green-400/10',
    REJECTED: 'text-red-400 bg-red-400/10',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift size={20} className="text-[#00E5FF]" />
          <h1 className="font-display text-2xl font-black tracking-wide text-white">REWARDS</h1>
        </div>
        {user?.role === 'ADMIN' && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 bg-[#111128] border border-[#2A2A4A] text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:border-[#00E5FF] transition">
            <Plus size={16} /> Tambah
          </button>
        )}
      </div>

      {/* Points balance */}
      <div className="bg-gradient-to-r from-[#111128] to-[#1a1a38] border border-[#2A2A4A] rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Poin Kamu</p>
          <p className="font-mono font-black text-3xl text-[#FFB800]">{user?.totalPoints?.toLocaleString('id-ID')}</p>
        </div>
        <Gift size={36} className="text-[#FFB800]/20" />
      </div>

      {/* Tabs */}
      <div className="flex bg-[#111128] border border-[#2A2A4A] rounded-xl p-1 gap-1">
        <button onClick={() => setTab('catalog')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === 'catalog' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-gray-400 hover:text-white'}`}>
          Katalog
        </button>
        <button onClick={() => setTab('history')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === 'history' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-gray-400 hover:text-white'}`}>
          Riwayat
        </button>
      </div>

      {/* Create Reward Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111128] border border-[#2A2A4A] rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">Tambah Reward</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateReward} className="space-y-3">
              <input type="text" value={newReward.name} onChange={e => setNewReward({...newReward, name: e.target.value})} placeholder="Nama reward" required
                className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00E5FF]" />
              <textarea value={newReward.description} onChange={e => setNewReward({...newReward, description: e.target.value})} placeholder="Deskripsi" rows={2} required
                className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00E5FF] resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={newReward.pointCost} onChange={e => setNewReward({...newReward, pointCost: e.target.value})} placeholder="Point Cost" required min={1}
                  className="bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00E5FF]" />
                <input type="number" value={newReward.stock} onChange={e => setNewReward({...newReward, stock: e.target.value})} placeholder="Stok" required min={0}
                  className="bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00E5FF]" />
              </div>
              <select value={newReward.category} onChange={e => setNewReward({...newReward, category: e.target.value})}
                className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00E5FF]">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" className="w-full bg-[#00E5FF]/20 border border-[#00E5FF]/30 text-[#00E5FF] font-bold py-2.5 rounded-lg hover:bg-[#00E5FF]/30 transition">
                SIMPAN
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Catalog */}
      {tab === 'catalog' && (
        loading ? (
          <div className="py-12 text-center text-gray-500">Memuat reward...</div>
        ) : (
          <div className="space-y-3">
            {rewards.map(r => (
              <div key={r.id} className="bg-[#111128] border border-[#2A2A4A] rounded-xl p-4 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center flex-shrink-0">
                  <Gift size={22} className="text-[#00E5FF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm">{r.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{r.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-mono font-bold text-[#FFB800]">{r.pointCost} pts</span>
                    <span className="text-xs text-gray-500">Stok: {r.stock}</span>
                    <span className="text-xs text-gray-600 bg-[#2A2A4A] px-2 py-0.5 rounded">{r.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRedeem(r)}
                  disabled={redeeming === r.id || r.stock < 1 || user?.totalPoints < r.pointCost}
                  className="flex-shrink-0 bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFB800] text-xs font-bold px-3 py-2 rounded-lg hover:bg-[#FFB800]/20 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  {redeeming === r.id ? '...' : r.stock < 1 ? 'Habis' : 'REDEEM'}
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* History */}
      {tab === 'history' && (
        redemptions.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Belum ada riwayat redemption</div>
        ) : (
          <div className="space-y-3">
            {redemptions.map(r => (
              <div key={r.id} className="bg-[#111128] border border-[#2A2A4A] rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm">{r.reward?.name}</h3>
                    {user?.role === 'ADMIN' && <p className="text-xs text-gray-400">{r.user?.name} · {r.user?.department}</p>}
                    <p className="text-xs text-gray-500 mt-1">{new Date(r.createdAt).toLocaleDateString('id-ID')}</p>
                    <p className="text-xs font-mono text-[#FFB800] mt-1">{r.reward?.pointCost} pts</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[r.status]}`}>{r.status}</span>
                </div>

                {user?.role === 'ADMIN' && r.status === 'PENDING' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleStatusUpdate(r.id, 'APPROVED')}
                      className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition">
                      Approve
                    </button>
                    <button onClick={() => handleStatusUpdate(r.id, 'REJECTED')}
                      className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition">
                      Reject
                    </button>
                  </div>
                )}
                {user?.role === 'ADMIN' && r.status === 'APPROVED' && (
                  <button onClick={() => handleStatusUpdate(r.id, 'DELIVERED')}
                    className="w-full mt-3 text-xs font-bold py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition">
                    Tandai Terkirim
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
