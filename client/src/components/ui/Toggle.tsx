import { motion } from 'motion/react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, label, id, disabled = false }: ToggleProps) {
  const toggleId = id || `toggle-${label?.toLowerCase().replace(/\s+/g, '-') || 'switch'}`;

  return (
    <label
      htmlFor={toggleId}
      className={`inline-flex items-center gap-2.5 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <button
        id={toggleId}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-300 ease-out
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
          ${checked ? 'bg-accent' : 'bg-gray-200'}
          cursor-pointer
        `}
      >
        <motion.span
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="inline-block h-5 w-5 rounded-full bg-white shadow-md"
        />
      </button>
      {label && <span className="text-sm font-medium text-text">{label}</span>}
    </label>
  );
}
