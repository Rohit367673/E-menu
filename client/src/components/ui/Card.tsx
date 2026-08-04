import type { ReactNode, HTMLAttributes } from 'react';
import { motion } from 'motion/react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({ children, hover = true, padding = 'md', className = '', ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: '0 12px 28px -8px rgba(0, 0, 0, 0.1)' } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        bg-white rounded-2xl border border-border/60
        shadow-sm transition-colors duration-300
        ${paddingMap[padding]}
        ${className}
      `}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}
