import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { MapPin, Phone, Clock, Star } from 'lucide-react';
import type { Restaurant, TemplateConfig } from '../../types/menu';

interface CustomerHeaderProps {
  restaurant: Restaurant;
  templateConfig: TemplateConfig;
}

export default function CustomerHeader({ restaurant, templateConfig }: CustomerHeaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  const imageY = useTransform(scrollY, [0, 600], [0, 180]);
  const imageScale = useTransform(scrollY, [0, 600], [1, 1.2]);
  const overlayOpacity = useTransform(scrollY, [0, 400], [0.55, 0.92]);
  const contentOpacity = useTransform(scrollY, [250, 450], [1, 0]);
  const contentY = useTransform(scrollY, [200, 450], [0, -40]);
  const hasCover = !!restaurant.coverImage;

  const primary = templateConfig.colors.primary || '#f97316';
  const secondary = templateConfig.colors.secondary || '#ea580c';

  return (
    <div ref={containerRef} className="relative w-full h-[420px] md:h-[520px] overflow-hidden">
      {/* Background */}
      {hasCover ? (
        <motion.div className="absolute inset-0 origin-center" style={{ y: imageY, scale: imageScale }}>
          <img
            src={restaurant.coverImage}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        </motion.div>
      ) : (
        <motion.div className="absolute inset-0" style={{ y: imageY, scale: imageScale }}>
          {/* Rich gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, #0a0a0f 0%, ${primary}55 40%, ${secondary}44 70%, #0a0a0f 100%)`,
            }}
          />
          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
          {/* Glowing orbs */}
          <div
            className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 blur-[80px]"
            style={{ background: `radial-gradient(circle, ${primary}, transparent 70%)`, transform: 'translate(30%, -30%)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15 blur-[60px]"
            style={{ background: `radial-gradient(circle, ${secondary}, transparent 70%)`, transform: 'translate(-30%, 30%)' }}
          />
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(${primary}40 1px, transparent 1px), linear-gradient(to right, ${primary}40 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </motion.div>
      )}

      {/* Dark gradient overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: hasCover ? overlayOpacity : 0.6,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Floating ambient glow at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: `linear-gradient(to top, ${templateConfig.colors.background || '#fff'} 0%, transparent 100%)`,
        }}
      />

      {/* Main Content */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-end pb-14 md:pb-20 px-6"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <motion.div
          className="text-center max-w-2xl w-full"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          {restaurant.logo && (
            <motion.div
              className="mx-auto mb-5 relative"
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 14 }}
            >
              <div
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl mx-auto overflow-hidden shadow-2xl border border-white/20"
                style={{ boxShadow: `0 0 40px ${primary}60, 0 20px 40px rgba(0,0,0,0.5)` }}
              >
                <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover" />
              </div>
              {/* Glow ring */}
              <div
                className="absolute -inset-1 rounded-2xl blur-md opacity-50 -z-10"
                style={{ background: primary }}
              />
            </motion.div>
          )}

          {/* Rating badge */}
          <motion.div
            className="flex items-center justify-center gap-1.5 mb-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center gap-1 bg-amber-400/20 backdrop-blur-sm border border-amber-400/30 rounded-full px-3 py-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-amber-300 text-xs font-semibold ml-1">5.0</span>
            </div>
          </motion.div>

          {/* Restaurant Name */}
          <motion.h1
            className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tight leading-none"
            style={{
              fontFamily: templateConfig.fonts.heading,
              textShadow: '0 4px 30px rgba(0,0,0,0.5)',
            }}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {restaurant.name}
          </motion.h1>

          {/* Animated divider */}
          <motion.div
            className="flex items-center justify-center gap-3 mb-3"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          >
            <div className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(to left, ${primary}, transparent)` }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primary }} />
            <div className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(to right, ${primary}, transparent)` }} />
          </motion.div>

          {/* Description */}
          {restaurant.description && (
            <motion.p
              className="text-white/75 text-sm md:text-base max-w-md mx-auto mb-4 leading-relaxed"
              style={{ fontFamily: templateConfig.fonts.body }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {restaurant.description}
            </motion.p>
          )}

          {/* Meta chips */}
          <motion.div
            className="flex items-center justify-center gap-2 flex-wrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5">
              <Clock className="w-3 h-3 text-white/60" />
              <span className="text-white/80 text-xs font-medium">Open Now</span>
            </div>
            {restaurant.address && (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5">
                <MapPin className="w-3 h-3 text-white/60" />
                <span className="text-white/80 text-xs font-medium">{restaurant.address}</span>
              </div>
            )}
            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5 hover:bg-white/20 transition-colors"
              >
                <Phone className="w-3 h-3 text-white/60" />
                <span className="text-white/80 text-xs font-medium">{restaurant.phone}</span>
              </a>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
