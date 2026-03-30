'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Activity, Contact, Deal } from '@/types';

const TYPES = ['call','email','meeting','note'] as const;
const ICONS: Record<string, string> = { call:'📞', email:'✉️', meeting:'🤝', note:'📝' };

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [contacts,   setContacts]   = useState<Contact[]>([]);
  const [deals,      setDeals]      = useState<Deal[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [form, setForm] = useState({ type:'call' as const, notes:'', deal_id:'', contact_id:'' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/activities'), api.get('/contacts'), api.get('/deals')])
      .then(([a, c, d]) => { setActivities(a.data); setContacts(c.data); setDeals(d.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const { data } = await api.post('/activities', {
        ...form, deal_id: form.deal_id || null, contact_id: form.contact_id || null
      });
      setActivities(prev => [data, ...prev]);
      setShowModal(false);
      setForm({ type:'call', notes:'', deal_id:'', contact_id:'' });
    } catch (err: any) { setError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:'var(--text-primary)' }}>Activities</h1>
          <p className="text-sm mt-0.5" style={{ color:'var(--text-secondary)' }}>All calls, emails, meetings, and notes</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Log Activity</button>
      </div>

      <div className="space-y-3">
        {loading
          ? <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor:'var(--accent)', borderTopColor:'transparent' }} /></div>
          : activities.length === 0
            ? (
                <div className="card p-12 text-center">
                  <p className="text-4xl mb-3">📋</p>
                  <p className="font-semibold" style={{ color:'var(--text-primary)' }}>No activities yet</p>
                  <p className="text-sm mt-1" style={{ color:'var(--text-secondary)' }}>Log your first call, email, or meeting.</p>
                </div>
              )
            : activities.map((a, i) => (
                <div key={a.id} className="card p-4 flex items-start gap-4 animate-slide-in" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                       style={{ background:'var(--bg-secondary)' }}>
                    {ICONS[a.type] || '◉'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge type-${a.type}`}>{a.type}</span>
                      {a.deal_title && <span className="text-xs" style={{ color:'var(--text-secondary)' }}>→ {a.deal_title}</span>}
                      {a.contact_name && <span className="text-xs" style={{ color:'var(--text-secondary)' }}>@ {a.contact_name}</span>}
                    </div>
                    {a.notes && <p className="text-sm mt-1" style={{ color:'var(--text-primary)' }}>{a.notes}</p>}
                    <p className="text-xs mt-1" style={{ color:'var(--text-secondary)' }}>
                      by {a.created_by_name || 'Unknown'} · {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
        }
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-5" style={{ color:'var(--text-primary)' }}>Log Activity</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--text-secondary)' }}>Type*</label>
                <select className="select" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                  {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--text-secondary)' }}>Contact (optional)</label>
                <select className="select" value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})}>
                  <option value="">None</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--text-secondary)' }}>Deal (optional)</label>
                <select className="select" value={form.deal_id} onChange={e => setForm({...form, deal_id: e.target.value})}>
                  <option value="">None</option>
                  {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--text-secondary)' }}>Notes</label>
                <textarea className="input" rows={3} placeholder="What happened?" value={form.notes}
                          onChange={e => setForm({...form, notes: e.target.value})}
                          style={{ resize:'none', minHeight:'80px' }} />
              </div>
              {error && <p className="text-sm" style={{ color:'#f87171' }}>{error}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Log Activity'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
