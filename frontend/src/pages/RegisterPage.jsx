import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Building2, Ticket, Loader2, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const DEPARTMENTS = ['Actuarial','Finance','Underwriting','Sales','Marketing','IT','HR','Legal','Operations','Compliance','Lainnya'];

function BgDecor() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute top-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, #00008F, #FF1721, #FFB800)' }} />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, #1414FF 0%, transparent 65%)' }} />
      <div className="absolute inset-0 opacity-[0.015]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { inviteCode: paramCode } = useParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [method, setMethod] = useState(paramCode ? 'invite' : null);
  const [form, setForm] = useState({ name:'', email:'', employeeId:'', password:'', department:'', phone:'', inviteCode: paramCode || '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

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

  /* ── Method selection ── */
  if (!method) return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#07070F] px-5 relative overflow-hidden">
      <BgDecor />
      <div className="w-full max-w-sm relative animate-fadeUp">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'rgba(20,20,255,0.12)', border: '1px solid rgba(20,20,255,0.25)' }}>
            <span className="text-3xl">🏓</span>
          </div>
          <h1 className="font-display text-[44px] font-black tracking-[0.12em] text-white leading-none">AMANDEL</h1>
          <p className="text-[#FF1721] text-[9px] tracking-[0.35em] font-bold mt-1.5">AXA MANDIRI PADEL CLUB</p>
        </div>

        <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-[18px] font-bold text-white mb-1">Bergabung ke komunitas</h2>
          <p className="text-[#8888AA] text-[13px] mb-6">Platform eksklusif karyawan AXA Mandiri</p>

          <div className="space-y-3">
            <button onClick={() => setMethod('employee')}
              className="pressable w-full flex items-center gap-4 p-4 rounded-2xl text-left transition hover:border-white/20"
              style={{ background: 'rgba(20,20,255,0.08)', border: '1px solid rgba(20,20,255,0.2)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(20,20,255,0.15)' }}>
                <Building2 size={20} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">Karyawan AXA Mandiri</p>
                <p className="text-[12px] text-[#8888AA] mt-0.5">Gunakan email axamandiri.co.id</p>
              </div>
              <ArrowRight size={16} className="text-gray-600" />
            </button>

            <button onClick={() => setMethod('invite')}
              className="pressable w-full flex items-center gap-4 p-4 rounded-2xl text-left transition hover:border-white/15"
              style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,184,0,0.12)' }}>
                <Ticket size={20} className="text-[#FFB800]" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">Punya Invite Code</p>
                <p className="text-[12px] text-[#8888AA] mt-0.5">Diundang oleh anggota komunitas</p>
              </div>
              <ArrowRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        <p className="text-center text-[13px] text-[#8888AA] mt-6">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-[#FFB800] font-semibold hover:text-yellow-300 transition">Masuk</Link>
        </p>
      </div>
    </div>
  );

  /* ── Registration form ── */
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#07070F] px-5 py-10 relative overflow-hidden">
      <BgDecor />
      <div className="w-full max-w-sm relative animate-fadeUp">
        <button onClick={() => setMethod(null)}
          className="flex items-center gap-2 text-[#8888AA] text-sm font-medium mb-6 pressable hover:text-white transition">
          <ArrowLeft size={16} /> Kembali
        </button>

        <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: method === 'employee' ? 'rgba(20,20,255,0.15)' : 'rgba(255,184,0,0.12)' }}>
              {method === 'employee' ? <Building2 size={18} className="text-blue-400" /> : <Ticket size={18} className="text-[#FFB800]" />}
            </div>
            <div>
              <h2 className="font-bold text-white text-[16px]">
                {method === 'employee' ? 'Registrasi Karyawan' : 'Registrasi via Invite'}
              </h2>
              <p className="text-[11px] text-[#8888AA]">Buat akun baru Anda</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Nama Lengkap</label>
              <input type="text" value={form.name} onChange={set('name')} required placeholder="Nama lengkap" className="input-base" />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">
                Email {method === 'employee' ? '(AXA Mandiri)' : ''}
              </label>
              <input type="email" value={form.email} onChange={set('email')} required
                placeholder={method === 'employee' ? 'nama@axamandiri.co.id' : 'email kamu'}
                className="input-base" />
            </div>

            {method === 'employee' && (
              <div>
                <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Employee ID</label>
                <input type="text" value={form.employeeId} onChange={set('employeeId')} required placeholder="AXA-0001" className="input-base" />
              </div>
            )}

            {method === 'invite' && (
              <div>
                <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Invite Code</label>
                <input type="text" value={form.inviteCode} onChange={set('inviteCode')} required
                  placeholder="AMANDEL2025" className="input-base uppercase tracking-widest font-mono" />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Departemen</label>
              <select value={form.department} onChange={set('department')} required className="input-base appearance-none">
                <option value="">Pilih departemen</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">No. HP <span className="text-gray-600 normal-case">(opsional)</span></label>
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="08xx-xxxx-xxxx" className="input-base" />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={set('password')} required placeholder="Min. 8 karakter" className="input-base" />
            </div>

            <button type="submit" disabled={loading}
              className="pressable w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl mt-2 transition disabled:opacity-60"
              style={{ background: loading ? 'rgba(255,23,33,0.5)' : 'linear-gradient(135deg, #FF1721 0%, #CC0010 100%)' }}>
              {loading ? <Loader2 size={18} className="animate-spin-slow" /> : <>Daftar Sekarang <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-[#8888AA] mt-6">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-[#FFB800] font-semibold">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
