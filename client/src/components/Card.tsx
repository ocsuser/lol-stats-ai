import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: 'blue' | 'purple' | 'none';
}

export default function Card({ children, className = '', glow = 'none' }: CardProps) {
  const glowClass =
    glow === 'blue'
      ? 'shadow-lg shadow-sky-500/10'
      : glow === 'purple'
      ? 'shadow-lg shadow-violet-500/10'
      : '';

  return (
    <div className={`glass-card p-5 ${glowClass} ${className}`}>
      {children}
    </div>
  );
}
