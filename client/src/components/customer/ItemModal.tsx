import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Leaf, Star, Sparkles, UtensilsCrossed, Plus, Minus } from 'lucide-react';
import VegBadge from './VegBadge';
import type { MenuItem, TemplateConfig } from '../../types/menu';
import { getImageUrl } from '../../utils/image';
import { useCart } from '../../contexts/CartContext';

interface ItemModalProps {
  item: MenuItem | null;
  templateConfig: TemplateConfig;
  onClose: () => void;
}

export default function ItemModal({ item, templateConfig, onClose }: ItemModalProps) {
  const { addItem, removeItem, getItemQuantity } = useCart();
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [item, handleKeyDown]);

  if (!item) return null;

  const activeBadges: { icon: React.ReactNode; label: string; color: string }[] = [];
  if (item?.badges?.popular) activeBadges.push({ icon: <Star className="w-4 h-4" />, label: 'Popular', color: 'bg-amber-500 text-white' });
  if (item?.badges?.new) activeBadges.push({ icon: <Sparkles className="w-4 h-4" />, label: 'New', color: 'bg-emerald-500 text-white' });
  if (item?.badges?.spicy) activeBadges.push({ icon: <Flame className="w-4 h-4" />, label: 'Spicy', color: 'bg-red-500 text-white' });
  if (item?.badges?.vegetarian) activeBadges.push({ icon: <Leaf className="w-4 h-4" />, label: 'Vegetarian', color: 'bg-green-600 text-white' });

  const surface = templateConfig.colors.surface || '#FFFFFF';
  const text = templateConfig.colors.text || '#1F2937';

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col my-auto"
            style={{ backgroundColor: surface, color: text }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Pull indicator for mobile */}
            <div className="md:hidden flex justify-center pt-2.5 pb-0.5">
              <div className="w-9 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Image */}
            {item.image ? (
              <div className="relative w-full h-48 sm:h-56 overflow-hidden md:rounded-t-2xl flex-shrink-0">
                <img
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Discount badge */}
                {item.discountPrice && item.discountPrice < item.price && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-md">
                    {Math.round(((item.price - item.discountPrice) / item.price) * 100)}% OFF
                  </div>
                )}
              </div>
            ) : (
              <div
                className="w-full h-36 flex items-center justify-center md:rounded-t-2xl flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${templateConfig.colors.primary}20, ${templateConfig.colors.secondary}20)`,
                }}
              >
                <UtensilsCrossed className="w-12 h-12 opacity-20" style={{ color: templateConfig.colors.primary }} />
              </div>
            )}

            {/* Content */}
            <div className="p-4 sm:p-5 flex flex-col gap-2.5">
              {/* Badges */}
              {activeBadges.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {activeBadges.map((badge) => (
                    <span
                      key={badge.label}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Name */}
              <div className="flex items-center gap-2">
                <VegBadge type={item.vegType} />
                <h2
                  className="text-xl sm:text-2xl font-bold leading-tight"
                  style={{
                    fontFamily: templateConfig.fonts.heading,
                    color: templateConfig.colors.text,
                  }}
                >
                  {item.name}
                </h2>
              </div>

              {/* Description */}
              {item.description && (
                <p
                  className="text-xs sm:text-sm leading-relaxed"
                  style={{
                    fontFamily: templateConfig.fonts.body,
                    color: templateConfig.colors.textSecondary,
                  }}
                >
                  {item.description}
                </p>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${templateConfig.colors.primary}12`,
                        color: templateConfig.colors.primary,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Price */}
              <div className="flex items-center justify-between pt-3 border-t mt-1" style={{ borderColor: `${templateConfig.colors.text}12` }}>
                <div className="flex items-baseline gap-2.5">
                  {item.discountPrice && item.discountPrice < item.price ? (
                    <>
                      <span className="text-2xl font-bold" style={{ color: templateConfig.colors.accent }}>
                        ₹{item.discountPrice.toFixed(0)}
                      </span>
                      <span className="text-sm line-through opacity-40" style={{ color: templateConfig.colors.textSecondary }}>
                        ₹{item.price.toFixed(0)}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold" style={{ color: templateConfig.colors.text }}>
                      ₹{item.price.toFixed(0)}
                    </span>
                  )}
                </div>

                {item.isAvailable !== false ? (
                  <div className="flex items-center gap-2">
                    {getItemQuantity(item._id) > 0 ? (
                      <div className="flex items-center rounded-xl border border-amber-500/40 bg-amber-50/70 overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => removeItem(item._id)}
                          className="w-8 h-8 flex items-center justify-center text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-amber-950">
                          {getItemQuantity(item._id)}
                        </span>
                        <button
                          type="button"
                          onClick={() => addItem(item)}
                          className="w-8 h-8 flex items-center justify-center text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addItem(item)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-xs cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                        style={{ background: `linear-gradient(135deg, ${templateConfig.colors.primary}, #a86c3d)` }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Order</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
                    Currently Unavailable
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
