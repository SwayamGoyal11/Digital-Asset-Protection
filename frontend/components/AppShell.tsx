'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';

const NAV = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/alerts',    icon: '🚨', label: 'Alerts' },
  { href: '/users',     icon: '👤', label: 'Users' },
  { href: '/geo',       icon: '🌍', label: 'Geo Map' },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    setEmail(localStorage.getItem('ag_email') || '');
  }, []);

  function logout() {
    localStorage.clear();
    router.push('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        background: 'rgba(5,8,16,0.8)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', padding: '0 4px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 0 20px rgba(59,130,246,0.3)',
          }}>🛡️</div>
          <div>
            <p className="gradient-text" style={{ fontWeight: 800, fontSize: '14px', lineHeight: 1 }}>Antigravity AI</p>
            <p style={{ color: '#334155', fontSize: '10px' }}>v1.0.0</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${pathname.startsWith(href) ? 'active' : ''}`}
            >
              <span style={{ fontSize: '16px' }}>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
          <div style={{ padding: '8px 10px', marginBottom: '8px' }}>
            <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email || 'Analyst'}
            </p>
            <p style={{ color: '#475569', fontSize: '10px' }}>Security Analyst</p>
          </div>
          <button
            onClick={logout}
            className="nav-item"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
