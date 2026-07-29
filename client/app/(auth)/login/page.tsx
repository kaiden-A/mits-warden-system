'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      router.replace(user.role === 'admin' ? '/overview' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink"
      style={{
        background: 'radial-gradient(1200px 600px at 20% -10%, #2A3348 0%, transparent 60%), #1E2430',
      }}>
      <div className="w-full max-w-sm bg-paper-raised rounded-lg shadow-[0_1px_2px_rgba(30,20,10,0.08),0_8px_24px_rgba(30,20,10,0.06)] p-9 pt-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-11 h-11 border-2 border-brass rounded-full flex items-center justify-center font-heading font-black text-lg text-brass-deep mb-2">
            LT
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-text">Log Tugas</h1>
          <p className="text-xs text-dim-text font-mono uppercase tracking-wider mt-0.5">Laporan Harian &amp; Semakan</p>
          <p className="text-[0.62rem] text-brass-deep font-mono uppercase tracking-wider mt-1.5 font-semibold">Maahad Integrasi Tahfiz Klang (MITS)</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Emel</label>
            <input type="email" required placeholder="nama@example.com" value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-paper-line rounded-md bg-white text-ink-text text-sm outline-none focus-visible:border-brass transition-colors" />
          </div>

          <div className="mb-4">
            <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Kata Laluan</label>
            <input type="password" required placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-paper-line rounded-md bg-white text-ink-text text-sm outline-none focus-visible:border-brass transition-colors" />
          </div>

          {error && (
            <p className="text-xs text-red mb-3">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 px-4 bg-ink text-paper rounded-md text-sm font-semibold tracking-wide transition-colors hover:bg-ink-soft disabled:opacity-60">
            {loading ? 'Memproses…' : 'Daftar Masuk'}
          </button>
        </form>

        <p className="text-[0.58rem] text-dim-text font-mono text-center mt-5 pt-4 border-t border-paper-line">
          Powered by Motion-U · Developed &amp; maintained by Kaiden-A
        </p>
      </div>
    </div>
  );
}
