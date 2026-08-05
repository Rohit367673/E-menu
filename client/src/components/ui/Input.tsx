import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, className = '', id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-') || 'field'}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/70 pointer-events-none z-10 flex items-center justify-center">
              {icon}
            </span>
          )}
          <motion.input
            ref={ref}
            id={inputId}
            animate={{
              boxShadow: isFocused
                ? '0 0 0 3px rgba(99, 102, 241, 0.15)'
                : '0 0 0 0px rgba(99, 102, 241, 0)',
            }}
            transition={{ duration: 0.2 }}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={`
              w-full rounded-xl border bg-white text-sm font-medium text-text
              placeholder:text-text-secondary/50 outline-none
              transition-colors duration-200 h-11 min-h-[44px] py-2.5
              leading-normal
              ${error ? 'border-danger' : isFocused ? 'border-primary' : 'border-border'}
              ${className}
            `}
            style={{
              paddingLeft: icon ? '2.375rem' : '0.875rem',
              paddingRight: rightIcon ? '2.375rem' : '0.875rem',
              ...props.style
            }}
            {...(props as any)}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary z-10 flex items-center justify-center">
              {rightIcon}
            </span>
          )}
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-1.5 text-xs text-danger font-medium"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
