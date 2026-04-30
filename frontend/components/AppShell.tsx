'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';
import { LayoutDashboard, ShieldAlert, Users, Globe, Search, Bell, LogOut, Shield } from 'lucide-react';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/alerts',    icon: ShieldAlert, label: 'Alerts' },
  { href: '/users',     icon: Users, label: 'Users' },
  { href: '/geo',       icon: Globe, label: 'Geo Map' },
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
    <div className="flex min-h-screen bg-transparent text-slate-100 overflow-hidden relative">
      {/* Sidebar */}
      <aside className="w-[260px] shrink-0 border-r border-white/5 bg-[#090d16]/80 backdrop-blur-2xl flex flex-col p-6 sticky top-0 h-screen z-50 shadow-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 px-1">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-white/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-lg leading-none tracking-tight gradient-text">VaultX</p>
            <p className="text-slate-500 text-xs mt-1 font-medium">Enterprise Edition</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-2">
          {NAV.map(({ href, icon: Icon, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-1/2 bg-blue-500 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-white/10 pt-6 mt-4">
          <div className="px-3 mb-4">
            <p className="text-slate-300 text-sm font-medium truncate">{email || 'Analyst'}</p>
            <p className="text-slate-500 text-xs">Security Analyst</p>
          </div>
          <button
            onClick={logout}
            className="w-full nav-item text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 bg-[#090d16]/50 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-8">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search assets, IP addresses, or users..." 
              className="w-full bg-black/20 border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border border-white/20 shadow-md" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
