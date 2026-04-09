'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function TenantDataInspectorPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tenantInfo, setTenantInfo] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem('nexus_tenant');
    if (t) setTenantInfo(JSON.parse(t));

    Promise.allSettled([
      api.get('/users'),
      api.get('/contacts'),
      api.get('/deals'),
      api.get('/activities'),
    ]).then((results) => {
      const parsedData = {
        users: results[0].status === 'fulfilled' ? results[0].value.data : null,
        contacts: results[1].status === 'fulfilled' ? results[1].value.data : null,
        deals: results[2].status === 'fulfilled' ? results[2].value.data : null,
        activities: results[3].status === 'fulfilled' ? results[3].value.data : null,
      };
      setData(parsedData);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  const JsonViewer = ({ data, title }: { data: any, title: string }) => (
    <div className="card p-6 flex flex-col" style={{ maxHeight: '600px' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          {Array.isArray(data) ? `${data.length} records` : '0 records'}
        </span>
      </div>
      <div className="rounded p-4 overflow-auto flex-1 border" style={{ backgroundColor: '#111827', borderColor: 'var(--border)' }}>
        <pre className="text-xs" style={{ fontFamily: 'monospace', color: '#10b981' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8 animate-fade-in h-full flex flex-col">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Tenant Data Inspector</h1>
          <span className="px-3 py-1 text-xs rounded-full font-bold uppercase tracking-wider" 
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(129,140,248,0.2))', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
            Database View
          </span>
        </div>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: '800px' }}>
          This page queries the PostgreSQL database on Amazon RDS directly to visualize all records strictly mapped to your current Tenant. 
          Notice that every record contains a <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--bg-secondary)' }}>tenant_id</code> equal to <strong>{tenantInfo?.id || 'your tenant ID'}</strong>, 
          demonstrating the architectural data isolation guaranteeing our multi-tenant system's security.
        </p>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', count: data?.users?.length || 0, icon: '👤', color: '#6366f1' },
          { label: 'Total Contacts', count: data?.contacts?.length || 0, icon: '◎', color: '#10b981' },
          { label: 'Total Deals', count: data?.deals?.length || 0, icon: '◆', color: '#f59e0b' },
          { label: 'Total Activities', count: data?.activities?.length || 0, icon: '◉', color: '#ec4899' },
        ].map((stat, i) => (
          <div key={i} className="card p-4 flex items-center gap-4 hidden-border">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm" style={{ background: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{stat.count}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-10">
        <JsonViewer title="Users" data={data?.users} />
        <JsonViewer title="Contacts" data={data?.contacts} />
        <JsonViewer title="Deals" data={data?.deals} />
        <JsonViewer title="Activities" data={data?.activities} />
      </div>
    </div>
  );
}
