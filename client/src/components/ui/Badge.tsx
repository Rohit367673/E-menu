import type { ReactNode } from 'react';
import { Flame, Leaf, Star, Sparkles } from 'lucide-react';

type BadgeVariant = 'popular' | 'new' | 'spicy' | 'vegetarian' | 'custom';

interface BadgeProps {
  variant?: BadgeVariant;
  children?: ReactNode;
  className?: string;
}

const variantConfig: Record<BadgeVariant, { bg: string; text: string; icon: ReactNode }> = {
  popular: {
    bg: 'bg-gradient-to-r from-amber-400/20 to-yellow-400/20',
    text: 'text-amber-700',
    icon: <Star className="w-3 h-3 fill-amber-500 text-amber-500" />,
  },
  new: {
    bg: 'bg-gradient-to-r from-emerald-400/20 to-green-400/20',
    text: 'text-emerald-700',
    icon: <Sparkles className="w-3 h-3 text-emerald-500" />,
  },
  spicy: {
    bg: 'bg-gradient-to-r from-red-400/20 to-orange-400/20',
    text: 'text-red-700',
    icon: <Flame className="w-3 h-3 text-red-500" />,
  },
  vegetarian: {
    bg: 'bg-gradient-to-r from-green-400/20 to-lime-400/20',
    text: 'text-green-700',
    icon: <Leaf className="w-3 h-3 text-green-500" />,
  },
  custom: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    icon: null,
  },
};

export default function Badge({ variant = 'custom', children, className = '' }: BadgeProps) {
  const config = variantConfig[variant];
  const label = children || variant.charAt(0).toUpperCase() + variant.slice(1);

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
        ${config.bg} ${config.text} ${className}
      `}
    >
      {config.icon}
      {label}
    </span>
  );
}
