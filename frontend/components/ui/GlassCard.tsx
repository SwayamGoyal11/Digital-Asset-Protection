'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'blue' | 'purple' | 'none';
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', hover = false, glow = 'none', onClick }: Props) {
  const glowClass = glow === 'blue' ? 'neon-blue' : glow === 'purple' ? 'neon-purple' : '';

  return (
    <motion.div
      className={`glass ${glowClass} ${className}`}
      onClick={onClick}
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{ padding: '24px', cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </motion.div>
  );
}
