import { useState } from 'react';
import { motion } from 'motion/react';
import { UtensilsCrossed, Plus } from 'lucide-react';
import VegBadge from './VegBadge';
import type { MenuItem, TemplateConfig } from '../../types/menu';
import { getImageUrl } from '../../utils/image';

interface ItemCardProps {
  item: MenuItem;
  templateConfig: TemplateConfig;
  index?: number;
  onSelect: (item: MenuItem) => void;
}

export default function ItemCard({ item, templateConfig, index = 0, onSelect }: ItemCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const primary = templateConfig.colors.primary || '#f97316';
  const hasImage = item.image && !imgError;
  const isAvail = item.isAvailable !== false && item.available !== false;

  const discount =
    item.discountPrice && item.discountPrice < item.price
      ? Math.round(((item.price - item.discountPrice) / item.price) * 100)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.97 }}
      className="group cursor-pointer rounded-2xl overflow-hidden relative"
      style={{
        backgroundColor: templateConfig.colors.surface || '#fff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        border: `1px solid ${templateConfig.colors.text}08`,
      }}
      onClick={() => isAvail && onSelect(item)}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden"
        style={{ height: hasImage ? '190px' : '72px' }}
      >
        {hasImage ? (
          <>
            {!imgLoaded && (
              <div
                className="absolute inset-0 animate-pulse"
                style={{ background: `linear-gradient(135deg, ${primary}15, ${primary}08)` }}
              />
            )}
            <img
              src={getImageUrl(item.image)}
              alt={item.name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

            {/* Discount badge */}
            {discount && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                -{discount}%
              </div>
            )}

            {/* Unavailable overlay */}
            {!isAvail && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                  Unavailable
                </span>
              </div>
            )}

            {/* Add button on hover */}
            {isAvail && (
              <motion.div
                className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100"
                initial={false}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: primary }}
                >
                  <Plus className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${primary}12, ${primary}06)` }}
          >
            <UtensilsCrossed className="w-7 h-7 opacity-20" style={{ color: primary }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name row */}
        <div className="flex items-start gap-2 mb-1.5">
          <div className="mt-0.5 flex-shrink-0">
            <VegBadge type={item.vegType} />
          </div>
          <h3
            className="font-bold text-[15px] leading-snug line-clamp-1 flex-1"
            style={{ fontFamily: templateConfig.fonts.heading, color: templateConfig.colors.text }}
          >
            {item.name}
          </h3>
        </div>

        {/* Description */}
        {item.description && (
          <p
            className="text-[13px] leading-relaxed line-clamp-2 mb-3"
            style={{ fontFamily: templateConfig.fonts.body, color: templateConfig.colors.textSecondary, opacity: 0.75 }}
          >
            {item.description}
          </p>
        )}

        {/* Price row */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-baseline gap-2">
            {item.discountPrice && item.discountPrice < item.price ? (
              <>
                <span className="text-[17px] font-extrabold" style={{ color: primary }}>
                  ₹{item.discountPrice.toFixed(0)}
                </span>
                <span className="text-xs line-through opacity-45" style={{ color: templateConfig.colors.textSecondary }}>
                  ₹{item.price.toFixed(0)}
                </span>
              </>
            ) : (
              <span className="text-[17px] font-extrabold" style={{ color: templateConfig.colors.text }}>
                ₹{item.price.toFixed(0)}
              </span>
            )}
          </div>

          {/* View detail indicator */}
          {isAvail && (
            <span
              className="text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ color: primary }}
            >
              View details →
            </span>
          )}
        </div>
      </div>

      {/* Hover border glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1.5px ${primary}30`, borderRadius: '16px' }}
      />
    </motion.div>
  );
}
