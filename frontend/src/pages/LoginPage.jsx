import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      setAuth(data.user, data.token);
      toast.success(`Selamat datang, ${data.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080814] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl font-black tracking-widest text-white">AMANDEL</h1>
          <p className="text-[#FF1721] text-xs tracking-[0.3em] font-bold mt-1">AXA MANDIRI PADEL CLUB</p>
        </div>

        <div className="bg-[#111128] border border-[#2A2A4A] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@axamandiri.co.id"
                required
                className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00008F] transition"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full bg-[#080814] border border-[#2A2A4A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00008F] transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00008F] hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'LOGIN'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-[#FFB800] hover:underline">Daftar</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-8">
          Komunitas tertutup AXA Mandiri · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
