import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const DEPARTMENTS = ['Actuarial', 'Finance', 'Underwriting', 'Sales', 'Marketing', 'IT', 'HR', 'Legal', 'Operations', 'Compliance', 'Lainnya'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { inviteCode: paramCode } = useParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [method, setMethod] = useState(paramCode ? 'invite' : null);
  const [form, setForm] = useState({
    name: '', email: '', employeeId: '', password: '', department: '', phone: '',
    inviteCode: paramCode || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (method === 'invite') delete payload.employeeId;
      const { data } = await api.post('/api/auth/register', payload);
      setAuth(data.user, data.token);
      toast.success('Akun berhasil dibuat!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  if (!method) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080814] px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="font-display text-5xl font-black tracking-widest text-white">AMANDEL</h1>
            <p className="text-[#FF1721] text-xs tracking-[0.3em] font-bold mt-1">AXA MANDIRI PADEL CLUB</p>
          </div>
          <div className="bg-[#111128] border border-[#2A2A4A] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-2">Bergabung ke Komunitas</h2>
            <p className="text-gray-400 text-sm mb-6">Platform ini hanya untuk karyawan AXA Mandiri.</p>
            <div className="space-y-3">
              <button
                onClick={() => setMethod('employee')}
                className="w-full bg-[#00008F] hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition"
              >
                🏢 Saya Karyawan AXA Mandiri
              </button>
              <button
                onClick={() => setMethod('invite')}
                className="w-full bg-[#111128] border border-[#2A2A4A] hover:border-[#FFB800] text-white font-bold py-3 rounded-lg transition"
              >
                🎟️ Punya Invite Code
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-[#FFB800] hover:underline">Login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080814] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-black tracking-widest text-white">AMANDEL</h1>
          <p className="text-[#FF1721] text-xs tracking-[0.3em] font-bold mt-1">AXA MANDIRI PADEL CLUB</p>
        </div>

        <div className="bg-[#111128] border border-[#2A2A4A] rounded-2xl p-8">
          <button onClick={() => setMethod(null)} className="text-gray-500 text-sm mb-4 hover:text-white">← Kembali</button>
          <h2 className="text-xl font-bold text-white mb-6">
            {method === 'employee' ? '🏢 Registrasi Karyawan' : '🎟️ Registrasi dengan Invite Code'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Nama Lengkap</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00008F]" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Email {method === 'employee' ? '(AXA Mandiri)' : ''}</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
                placeholder={method === 'employee' ? 'nama@axamandiri.co.id' : 'email kamu'}
                className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00008F]" />
            </div>

            {method === 'employee' && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">Employee ID</label>
                <input type="text" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} required
                  placeholder="AXA-0001"
                  className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00008F]" />
              </div>
            )}

            {method === 'invite' && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">Invite Code</label>
                <input type="text" value={form.inviteCode} onChange={e => setForm({...form, inviteCode: e.target.value})} required
                  placeholder="AMANDEL2025"
                  className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00008F] uppercase" />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 block mb-1">Departemen</label>
              <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} required
                className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00008F]">
                <option value="">Pilih departemen</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">No. HP (opsional)</label>
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                placeholder="08xx-xxxx-xxxx"
                className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00008F]" />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required
                placeholder="Min. 8 karakter"
                className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00008F]" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#FF1721] hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 mt-2">
              {loading ? 'Mendaftar...' : 'DAFTAR SEKARANG'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
