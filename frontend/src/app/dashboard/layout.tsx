'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tenant, User } from '@/types';

const NAV = [
  { href: '/dashboard',            icon: '◈', label: 'Overview'   },
  { href: '/dashboard/contacts',   icon: '◎', label: 'Contacts'   },
  { href: '/dashboard/deals',      icon: '◆', label: 'Deals'      },
  { href: '/dashboard/activities', icon: '◉', label: 'Activities' },
  { href: '/dashboard/tenant-data', icon: '▦', label: 'Inspector' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user,   setUser]   = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('nexus_token');
    if (!token) { router.push('/login'); return; }
    const u = localStorage.getItem('nexus_user');
    const t = localStorage.getItem('nexus_tenant');
    if (u) setUser(JSON.parse(u));
    if (t) setTenant(JSON.parse(t));
  }, [router]);

  const logout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent mx-auto mb-3 animate-spin"
             style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Loading…</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside className="flex flex-col w-64 border-r" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>
              N
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>Nexus CRM</p>
              <p className="text-xs truncate" style={{ color: 'var(--accent)' }}>{tenant?.name}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, icon, label }) => (
            <Link key={href} href={href}
                  className={`nav-item ${pathname === href ? 'active' : ''}`}>
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                 style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.role}</p>
            </div>
          </div>
          <button onClick={logout} className="btn-ghost w-full text-left text-xs">
            ↩ Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
