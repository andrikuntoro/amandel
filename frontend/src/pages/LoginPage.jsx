import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      setAuth(data.user, data.token);
      toast.success(`Selamat datang, ${data.user.name.split(' ')[0]}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#07070F] px-5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background: 'linear-gradient(90deg, #00008F, #FF1721, #FFB800)' }} />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #1414FF 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #FFB800 0%, transparent 70%)' }} />
        {/* Court grid lines */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="w-full max-w-sm relative animate-fadeUp">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'rgba(20,20,255,0.12)', border: '1px solid rgba(20,20,255,0.25)' }}>
            <span className="text-3xl">🏓</span>
          </div>
          <h1 className="font-display text-[44px] font-black tracking-[0.12em] text-white leading-none">AMANDEL</h1>
          <p className="text-[#FF1721] text-[9px] tracking-[0.35em] font-bold mt-1.5">AXA MANDIRI PADEL CLUB</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-[18px] font-bold text-white mb-1">Masuk ke akun</h2>
          <p className="text-[#8888AA] text-[13px] mb-6">Komunitas tertutup AXA Mandiri</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@axamandiri.co.id"
                required
                className="input-base"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="input-base pr-11"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="pressable w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl mt-2 transition disabled:opacity-60"
              style={{ background: loading ? 'rgba(20,20,255,0.5)' : 'linear-gradient(135deg, #1414FF 0%, #0000CC 100%)' }}>
              {loading
                ? <Loader2 size={18} className="animate-spin-slow" />
                : <>Masuk <ArrowRight size={16} /></>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-[#8888AA] mt-6">
          Belum punya akun?{' '}
          <Link to="/register" className="text-[#FFB800] font-semibold hover:text-yellow-300 transition">
            Daftar sekarang
          </Link>
        </p>

        <p className="text-center text-[11px] text-gray-700 mt-8">
          © {new Date().getFullYear()} AXA Mandiri · Amandel Padel Club
        </p>
      </div>
    </div>
  );
}
