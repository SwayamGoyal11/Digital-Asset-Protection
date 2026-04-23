'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getDeviceId } from '@/lib/fingerprint';
import { createBiometricCapture } from '@/lib/biometrics';
import { loginUser, register } from '@/lib/api';
import NeonButton from '@/components/ui/NeonButton';
import RiskBadge from '@/components/ui/RiskBadge';
import type { LoginResponse } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [result, setResult]     = useState<LoginResponse | null>(null);
  const captureRef = useRef<ReturnType<typeof createBiometricCapture> | null>(null);

  // Start biometric capture when component mounts
  useEffect(() => {
    captureRef.current = createBiometricCapture(document);
    captureRef.current.start();
    return () => { captureRef.current?.stop(); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const behavior = captureRef.current?.stop();

      if (mode === 'register') {
        await register(email, password);
        setMode('login');
        setError('');
        setLoading(false);
        return;
      }

      const deviceId = await getDeviceId();
      const response = await loginUser({
        email,
        password,
        device_id: deviceId,
        user_agent: navigator.userAgent,
        behavior,
      });

      localStorage.setItem('ag_token', response.access_token);
      localStorage.setItem('ag_user_id', String(response.user_id));
      localStorage.setItem('ag_email', response.email);

      setResult(response);

      // Auto-redirect after showing result
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
      // Restart capture
      captureRef.current = createBiometricCapture(document);
      captureRef.current.start();
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}
          >
            <div style={{
              width: '48px', height: '48px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 0 30px rgba(59,130,246,0.4)',
            }}>
              🛡️
            </div>
            <div style={{ textAlign: 'left' }}>
              <h1 className="gradient-text" style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1 }}>
                Antigravity AI
              </h1>
              <p style={{ color: '#475569', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>
                Identity Intelligence
              </p>
            </div>
          </motion.div>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            {mode === 'login' ? 'Secure access with biometric verification' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div className="glass" style={{ padding: '32px' }}>
          {/* Tab toggle */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '4px', marginBottom: '28px' }}>
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setResult(null); }}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: mode === m ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: mode === m ? '#60a5fa' : '#475569',
                  fontWeight: mode === m ? 600 : 400,
                  fontSize: '13px',
                  transition: 'all 0.2s',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@demo.com"
                required
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', color: '#f1f5f9',
                  fontSize: '14px', outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', color: '#f1f5f9',
                  fontSize: '14px', outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#f87171',
                    fontSize: '13px',
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <NeonButton type="submit" loading={loading} fullWidth>
              {mode === 'login' ? '🔐 Authenticate' : '✨ Create Account'}
            </NeonButton>
          </form>

          {/* Demo hint */}
          <div style={{
            marginTop: '20px',
            padding: '12px', background: 'rgba(59,130,246,0.05)',
            borderRadius: '8px', border: '1px solid rgba(59,130,246,0.15)',
          }}>
            <p style={{ color: '#475569', fontSize: '11px', marginBottom: '6px', fontWeight: 600 }}>DEMO ACCOUNTS</p>
            {[
              { email: 'alice@demo.com',   label: '🟢 Normal user' },
              { email: 'bob@demo.com',     label: '🟡 New device' },
              { email: 'charlie@demo.com', label: '🔴 Bot simulation' },
              { email: 'diana@demo.com',   label: '🟣 Geo anomaly' },
            ].map(({ email: e, label }) => (
              <button
                key={e}
                onClick={() => { setEmail(e); setPassword('password123'); setMode('login'); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#60a5fa', fontSize: '11px', padding: '2px 0',
                  transition: 'color 0.2s',
                }}
                onMouseOver={(ev) => (ev.currentTarget.style.color = '#93c5fd')}
                onMouseOut={(ev) => (ev.currentTarget.style.color = '#60a5fa')}
              >
                {label} · {e}
              </button>
            ))}
          </div>
        </div>

        {/* Risk result overlay */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                marginTop: '16px',
                background: 'rgba(10,15,30,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '20px',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Risk Assessment</span>
                <RiskBadge level={result.risk_level} score={result.risk_score} />
              </div>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '12px', lineHeight: 1.5 }}>
                {result.summary}
              </p>
              {result.factors.slice(0, 3).map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '12px' }}>
                  <span style={{ color: '#94a3b8' }}>{f.reason}</span>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>+{f.impact}</span>
                </div>
              ))}
              <p style={{ color: '#3b82f6', fontSize: '11px', marginTop: '10px', textAlign: 'center' }}>
                Redirecting to dashboard…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Biometric hint */}
        <p style={{ textAlign: 'center', color: '#334155', fontSize: '11px', marginTop: '16px' }}>
          🧬 Biometric capture active · Device fingerprint collected
        </p>
      </motion.div>
    </div>
  );
}
