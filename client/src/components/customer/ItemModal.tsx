import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Leaf, Star, Sparkles, UtensilsCrossed } from 'lucide-react';
import VegBadge from './VegBadge';
import type { MenuItem, TemplateConfig } from '../../types/menu';
import { getImageUrl } from '../../utils/image';

interface ItemModalProps {
  item: MenuItem | null;
  templateConfig: TemplateConfig;
  onClose: () => void;
}

export default function ItemModal({ item, templateConfig, onClose }: ItemModalProps) {
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
            className="relative w-full max-w-lg max-h-[85vh] md:max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col safe-bottom"
            style={{ backgroundColor: surface, color: text }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Pull indicator for mobile */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Image */}
            {item.image ? (
              <div className="relative w-full h-64 md:h-80 overflow-hidden md:rounded-t-2xl">
                <img
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Discount badge */}
                {item.discountPrice && item.discountPrice < item.price && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {Math.round(((item.price - item.discountPrice) / item.price) * 100)}% OFF
                  </div>
                )}
              </div>
            ) : (
              <div
                className="w-full h-48 flex items-center justify-center md:rounded-t-2xl"
                style={{
                  background: `linear-gradient(135deg, ${templateConfig.colors.primary}20, ${templateConfig.colors.secondary}20)`,
                }}
              >
                <UtensilsCrossed className="w-16 h-16 opacity-20" style={{ color: templateConfig.colors.primary }} />
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {/* Badges */}
              {activeBadges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {activeBadges.map((badge) => (
                    <span
                      key={badge.label}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Name */}
              <div className="flex items-center gap-2 mb-2">
                <VegBadge type={item.vegType} />
                <h2
                  className="text-2xl font-bold"
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
                  className="text-base leading-relaxed mb-4"
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
                <div className="flex flex-wrap gap-2 mb-6">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-sm px-3 py-1 rounded-full font-medium"
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
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: `${templateConfig.colors.text}10` }}>
                <div className="flex items-baseline gap-3">
                  {item.discountPrice && item.discountPrice < item.price ? (
                    <>
                      <span className="text-3xl font-bold" style={{ color: templateConfig.colors.accent }}>
                        ₹{item.discountPrice.toFixed(0)}
                      </span>
                      <span className="text-lg line-through opacity-40" style={{ color: templateConfig.colors.textSecondary }}>
                        ₹{item.price.toFixed(0)}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold" style={{ color: templateConfig.colors.text }}>
                      ₹{item.price.toFixed(0)}
                    </span>
                  )}
                </div>

                {!item.isAvailable && (
                  <span className="text-sm font-semibold text-red-500 bg-red-50 px-3 py-1.5 rounded-full">
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
