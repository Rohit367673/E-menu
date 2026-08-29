import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-indigo-600 via-primary to-indigo-700 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 border border-indigo-500/20',
  secondary:
    'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 border border-amber-500/20',
  outline:
    'border border-primary/30 text-primary bg-primary/5 hover:bg-primary hover:text-white font-semibold',
  ghost:
    'text-text-secondary hover:bg-gray-100/90 hover:text-text font-medium',
  danger:
    'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 border border-red-500/20',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, icon, children, className = '', disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02, y: disabled || isLoading ? 0 : -1 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97, y: 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 20 }}
        className={`
          inline-flex items-center justify-center font-semibold rounded-xl
          select-none leading-none whitespace-nowrap
          transition-all duration-200 ease-out cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...(props as any)}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
        ) : icon ? (
          <span className="flex-shrink-0 inline-flex items-center justify-center" aria-hidden="true">{icon}</span>
        ) : null}
        <span className="flex-shrink-0 leading-none">{children}</span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;