'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Contact } from '@/types';

const STATUSES = ['lead','prospect','customer','churned'] as const;

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]     = useState('');
  const [form, setForm]         = useState({ name:'', email:'', phone:'', company:'', status:'lead' as const });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = (q?: string) => {
    setLoading(true);
    api.get('/contacts', { params: q ? { search: q } : {} })
      .then(r => setContacts(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(search); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const { data } = await api.post('/contacts', form);
      setContacts(prev => [data, ...prev]);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', company: '', status: 'lead' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create contact');
    } finally { setSaving(false); }
  };

  const fmt = (v?: number) => v ? new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(v) : '—';

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:'var(--text-primary)' }}>Contacts</h1>
          <p className="text-sm mt-0.5" style={{ color:'var(--text-secondary)' }}>{contacts.length} contacts in your workspace</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Contact</button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input className="input max-w-xs" placeholder="Search by name, email, company…" value={search}
               onChange={e => setSearch(e.target.value)} />
        <button type="submit" className="btn-ghost">Search</button>
        {search && <button type="button" className="btn-ghost" onClick={() => { setSearch(''); load(); }}>Clear</button>}
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="grid text-xs font-semibold uppercase tracking-wider px-5 py-3 border-b"
             style={{ gridTemplateColumns:'2fr 1.5fr 1.5fr 1fr 1fr', borderColor:'var(--border)', color:'var(--text-secondary)', background:'var(--bg-secondary)' }}>
          <span>Name</span><span>Company</span><span>Email</span><span>Status</span><span>Deals</span>
        </div>
        {loading
          ? <div className="p-8 text-center text-sm" style={{ color:'var(--text-secondary)' }}>Loading…</div>
          : contacts.length === 0
            ? <div className="p-8 text-center text-sm" style={{ color:'var(--text-secondary)' }}>No contacts found. Add your first one!</div>
            : contacts.map(c => (
                <div key={c.id} className="table-row grid items-center px-5 py-3.5 text-sm"
                     style={{ gridTemplateColumns:'2fr 1.5fr 1.5fr 1fr 1fr' }}>
                  <div>
                    <p className="font-semibold" style={{ color:'var(--text-primary)' }}>{c.name}</p>
                  </div>
                  <span style={{ color:'var(--text-secondary)' }}>{c.company || '—'}</span>
                  <span style={{ color:'var(--text-secondary)' }} className="truncate">{c.email || '—'}</span>
                  <span className={`badge status-${c.status}`}>{c.status}</span>
                  <span style={{ color:'var(--text-secondary)' }}>
                    {c.deals_count ?? 0} · {fmt(c.total_deal_value)}
                  </span>
                </div>
              ))
        }
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-5" style={{ color:'var(--text-primary)' }}>Add Contact</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--text-secondary)' }}>Full Name*</label>
                <input className="input" placeholder="Jane Smith" value={form.name}
                       onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--text-secondary)' }}>Email</label>
                <input className="input" type="email" placeholder="jane@company.com" value={form.email}
                       onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--text-secondary)' }}>Phone</label>
                  <input className="input" placeholder="+1 555 0000" value={form.phone}
                         onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--text-secondary)' }}>Company</label>
                  <input className="input" placeholder="Acme Inc" value={form.company}
                         onChange={e => setForm({...form, company: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--text-secondary)' }}>Status</label>
                <select className="select" value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              {error && <p className="text-sm" style={{ color:'#f87171' }}>{error}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create Contact'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
