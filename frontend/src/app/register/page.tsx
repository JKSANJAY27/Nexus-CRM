'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ companyName: '', slug: '', adminName: '', adminEmail: '', adminPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register-tenant', form);
      localStorage.setItem('nexus_token', data.token);
      localStorage.setItem('nexus_user',   JSON.stringify(data.user));
      localStorage.setItem('nexus_tenant', JSON.stringify(data.tenant));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
               style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', boxShadow: '0 0 32px rgba(99,102,241,0.4)' }}>
            <span className="text-2xl font-black text-white">N</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create your Workspace</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">Get your CRM up in 30 seconds</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Company Name</label>
              <input className="input" placeholder="Acme Corporation" value={form.companyName}
                     onChange={e => setForm({ ...form, companyName: e.target.value, slug: autoSlug(e.target.value) })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Workspace Slug <span className="text-xs ml-1" style={{ color: '#818cf8' }}>(unique URL identifier)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>nexus.app/</span>
                <input className="input flex-1" placeholder="acme-corporation" value={form.slug}
                       onChange={e => setForm({ ...form, slug: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Your Name</label>
              <input className="input" placeholder="John Smith" value={form.adminName}
                     onChange={e => setForm({ ...form, adminName: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Work Email</label>
              <input className="input" type="email" placeholder="john@acme.com" value={form.adminEmail}
                     onChange={e => setForm({ ...form, adminEmail: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input className="input" type="password" placeholder="Min 8 characters" value={form.adminPassword}
                     onChange={e => setForm({ ...form, adminPassword: e.target.value })} required minLength={8} />
            </div>

            {error && (
              <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button className="btn-primary w-full py-3" type="submit" disabled={loading}>
              {loading ? 'Creating workspace...' : 'Create Workspace →'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            Already have a workspace?{' '}
            <Link href="/login" className="font-semibold" style={{ color: '#818cf8' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
