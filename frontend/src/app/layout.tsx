import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nexus CRM – Multi-Tenant CRM Platform',
  description: 'Enterprise-grade multi-tenant CRM SaaS. Manage your contacts, deals, and sales pipeline with full tenant isolation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
