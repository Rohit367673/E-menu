import { motion } from 'motion/react';
import { Flame } from 'lucide-react';
import VegBadge from './VegBadge';
import type { MenuItem, TemplateConfig } from '../../types/menu';

interface FeaturedSectionProps {
  items: MenuItem[];
  templateConfig: TemplateConfig;
  onSelectItem: (item: MenuItem) => void;
}

export default function FeaturedSection({ items, templateConfig, onSelectItem }: FeaturedSectionProps) {
  const popularItems = items.filter(
    (item) =>
      (item.featured || item.badges?.popular) &&
      item.isAvailable !== false &&
      item.available !== false
  );

  if (popularItems.length === 0) return null;

  const primary = templateConfig.colors.primary || '#f97316';
  const accent = templateConfig.colors.accent || primary;

  return (
    <motion.section
      className="pt-6 pb-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {/* Section Header */}
      <div className="px-4 md:px-6 mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accent}25, ${accent}10)` }}
            >
              <Flame className="w-4 h-4" style={{ color: accent }} />
            </div>
            <h2
              className="text-lg font-extrabold tracking-tight"
              style={{ fontFamily: templateConfig.fonts.heading, color: templateConfig.colors.text }}
            >
              Chef's Picks
            </h2>
          </div>
          <p
            className="text-xs ml-9 font-medium"
            style={{ color: templateConfig.colors.textSecondary, opacity: 0.7 }}
          >
            Hand-picked favourites loved by our guests
          </p>
        </div>
        <div
          className="text-xs font-bold px-3 py-1 rounded-full border"
          style={{
            color: primary,
            borderColor: `${primary}30`,
            backgroundColor: `${primary}08`,
          }}
        >
          {popularItems.length} items
        </div>
      </div>

      {/* Horizontal Scroll */}
      <div
        className="flex overflow-x-auto gap-4 px-4 md:px-6 pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {popularItems.map((item, index) => (
          <motion.div
            key={item._id}
            className="flex-shrink-0 w-[260px] snap-start cursor-pointer group"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
            whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectItem(item)}
          >
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                backgroundColor: templateConfig.colors.surface || '#fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                border: `1px solid ${templateConfig.colors.text}08`,
              }}
            >
              {/* Image */}
              <div className="relative h-[180px] overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-110"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${primary}20, ${primary}08)` }}
                  >
                    <span className="text-4xl">🍽️</span>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

                {/* Badge */}
                <div
                  className="absolute top-3 left-3 flex items-center gap-1.5 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg"
                  style={{ backgroundColor: accent, boxShadow: `0 3px 10px ${accent}50` }}
                >
                  <Flame className="w-3 h-3 fill-white" />
                  Popular
                </div>

                {/* Price floating chip */}
                <div className="absolute bottom-3 right-3">
                  {item.discountPrice && item.discountPrice < item.price ? (
                    <div
                      className="flex items-baseline gap-1.5 rounded-full px-3 py-1.5 shadow-lg backdrop-blur-sm"
                      style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
                    >
                      <span className="text-base font-extrabold" style={{ color: primary }}>
                        ₹{item.discountPrice.toFixed(0)}
                      </span>
                      <span className="text-xs line-through opacity-50">₹{item.price.toFixed(0)}</span>
                    </div>
                  ) : (
                    <div
                      className="rounded-full px-3 py-1.5 shadow-lg backdrop-blur-sm"
                      style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
                    >
                      <span className="text-base font-extrabold" style={{ color: templateConfig.colors.text }}>
                        ₹{item.price.toFixed(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <VegBadge type={item.vegType} />
                  <h3
                    className="font-bold text-[15px] line-clamp-1 flex-1"
                    style={{ fontFamily: templateConfig.fonts.heading, color: templateConfig.colors.text }}
                  >
                    {item.name}
                  </h3>
                </div>
                {item.description && (
                  <p
                    className="text-[12px] line-clamp-2 leading-relaxed"
                    style={{ fontFamily: templateConfig.fonts.body, color: templateConfig.colors.textSecondary, opacity: 0.7 }}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
