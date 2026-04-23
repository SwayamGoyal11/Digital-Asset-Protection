'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClick?: () => void;
  loading?: boolean;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
  variant?: 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
}

const variants = {
  primary: {
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: 'white',
    border: 'none',
  },
  danger: {
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: 'white',
    border: 'none',
  },
  ghost: {
    background: 'rgba(255,255,255,0.05)',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.1)',
  },
};

export default function NeonButton({
  children, onClick, loading = false, type = 'button',
  fullWidth = false, variant = 'primary', disabled = false,
}: Props) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -1 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        ...variants[variant],
        width: fullWidth ? '100%' : 'auto',
        padding: '12px 28px',
        borderRadius: '10px',
        fontWeight: 600,
        fontSize: '14px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        letterSpacing: '0.02em',
        transition: 'box-shadow 0.3s ease',
        boxShadow: variant === 'primary' ? '0 0 30px rgba(59,130,246,0.3)' : 'none',
      }}
    >
      {loading ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ) : children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.button>
  );
}
