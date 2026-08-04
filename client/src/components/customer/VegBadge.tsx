interface VegBadgeProps {
  type: 'veg' | 'nonveg' | undefined;
}

export default function VegBadge({ type }: VegBadgeProps) {
  const isVeg = !type || type === 'veg';
  return (
    <span
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      className={`inline-flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 ${
        isVeg ? 'border-emerald-500 bg-emerald-500/5' : 'border-red-500 bg-red-500/5'
      }`}
      style={{ borderWidth: '1.5px' }}
    >
      <span
        className={`w-1.5 h-1.5 ${isVeg ? 'rounded-full bg-emerald-500' : 'w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-red-500 bg-transparent'}`}
      />
    </span>
  );
}
