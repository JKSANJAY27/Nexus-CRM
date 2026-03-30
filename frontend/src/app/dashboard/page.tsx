'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DashboardData } from '@/types';

const STAGE_LABELS: Record<string, string> = {
  prospecting: 'Prospecting', qualification: 'Qualification', proposal: 'Proposal',
  negotiation: 'Negotiation', closed_won: 'Closed Won', closed_lost: 'Closed Lost',
};

const ACTIVITY_ICONS: Record<string, string> = { call: '📞', email: '✉️', meeting: '🤝', note: '📝' };

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  const stats = [
    { label: 'Total Contacts', value: data?.metrics.total_contacts ?? 0, icon: '◎', gradient: 'stat-gradient-indigo', color: '#818cf8' },
    { label: 'Active Deals',   value: data?.metrics.total_deals ?? 0,    icon: '◆', gradient: 'stat-gradient-blue',   color: '#60a5fa' },
    { label: 'Revenue Won',    value: fmt(data?.metrics.total_revenue ?? 0), icon: '✦', gradient: 'stat-gradient-emerald', color: '#34d399' },
    { label: 'Pipeline Value', value: fmt(data?.metrics.pipeline_value ?? 0), icon: '◈', gradient: 'stat-gradient-amber', color: '#fbbf24' },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Overview</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Your CRM dashboard at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`card p-5 ${s.gradient}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
              <span className="text-2xl opacity-60" style={{ color: s.color }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Sales Pipeline</h2>
          {(data?.pipeline_by_stage ?? []).length === 0
            ? <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No deals yet. Create your first deal!</p>
            : (data?.pipeline_by_stage ?? []).map((s, i) => {
                const pct = Math.round((parseInt(s.count) / (data?.metrics.total_deals || 1)) * 100);
                return (
                  <div key={i} className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: 'var(--text-primary)' }}>{STAGE_LABELS[s.stage] || s.stage}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{s.count} · {fmt(parseFloat(s.total_value))}</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'var(--border)' }}>
                      <div className="h-2 rounded-full transition-all duration-700"
                           style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* Recent Activities */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
          {(data?.recent_activities ?? []).length === 0
            ? <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No activities yet.</p>
            : (data?.recent_activities ?? []).map((a, i) => (
                <div key={i} className="flex gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                       style={{ background: 'var(--bg-secondary)' }}>
                    {ACTIVITY_ICONS[a.type] ?? '◉'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {a.created_by_name} · {a.notes || a.type}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {a.deal_title || a.contact_name || '—'} · {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
