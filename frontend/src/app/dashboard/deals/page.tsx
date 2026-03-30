'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Deal, Contact, DealStage } from '@/types';

const STAGES: DealStage[] = ['prospecting','qualification','proposal','negotiation','closed_won','closed_lost'];
const STAGE_LABELS: Record<string, string> = {
  prospecting:'Prospecting', qualification:'Qualification', proposal:'Proposal',
  negotiation:'Negotiation', closed_won:'Closed Won', closed_lost:'Closed Lost',
};

export default function DealsPage() {
  const [deals,    setDeals]    = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ contact_id:'', title:'', value:'', stage:'prospecting' as DealStage });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/deals'), api.get('/contacts')])
      .then(([d, c]) => { setDeals(d.data); setContacts(c.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const { data } = await api.post('/deals', { ...form, value: parseFloat(form.value) || 0 });
      setDeals(prev => [data, ...prev]);
      setShowModal(false);
      setForm({ contact_id:'', title:'', value:'', stage:'prospecting' });
    } catch (err: any) { setError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const moveStage = async (deal: Deal, stage: DealStage) => {
    const updated = await api.put(`/deals/${deal.id}`, { stage });
    setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage } : d));
  };

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(v);

  // Group by stage for kanban
  const byStage = STAGES.reduce((acc, s) => ({ ...acc, [s]: deals.filter(d => d.stage === s) }), {} as Record<DealStage, Deal[]>);

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:'var(--text-primary)' }}>Deals</h1>
          <p className="text-sm mt-0.5" style={{ color:'var(--text-secondary)' }}>{deals.length} deals · {fmt(deals.reduce((s, d) => s + Number(d.value), 0))} pipeline</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Deal</button>
      </div>

      {loading
        ? <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor:'var(--accent)', borderTopColor:'transparent' }} /></div>
        : (
          /* Kanban board — horizontal scroll */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map(stage => (
              <div key={stage} className="shrink-0 w-64">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`badge stage-${stage}`}>{STAGE_LABELS[stage]}</span>
                  <span className="text-xs" style={{ color:'var(--text-secondary)' }}>({byStage[stage].length})</span>
                </div>
                <div className="space-y-2">
                  {byStage[stage].length === 0
                    ? <div className="card p-4 text-center text-xs" style={{ color:'var(--text-secondary)', borderStyle:'dashed' }}>Empty</div>
                    : byStage[stage].map(deal => (
                        <div key={deal.id} className="card p-4 cursor-pointer">
                          <p className="font-semibold text-sm mb-1" style={{ color:'var(--text-primary)' }}>{deal.title}</p>
                          <p className="text-xs mb-2" style={{ color:'var(--text-secondary)' }}>{deal.contact_name || '—'}</p>
                          <p className="font-bold text-sm" style={{ color:'#34d399' }}>{fmt(Number(deal.value))}</p>
                          {/* Quick stage move */}
                          <select className="select text-xs mt-2 py-1" value={deal.stage}
                                  onChange={e => moveStage(deal, e.target.value as DealStage)}>
                            {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                          </select>
                        </div>
                      ))
                  }
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Create Deal Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-5" style={{ color:'var(--text-primary)' }}>New Deal</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--text-secondary)' }}>Contact*</label>
                <select className="select" value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})} required>
                  <option value="">Select a contact…</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color:'var(--text-secondary)' }}>Deal Title*</label>
                <input className="input" placeholder="Enterprise License Q2" value={form.title}
                       onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--text-secondary)' }}>Value (USD)</label>
                  <input className="input" type="number" placeholder="25000" value={form.value}
                         onChange={e => setForm({...form, value: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color:'var(--text-secondary)' }}>Stage</label>
                  <select className="select" value={form.stage} onChange={e => setForm({...form, stage: e.target.value as DealStage})}>
                    {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              {error && <p className="text-sm" style={{ color:'#f87171' }}>{error}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Deal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
