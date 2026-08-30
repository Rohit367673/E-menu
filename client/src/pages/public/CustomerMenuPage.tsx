/* =====================================================
   CUSTOMER MENU PAGE — Mobile-First Professional Design
   QR-scanned menu optimized for phone screens (375-430px).
   Card-based mobile layout, elegant desktop with alternating sections.
   ===================================================== */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { UtensilsCrossed, AtSign, Download, MapPin, Phone, Star } from 'lucide-react';
import type { Restaurant, MenuItem, Category, TemplateConfig } from '../../types/menu';
import ItemModal from '../../components/customer/ItemModal';
import ReviewModal from '../../components/customer/ReviewModal';
import { getImageUrl } from '../../utils/image';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface PublicMenuData {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
}

const defaultTemplateConfig: TemplateConfig = {
  templateId: 'default',
  colors: {
    primary: '#6366f1', secondary: '#8b5cf6', background: '#ffffff',
    surface: '#ffffff', text: '#1f2937', textSecondary: '#6b7280', accent: '#f59e0b',
  },
  fonts: { heading: 'Cormorant Garamond, serif', body: 'Outfit, sans-serif' },
  borderRadius: '12px', cardStyle: 'elevated', categoryStyle: 'pills', shadows: true,
};

/* ── Veg / Non-veg dot ── */
function VegDot({ type, size = 14 }: { type?: 'veg' | 'nonveg'; size?: number }) {
  const isVeg = !type || type === 'veg';
  const c = isVeg ? '#16a34a' : '#dc2626';
  const innerSize = Math.round(size / 2);
  return (
    <motion.span
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="inline-flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, border: `1.5px solid ${c}`, borderRadius: 2 }}
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.1 }}
        style={{ width: innerSize, height: innerSize, borderRadius: '50%', backgroundColor: c }}
      />
    </motion.span>
  );
}

/* ── Showcase Image — crossfades when user hovers an item (Desktop only) ── */
function ShowcaseImage({ item, primary }: { item: MenuItem | undefined; primary: string }) {
  const [imgErr, setImgErr] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  useEffect(() => { setImgErr(false); }, [item?._id]);

  return (
    <div
      className="relative overflow-hidden w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        aspectRatio: '4/5',
        borderRadius: '1.25rem',
        boxShadow: isHovered
          ? '0 25px 60px -12px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)'
          : '0 20px 50px -12px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
      }}
    >
      <AnimatePresence mode="wait">
        {item?.image && !imgErr ? (
          <motion.img
            key={item._id}
            src={getImageUrl(item.image)}
            alt={item.name}
            loading="lazy"
            onError={() => setImgErr(true)}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: isHovered ? 1.03 : 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="w-full h-full object-cover absolute inset-0"
            style={{ transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        ) : (
          <motion.div
            key="ph"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full flex flex-col items-center justify-center absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${primary}15, ${primary}05)` }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <UtensilsCrossed className="w-14 h-14" style={{ color: primary, opacity: 0.15 }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}

/* ── Mobile Item Card — thumbnail + name + price (phone-optimized) ── */
function MobileItemCard({
  item, primary, headingFont, onClick, index,
}: {
  item: MenuItem; primary: string; headingFont: string;
  onClick: () => void; index: number;
}) {
  const isAvail = item.isAvailable !== false && item.available !== false;
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={onClick}
      disabled={!isAvail}
      className="menu-card-item w-full text-left"
      style={{ opacity: isAvail ? 1 : 0.4 }}
    >
      {/* Thumbnail */}
      {item.image && !imgErr ? (
        <div className="menu-card-thumb">
          <img
            src={getImageUrl(item.image)}
            alt={item.name}
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        </div>
      ) : (
        <div
          className="menu-card-thumb flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${primary}12, ${primary}06)` }}
        >
          <UtensilsCrossed className="w-6 h-6" style={{ color: primary, opacity: 0.25 }} />
        </div>
      )}

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <VegDot type={item.vegType} size={12} />
          <span
            className="font-bold text-[15px] truncate"
            style={{ fontFamily: headingFont, color: '#1f2937' }}
          >
            {item.name}
          </span>
        </div>
        {item.description && (
          <p className="text-[12px] text-gray-400 line-clamp-1 leading-snug mb-1">
            {item.description}
          </p>
        )}
        <span
          className="font-bold text-[15px]"
          style={{ fontFamily: headingFont, color: primary }}
        >
          ₹{item.price}
        </span>
        {!isAvail && (
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider ml-2">
            Sold out
          </span>
        )}
      </div>
    </motion.button>
  );
}

/* ── Desktop Item Row — name ··········· ₹price ── */
function ItemRow({
  item, primary, headingFont, isActive, onHover, onClick, index,
}: {
  item: MenuItem; primary: string; headingFont: string; isActive: boolean;
  onHover: () => void; onClick: () => void; index: number;
}) {
  const isAvail = item.isAvailable !== false && item.available !== false;

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onClick}
      disabled={!isAvail}
      className="w-full text-left group cursor-pointer"
      style={{
        padding: '12px 14px',
        borderLeft: `3px solid ${isActive ? primary : 'transparent'}`,
        background: isActive ? `${primary}08` : 'transparent',
        borderRadius: 8,
        transition: 'all 0.25s ease',
        opacity: isAvail ? 1 : 0.4,
      }}
    >
      {/* Name ··· Price */}
      <div className="flex items-baseline gap-2">
        <VegDot type={item.vegType} />
        <span
          className="font-bold text-[17px] md:text-[18px] whitespace-nowrap"
          style={{ fontFamily: headingFont, color: isActive ? primary : '#1f2937', transition: 'color 0.2s' }}
        >
          {item.name}
        </span>
        {/* Dotted leader */}
        <span
          className="flex-1"
          style={{
            minWidth: 16,
            borderBottom: '1.5px dotted #d1d5db',
            alignSelf: 'flex-end',
            margin: '0 4px',
            marginBottom: 5,
          }}
        />
        <span className="font-bold text-[16px] md:text-[17px] flex-shrink-0" style={{ fontFamily: headingFont, color: primary }}>
          ₹{item.price}
        </span>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-[12px] mt-1 line-clamp-1" style={{ color: '#9ca3af', paddingLeft: 22 }}>
          {item.description}
        </p>
      )}

      {!isAvail && (
        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider mt-1" style={{ paddingLeft: 22 }}>
          Sold out
        </span>
      )}
    </motion.button>
  );
}

/* ── Category Section — responsive layout ── */
function CategorySection({
  category, items, isReversed, primary, headingFont, onSelectItem,
}: {
  category: Category; items: MenuItem[]; isReversed: boolean;
  primary: string; headingFont: string; onSelectItem: (item: MenuItem) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const displayItem = items[activeIdx] || items[0];

  return (
    <motion.section
      id={`cat-${category._id}`}
      className="scroll-mt-16 md:scroll-mt-20"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── Category Label ── */}
      <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${primary}30, transparent)` }} />
        <h2
          className="text-[14px] md:text-[18px] font-bold uppercase tracking-[0.2em] md:tracking-[0.25em] flex-shrink-0"
          style={{ fontFamily: headingFont, color: primary }}
        >
          {category.icon && <span className="mr-1.5">{category.icon}</span>}
          {category.name}
        </h2>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${primary}30, transparent)` }} />
      </div>

      {/* ── Mobile: Card list (no border box, no showcase image) ── */}
      <div className="md:hidden">
        {items.map((item, i) => (
          <MobileItemCard
            key={item._id}
            item={item}
            primary={primary}
            headingFont={headingFont}
            onClick={() => onSelectItem(item)}
            index={i}
          />
        ))}
      </div>

      {/* ── Desktop: Bordered box with alternating showcase layout ── */}
      <div
        className="hidden md:block relative"
        style={{
          border: `1.5px solid ${primary}20`,
          borderRadius: 20,
          padding: '24px 20px',
          background: '#ffffff',
        }}
      >
        <div
          className="hidden lg:flex gap-8 items-start"
          style={{ flexDirection: isReversed ? 'row-reverse' : 'row' }}
        >
          {/* Items list */}
          <div className="flex-1 min-w-0">
            {items.map((item, i) => (
              <ItemRow
                key={item._id}
                item={item}
                primary={primary}
                headingFont={headingFont}
                isActive={i === activeIdx}
                onHover={() => setActiveIdx(i)}
                onClick={() => onSelectItem(item)}
                index={i}
              />
            ))}
          </div>

          {/* Showcase image */}
          <div className="flex-shrink-0" style={{ width: 280 }}>
            <ShowcaseImage item={displayItem} primary={primary} />
          </div>
        </div>

        {/* Tablet: stacked (image on top) — between md and lg */}
        <div className="lg:hidden">
          <div className="mb-4 mx-auto" style={{ maxWidth: 260 }}>
            <ShowcaseImage item={displayItem} primary={primary} />
          </div>
          <div>
            {items.map((item, i) => (
              <ItemRow
                key={item._id}
                item={item}
                primary={primary}
                headingFont={headingFont}
                isActive={i === activeIdx}
                onHover={() => setActiveIdx(i)}
                onClick={() => onSelectItem(item)}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ── Skeleton ── */
function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="max-w-lg mx-auto px-5 pt-8">
        {/* Header skeleton */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-14 h-14 bg-gray-200 rounded-full" />
          <div className="h-7 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
        {/* Tabs skeleton */}
        <div className="flex gap-3 mb-6">
          {[60, 70, 80, 70].map((w, i) => (
            <div key={i} className="h-10 rounded-full bg-gray-100" style={{ width: w }} />
          ))}
        </div>
        {/* Items skeleton */}
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((j) => (
            <div key={j} className="flex items-center gap-3 p-3">
              <div className="w-[76px] h-[76px] bg-gray-100 rounded-2xl" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 w-32 bg-gray-100 rounded" />
                <div className="h-3 w-48 bg-gray-50 rounded" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Error ── */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-red-50 flex items-center justify-center">
          <UtensilsCrossed className="w-9 h-9 text-red-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Menu Unavailable</h2>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}

/* ── Glowing Hanging Bulbs Decoration (Visible on mobile & desktop) ── */
function HangingBulbs() {
  // Positioned on left flank (4%, 16%, 28%) and right flank (72%, 84%, 96%)
  // Leaving a wide 44% clear center window (28% -> 72%) for logo & brand title!
  const bulbs = [
    { left: '4%', height: 30, delay: '0s', size: 'w-4.5 h-6.5' },
    { left: '16%', height: 46, delay: '0.6s', size: 'w-5.5 h-7.5' },
    { left: '28%', height: 32, delay: '1.2s', size: 'w-4.5 h-6.5' },
    { left: '72%', height: 32, delay: '0.3s', size: 'w-4.5 h-6.5' },
    { left: '84%', height: 46, delay: '1.5s', size: 'w-5.5 h-7.5' },
    { left: '96%', height: 30, delay: '0.8s', size: 'w-4.5 h-6.5' },
  ];

  return (
    <div className="absolute top-0 left-0 right-0 h-36 pointer-events-none z-0 overflow-hidden no-print">
      {/* Wire string curve arched over center logo */}
      <svg className="absolute top-0 left-0 w-full h-10 text-gray-900/20" preserveAspectRatio="none" viewBox="0 0 100 10">
        <path d="M 0 0 C 12 5, 24 5, 34 2 C 45 0, 55 0, 66 2 C 76 5, 88 5, 100 0" fill="none" stroke="currentColor" strokeWidth="0.3" />
      </svg>

      {bulbs.map((b, idx) => (
        <div
          key={idx}
          className="absolute flex flex-col items-center origin-top animate-sway"
          style={{
            left: b.left,
            animationDelay: b.delay,
            animationDuration: '4.2s',
          }}
        >
          {/* Cord */}
          <div className="w-[1.5px] bg-gray-700/70" style={{ height: b.height }} />
          {/* Cap */}
          <div className="w-3.5 h-2 bg-gray-800 rounded-t-xs" style={{ borderBottom: '1px solid #111827' }} />
          {/* Bulb Body */}
          <div
            className={`${b.size} rounded-b-full rounded-t-xs relative flex items-center justify-center animate-bulb-glow`}
            style={{
              background: 'radial-gradient(circle at 50% 40%, #ffffff 15%, #fef3c7 45%, #fbbf24 85%, #d97706 100%)',
              animationDelay: b.delay,
              animationDuration: '2.4s',
            }}
          >
            {/* Inner Filament */}
            <div className="w-[1.5px] h-2.5 bg-amber-100 rounded-full shadow-[0_0_4px_#fff]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Proper SVG Café Bistro Scene ── */
function CafeBistroGraphicScene({ primary }: { primary: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center mb-10 select-none w-full max-w-md mx-auto">
      <svg viewBox="0 0 400 220" className="w-full max-w-[380px] h-auto" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Wood grain gradient for table */}
          <linearGradient id="tableTopGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c2d12" />
            <stop offset="30%" stopColor="#a16207" />
            <stop offset="50%" stopColor="#b45309" />
            <stop offset="70%" stopColor="#a16207" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
          <linearGradient id="tableLegGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
          <linearGradient id="chairGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#6b3410" />
          </linearGradient>
          <linearGradient id="cupGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f3f4f6" />
          </linearGradient>
          <radialGradient id="flameGlow" cx="50%" cy="70%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="plateGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fafafa" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>
        </defs>

        {/* ═══ LEFT CHAIR ═══ */}
        <g transform="translate(52, 72)">
          {/* Chair back — curved panel */}
          <rect x="0" y="0" width="6" height="52" rx="3" fill="url(#chairGrad)" />
          <rect x="30" y="0" width="6" height="52" rx="3" fill="url(#chairGrad)" />
          {/* Back rest horizontal slats */}
          <rect x="0" y="6" width="36" height="5" rx="2" fill="#92400e" />
          <rect x="0" y="16" width="36" height="5" rx="2" fill="#92400e" />
          <rect x="0" y="26" width="36" height="5" rx="2" fill="#92400e" />
          {/* Seat */}
          <rect x="-2" y="38" width="40" height="7" rx="3" fill="url(#chairGrad)" stroke="#6b3410" strokeWidth="0.5" />
          {/* Front legs */}
          <rect x="2" y="45" width="5" height="28" rx="2" fill="url(#chairGrad)" />
          <rect x="29" y="45" width="5" height="28" rx="2" fill="url(#chairGrad)" />
        </g>

        {/* ═══ RIGHT CHAIR ═══ */}
        <g transform="translate(312, 72)">
          <rect x="0" y="0" width="6" height="52" rx="3" fill="url(#chairGrad)" />
          <rect x="30" y="0" width="6" height="52" rx="3" fill="url(#chairGrad)" />
          <rect x="0" y="6" width="36" height="5" rx="2" fill="#92400e" />
          <rect x="0" y="16" width="36" height="5" rx="2" fill="#92400e" />
          <rect x="0" y="26" width="36" height="5" rx="2" fill="#92400e" />
          <rect x="-2" y="38" width="40" height="7" rx="3" fill="url(#chairGrad)" stroke="#6b3410" strokeWidth="0.5" />
          <rect x="2" y="45" width="5" height="28" rx="2" fill="url(#chairGrad)" />
          <rect x="29" y="45" width="5" height="28" rx="2" fill="url(#chairGrad)" />
        </g>

        {/* ═══ TABLE ═══ */}
        {/* Table top — ellipse with wood texture */}
        <ellipse cx="200" cy="118" rx="100" ry="12" fill="url(#tableTopGrad)" stroke="#6b3410" strokeWidth="1.5" />
        {/* Table top highlight */}
        <ellipse cx="200" cy="116" rx="80" ry="6" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        {/* Center pedestal */}
        <rect x="193" y="128" width="14" height="45" rx="2" fill="url(#tableLegGrad)" />
        {/* Pedestal base */}
        <ellipse cx="200" cy="175" rx="38" ry="8" fill="#451a03" stroke="#3b2506" strokeWidth="1" />
        <ellipse cx="200" cy="173" rx="36" ry="6" fill="#5c3310" />

        {/* ═══ TABLETOP ITEMS ═══ */}

        {/* ── Coffee Cup (center-left) ── */}
        <g transform="translate(155, 85)">
          {/* Saucer */}
          <ellipse cx="20" cy="30" rx="18" ry="5" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="0.5" />
          {/* Cup body */}
          <path d="M8,10 L12,28 C12,30 28,30 28,28 L32,10 Z" fill="url(#cupGrad)" stroke="#d1d5db" strokeWidth="0.8" />
          {/* Cup rim */}
          <ellipse cx="20" cy="10" rx="12" ry="4" fill="#fefefe" stroke="#d1d5db" strokeWidth="0.5" />
          {/* Coffee liquid */}
          <ellipse cx="20" cy="11" rx="10" ry="3" fill="#78350f" />
          {/* Handle */}
          <path d="M32,14 C38,14 38,24 32,24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* ── Animated Steam (above coffee) ── */}
        <g transform="translate(175, 50)">
          <motion.path
            d="M0,35 C2,28 -2,22 0,15 C2,8 -1,2 0,-5"
            fill="none"
            stroke={primary}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.5"
            animate={{ y: [0, -8], opacity: [0.5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.path
            d="M8,35 C6,26 10,20 8,12 C6,5 9,0 8,-8"
            fill="none"
            stroke={primary}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.6"
            animate={{ y: [0, -10], opacity: [0.6, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
          />
        </g>

        {/* ── Candle (center) ── */}
        <g transform="translate(195, 78)">
          {/* Candle holder base */}
          <ellipse cx="8" cy="34" rx="10" ry="3" fill="#b8860b" stroke="#8b6914" strokeWidth="0.5" />
          {/* Candle body */}
          <rect x="4" y="14" width="8" height="20" rx="1" fill="#fef3c7" stroke="#fcd34d" strokeWidth="0.5" />
          {/* Wick */}
          <line x1="8" y1="14" x2="8" y2="9" stroke="#333" strokeWidth="0.8" />
          {/* Animated flame */}
          <motion.g
            animate={{ scaleY: [0.9, 1.15, 0.95, 1.1, 1], scaleX: [1, 0.9, 1.05, 0.92, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '8px 9px' }}
          >
            {/* Outer flame */}
            <path d="M8,9 C5,4 4,1 8,-4 C12,1 11,4 8,9" fill="#f59e0b" opacity="0.9" />
            {/* Inner flame */}
            <path d="M8,8 C6.5,5 6,3 8,-1 C10,3 9.5,5 8,8" fill="#fbbf24" />
            {/* Core */}
            <path d="M8,7 C7.2,5.5 7,4.5 8,2 C9,4.5 8.8,5.5 8,7" fill="#fef3c7" />
          </motion.g>
          {/* Ambient glow around flame */}
          <motion.circle
            cx="8" cy="4" r="14"
            fill="url(#flameGlow)"
            animate={{ r: [12, 16, 13, 15, 14], opacity: [0.4, 0.7, 0.5, 0.65, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>

        {/* ── Pastry Plate (center-right) ── */}
        <g transform="translate(225, 92)">
          {/* Plate */}
          <ellipse cx="18" cy="22" rx="18" ry="5" fill="url(#plateGrad)" stroke="#d1d5db" strokeWidth="0.5" />
          {/* Croissant shape */}
          <path d="M6,18 C8,12 14,10 18,12 C22,10 28,12 30,18 C28,16 22,15 18,17 C14,15 8,16 6,18Z" fill="#d97706" stroke="#b45309" strokeWidth="0.4" />
          <path d="M10,17 C12,14 16,13 18,15 C20,13 24,14 26,17" fill="none" stroke="#92400e" strokeWidth="0.3" opacity="0.4" />
        </g>

        {/* ── Floor shadow under table ── */}
        <ellipse cx="200" cy="185" rx="110" ry="6" fill="rgba(0,0,0,0.04)" />
      </svg>
    </div>
  );
}

/* ── Helper to map category names to generated watercolor sketches ── */
const getCategorySketch = (name: string) => {
  const norm = name.toLowerCase();
  if (norm.includes('coffee') || norm.includes('beverage') || norm.includes('drink') || norm.includes('tea')) {
    return '/menu-sketches/coffee.jpg';
  }
  if (norm.includes('snack') || norm.includes('starter') || norm.includes('appetizer') || norm.includes('fast food')) {
    return '/menu-sketches/snacks.jpg';
  }
  if (norm.includes('burger') || norm.includes('sandwich') || norm.includes('pizza')) {
    return '/menu-sketches/burgers.jpg';
  }
  if (norm.includes('smoothie') || norm.includes('shake') || norm.includes('juice') || norm.includes('mocktail')) {
    return '/menu-sketches/smoothies.jpg';
  }
  if (norm.includes('dessert') || norm.includes('sweet') || norm.includes('cake') || norm.includes('pastry')) {
    return '/menu-sketches/desserts.jpg';
  }
  return '/menu-sketches/generic.jpg';
};

/* ── Classic Café Print Menu (visible only during print) ── */
function PrintMenu({
  restaurant,
  categories,
  getItems,
  headingFont,
}: {
  restaurant: Restaurant;
  categories: Category[];
  getItems: (catId: string) => MenuItem[];
  headingFont: string;
}) {

  return (
    <div className="print-menu">
      <div className="print-menu-page">
        {/* ── Header ── */}
        <div className="print-header">
          <div className="print-header-ornament">✦ ✦ ✦</div>
          {restaurant.logo && (
            <img
              src={getImageUrl(restaurant.logo)}
              alt={restaurant.name}
              className="print-header-logo"
            />
          )}
          <h1 style={{ fontFamily: headingFont }}>{restaurant.name}</h1>
          <div className="print-header-tagline" style={{ fontFamily: headingFont }}>
            {restaurant.description || 'Welcome to our menu'}
          </div>
          <div className="print-header-divider">
            <span />
            <em>❧</em>
            <span />
          </div>
        </div>

        {/* ── Menu Categories ── */}
        {categories.map((cat, catIdx) => {
          const catItems = getItems(cat._id);
          if (catItems.length === 0) return null;

          const sketchPath = cat.printSketch || getCategorySketch(cat.name);
          const isImageLeft = catIdx % 2 === 0;

          return (
            <div key={cat._id} className="print-category">
              {/* Category Title */}
              <h2 className="print-category-title" style={{ fontFamily: headingFont }}>
                {cat.icon && <span>{cat.icon} </span>}
                {cat.name}
              </h2>
              <div className="print-category-line">
                <span />
                <em>◆</em>
                <span />
              </div>

              {/* Category content: sketch + items */}
              <div
                className="print-category-content print-has-image"
                style={{ flexDirection: isImageLeft ? 'row' : 'row-reverse' }}
              >
                {/* Sketch illustration */}
                <div className="print-showcase">
                  <img src={getImageUrl(sketchPath)} alt={cat.name} />
                </div>

                {/* Items list */}
                <div className="print-items-list">
                  {catItems.map((item) => (
                    <div key={item._id} className="print-item">
                      <div className="print-item-row">
                        <span
                          className={`print-item-veg ${(!item.vegType || item.vegType === 'veg') ? 'veg' : 'nonveg'}`}
                        />
                        <span className="print-item-name" style={{ fontFamily: headingFont }}>
                          {item.name}
                        </span>
                        <span className="print-item-dots" />
                        <span className="print-item-price" style={{ fontFamily: headingFont }}>
                          ₹{item.price}
                        </span>
                      </div>
                      {item.description && (
                        <div className="print-item-desc">{item.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Footer ── */}
        <div className="print-footer">
          <div className="print-footer-ornament">❋ ❋ ❋</div>
          <div className="print-footer-info">
            {restaurant.address && <div>{restaurant.address}</div>}
            {restaurant.phone && <div>{restaurant.phone}</div>}
          </div>
          <div className="print-footer-branding">Digital Menu</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function CustomerMenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCatId, setActiveCatId] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  /* Fetch data */
  useEffect(() => {
    (async () => {
      try {
        const serverHost = (API_BASE || '').replace(/\/api\/?$/, '');
        const path = slug ? `/api/restaurants/${slug}/public` : '/api/restaurants/public';
        const url = `${serverHost}${path}`;
        const res = await axios.get<{
          success: boolean;
          data: { restaurant: Restaurant; categories: (Category & { items: MenuItem[] })[] };
        }>(url);
        const { restaurant, categories } = res.data.data;
        const items = categories.flatMap((c) => c.items || []);
        setData({ restaurant, categories, items });
        const sorted = [...categories]
          .filter((c) => c.isActive !== false)
          .sort((a, b) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0));

        // Filter to categories that actually have active, available items
        const visibleSorted = sorted.filter((c) =>
          items.some((i) => i.category === c._id && i.isAvailable !== false && i.available !== false)
        );

        if (visibleSorted.length > 0) {
          setActiveCatId(visibleSorted[0]._id);
          setPage([0, 0]);
        } else if (sorted.length > 0) {
          setActiveCatId(sorted[0]._id);
          setPage([0, 0]);
        }
      } catch (err) {
        setError(axios.isAxiosError(err) && err.response?.status === 404
          ? 'This menu could not be found.'
          : 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Page booklet swipe/transition states
  const [[, direction], setPage] = useState([0, 0]);

  // Transition variants
  const pageVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const goToNextCategory = () => {
    const activeIdx = sortedCats.findIndex((c) => c._id === activeCatId);
    if (activeIdx < sortedCats.length - 1) {
      const nextId = sortedCats[activeIdx + 1]._id;
      setPage([activeIdx + 1, 1]);
      setActiveCatId(nextId);
      scrollToContentAnchor();
    }
  };

  const goToPrevCategory = () => {
    const activeIdx = sortedCats.findIndex((c) => c._id === activeCatId);
    if (activeIdx > 0) {
      const prevId = sortedCats[activeIdx - 1]._id;
      setPage([activeIdx - 1, -1]);
      setActiveCatId(prevId);
      scrollToContentAnchor();
    }
  };

  const scrollToContentAnchor = () => {
    const el = document.getElementById('menu-content-anchor');
    if (el) {
      window.scrollTo({ top: el.offsetTop - 76, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };



  // Safe variables extraction for hooks to run unconditionally at top-level
  const cats = data?.categories || [];
  const allItems = data?.items || [];

  const sortedCats = useMemo(() => {
    const activeCats = [...cats]
      .filter((c) => c.isActive !== false)
      .sort((a, b) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0));

    // Filter out categories that don't have any items to display
    return activeCats.filter((c) =>
      allItems.some((i) => i.category === c._id && i.isAvailable !== false && i.available !== false)
    );
  }, [cats, allItems]);

  /* Intersection Observer to auto-update active tab on scroll (Desktop only) */
  useEffect(() => {
    if (!data || sortedCats.length === 0) return;
    if (window.innerWidth < 768) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const catId = entry.target.id.replace('cat-', '');
            setActiveCatId(catId);
          }
        });
      },
      { rootMargin: '-60px 0px -75% 0px' }
    );

    sortedCats.forEach((cat) => {
      const el = document.getElementById(`cat-${cat._id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [data, sortedCats]);

  /* Auto-scroll active tab into view in the tabs bar without shifting the window */
  useEffect(() => {
    if (!activeCatId || !tabsRef.current) return;
    const scrollContainer = tabsRef.current.querySelector('.overflow-x-auto') as HTMLElement;
    const activeTab = tabsRef.current.querySelector(`[data-cat="${activeCatId}"]`) as HTMLElement;
    if (scrollContainer && activeTab) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      const relativeTabLeft = tabRect.left - containerRect.left + scrollContainer.scrollLeft;
      const targetScrollLeft = relativeTabLeft - (containerRect.width / 2) + (tabRect.width / 2);
      scrollContainer.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      });
    }
  }, [activeCatId]);

  if (loading) return <SkeletonLoader />;
  if (error || !data) return <ErrorState message={error || 'Something went wrong.'} />;

  const { restaurant: rest } = data;
  const tc = { ...defaultTemplateConfig, ...(rest.templateConfig || {}) };
  const primary = tc.colors.primary || '#6366f1';
  const headingFont = 'Cormorant Garamond, serif';
  const bodyFont = 'Outfit, sans-serif';
  const socialHandle = rest.slug || rest.name.toLowerCase().replace(/[^a-z0-9]/g, '');

  const getItems = (catId: string) =>
    allItems
      .filter((i) => i.category === catId && i.isAvailable !== false && i.available !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const scrollToCategory = (catId: string) => {
    const targetIdx = sortedCats.findIndex((c) => c._id === catId);
    if (targetIdx !== -1) {
      const currentIdx = sortedCats.findIndex((c) => c._id === activeCatId);
      const dir = targetIdx > currentIdx ? 1 : -1;
      setPage([targetIdx, dir]);
      setActiveCatId(catId);

      if (window.innerWidth >= 768) {
        const catEl = document.getElementById(`cat-${catId}`);
        if (catEl) {
          const y = catEl.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      } else {
        scrollToContentAnchor();
      }
    }
  };

  return (
    <>
    {/* ═══════════ CLASSIC PRINT MENU (hidden on screen, shown on print) ═══════════ */}
    <PrintMenu
      restaurant={rest}
      categories={sortedCats}
      getItems={getItems}
      headingFont={headingFont}
    />

    {/* ═══════════ INTERACTIVE UI (hidden on print) ═══════════ */}
    <div className="screen-ui min-h-screen flex flex-col items-center w-full overflow-x-hidden" style={{ backgroundColor: '#fefefe', fontFamily: bodyFont }}>

      {/* ═══════════ HEADER ═══════════ */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full safe-top flex flex-col items-center justify-center text-center"
        style={{
          background: `radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.14) 0%, rgba(255, 255, 255, 0) 70%), linear-gradient(160deg, ${primary}06 0%, #ffffff 50%, ${tc.colors.secondary || primary}04 100%)`,
        }}
      >
        {/* Glowing Hanging Bulbs — visible on mobile & desktop */}
        <HangingBulbs />

        {/* Floating Ambient Glow Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/70 blur-[0.5px] animate-ambient-float"
              style={{
                left: `${10 + i * 16}%`,
                bottom: `${15 + (i % 3) * 15}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${5.2 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        {/* Decorative blob */}
        <div
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl hidden md:block"
          style={{ background: primary, opacity: 0.04 }}
        />

        {/* Mobile header: compact centered stack */}
        <div className="md:hidden relative z-20 flex flex-col items-center justify-center text-center px-5 pt-8 pb-3 w-full mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-3 flex items-center justify-center w-full mx-auto text-center"
          >
            {rest.logo ? (
              <div className="w-14 h-14 rounded-full overflow-hidden shadow-md mx-auto"
                style={{ border: `2px solid ${primary}18` }}
              >
                <img src={getImageUrl(rest.logo)} alt={rest.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-md mx-auto"
                style={{ background: `linear-gradient(135deg, ${primary}18, ${primary}08)`, border: `2px solid ${primary}10` }}
              >
                <UtensilsCrossed className="w-7 h-7" style={{ color: primary }} />
              </div>
            )}
          </motion.div>
          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-[26px] font-bold leading-tight text-center w-full"
            style={{ fontFamily: headingFont, color: tc.colors.text }}
          >
            {rest.name}
          </motion.h1>
          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[13px] mt-1.5 italic font-light leading-relaxed max-w-xs text-center mx-auto"
            style={{ color: tc.colors.textSecondary, fontFamily: headingFont }}
          >
            {rest.description || 'Welcome to our menu'}
          </motion.p>
        </div>

        {/* Desktop header: centered brand identity */}
        <div className="hidden md:flex flex-col w-full mx-auto px-4 md:px-6 pt-16 pb-10 items-center justify-center text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-4 flex items-center justify-center w-full mx-auto text-center"
          >
            {rest.logo ? (
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg mx-auto"
                style={{ border: `3px solid ${primary}18` }}
              >
                <img src={getImageUrl(rest.logo)} alt={rest.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg mx-auto"
                style={{ background: `linear-gradient(135deg, ${primary}18, ${primary}08)`, border: `2px solid ${primary}10` }}
              >
                <UtensilsCrossed className="w-9 h-9" style={{ color: primary }} />
              </div>
            )}
          </motion.div>

          {/* Restaurant Name + Tagline */}
          <div className="flex flex-col items-center justify-center text-center w-full mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-[40px] font-bold leading-tight text-center w-full"
              style={{ fontFamily: headingFont, color: tc.colors.text }}
            >
              {rest.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[16px] mt-2 italic max-w-xl font-light leading-relaxed text-center mx-auto"
              style={{ color: tc.colors.textSecondary, fontFamily: headingFont }}
            >
              {rest.description || 'Welcome to our menu'}
            </motion.p>
            {(rest.address || rest.phone) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-4 mt-3 w-full mx-auto"
              >
                {rest.address && (
                  <span className="flex items-center gap-1.5 text-[12px] text-gray-400">
                    <MapPin className="w-3.5 h-3.5" /> {rest.address}
                  </span>
                )}
                {rest.phone && (
                  <a href={`tel:${rest.phone}`} className="flex items-center gap-1.5 text-[12px]" style={{ color: primary }}>
                    <Phone className="w-3.5 h-3.5" /> {rest.phone}
                  </a>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.header>

      {/* ═══════════ CATEGORY TABS (Touch-friendly sticky navigation) ═══════════ */}
      <div ref={tabsRef} className="category-sticky-bar">
        <div className="category-tabs-row">
          {sortedCats.map((cat) => {
            const active = cat._id === activeCatId || (activeCatId === '' && cat._id === sortedCats[0]?._id);
            const catItems = getItems(cat._id);
            if (catItems.length === 0) return null;
            return (
              <button
                key={cat._id}
                data-cat={cat._id}
                onClick={() => scrollToCategory(cat._id)}
                className="category-pill-btn"
                style={{
                  color: active ? '#ffffff' : '#6b7280',
                  backgroundColor: active ? primary : 'transparent',
                  boxShadow: active ? `0 6px 18px ${primary}40` : 'none',
                  fontFamily: headingFont,
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Anchor point to auto-scroll top of booklet on mobile */}
      <div id="menu-content-anchor" className="scroll-mt-16" />

      {/* ═══════════ MENU SECTIONS ═══════════ */}
      <div className="max-w-5xl w-full mx-auto px-4 md:px-6 py-3.5 md:py-14 flex-1 flex flex-col">
        {/* Mobile Page-Based Menu Booklet */}
        <div
          className="md:hidden flex flex-col flex-1 mt-5"
        >
          {sortedCats.length > 0 && (
            (() => {
              const activeIdx = sortedCats.findIndex((c) => c._id === activeCatId);
              const currentIdx = activeIdx !== -1 ? activeIdx : 0;
              const cat = sortedCats[currentIdx];
              if (!cat) return null;
              const catItems = getItems(cat._id);
              const sketchPath = cat.printSketch || getCategorySketch(cat.name);

              return (
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={cat._id}
                    custom={direction}
                    variants={pageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="flex flex-col flex-1"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.4}
                    onDragEnd={(_e, info) => {
                      const swipeThreshold = 70;
                      if (info.offset.x < -swipeThreshold) {
                        goToNextCategory();
                      } else if (info.offset.x > swipeThreshold) {
                        goToPrevCategory();
                      }
                    }}
                  >
                    {/* Sketch Illustration Banner */}
                    <div className="w-full h-36 rounded-2xl overflow-hidden mb-5 border border-[#c8a97e]/30 shadow-sm relative">
                      <img
                        src={getImageUrl(sketchPath)}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent flex items-end p-4">
                        <h2 className="text-white text-[17px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: headingFont }}>
                          {cat.icon && <span>{cat.icon}</span>}
                          {cat.name}
                        </h2>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      {catItems.length === 0 ? (
                        <div className="text-center py-10 text-xs text-text-secondary/60 font-medium">
                          No items available in this category.
                        </div>
                      ) : (
                        catItems.map((item, i) => (
                          <MobileItemCard
                            key={item._id}
                            item={item}
                            primary={primary}
                            headingFont={headingFont}
                            onClick={() => setSelectedItem(item)}
                            index={i}
                          />
                        ))
                      )}
                    </div>

                    {/* Booklet Page Turn Navigation Controls */}
                    <div className="flex items-center justify-between mt-8 text-[11px] text-text-secondary/80 font-bold pt-4 border-t border-border/40 uppercase tracking-wider">
                      <button
                        onClick={goToPrevCategory}
                        disabled={currentIdx === 0}
                        className="flex items-center gap-1 disabled:opacity-20 cursor-pointer text-gray-500 hover:text-primary transition-colors"
                      >
                        ← Prev Page
                      </button>
                      <span className="font-semibold text-gray-400">
                        Page {currentIdx + 1} of {sortedCats.length}
                      </span>
                      <button
                        onClick={goToNextCategory}
                        disabled={currentIdx === sortedCats.length - 1}
                        className="flex items-center gap-1 disabled:opacity-20 cursor-pointer text-gray-500 hover:text-primary transition-colors"
                      >
                        Next Page →
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              );
            })()
          )}
        </div>

        {/* Desktop Layout — Keeps Alternate Spacious List Scroll */}
        <div className="hidden md:flex md:flex-col gap-14 md:gap-20">
          {sortedCats.map((cat, idx) => {
            const catItems = getItems(cat._id);
            if (catItems.length === 0) return null;
            return (
              <CategorySection
                key={cat._id}
                category={cat}
                items={catItems}
                isReversed={idx % 2 !== 0}
                primary={primary}
                headingFont={headingFont}
                onSelectItem={setSelectedItem}
              />
            );
          })}
        </div>
      </div>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="w-full bg-[#faf8f4] border-t border-[#e8dfd1] mt-16 relative overflow-hidden" style={{ minHeight: '220px' }}>
        {/* Subtle Warm Background Glow */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl pointer-events-none"
          style={{ background: primary, opacity: 0.05 }}
        />

        {/* ═══ LEFT SIDE — Café Scene (pinned to left edge) ═══ */}
        <div className="hidden lg:block absolute left-6 bottom-6 w-[240px] pointer-events-none z-0 opacity-85">
          <CafeBistroGraphicScene primary={primary} />
        </div>

        {/* ═══ RIGHT SIDE — Café Scene (pinned to right edge, mirrored) ═══ */}
        <div className="hidden lg:block absolute right-6 bottom-6 w-[240px] pointer-events-none z-0 opacity-85" style={{ transform: 'scaleX(-1)' }}>
          <CafeBistroGraphicScene primary={primary} />
        </div>

        {/* ═══ CENTER — Main Footer Content ═══ */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center py-12 md:py-14 px-4">
          {/* Action CTAs: Download Menu PDF & Rate on Google */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8 md:mt-10 mb-4 max-w-lg mx-auto w-full px-2">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.print()}
              className="download-menu-btn w-full sm:w-auto"
              style={{
                background: `linear-gradient(135deg, ${primary}, ${tc.colors.secondary || primary})`,
                boxShadow: `0 10px 28px -4px ${primary}45`,
              }}
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              <span className="leading-none">Download Menu PDF</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setShowReviewModal(true)}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-white text-gray-800 border-2 border-amber-300 shadow-md hover:shadow-lg hover:border-amber-400 font-bold text-sm transition-all duration-200 cursor-pointer w-full sm:w-auto select-none"
            >
              <Star className="w-4 h-4 text-amber-500 fill-amber-400 flex-shrink-0" />
              <span className="leading-none text-gray-800">⭐ Rate & Review Us</span>
            </motion.button>
          </div>
          <p className="text-[11px] md:text-[12px] text-gray-500 font-medium mb-1">
            Download your menu or tap above to submit your dining rating & feedback!
          </p>

          {/* Delicate Divider */}
          <div className="w-full max-w-[200px] mx-auto flex items-center justify-center gap-3 my-5 opacity-60">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-gray-300 flex-1" />
            <span className="text-xs text-amber-700/60 select-none">🫘</span>
            <div className="h-px bg-gradient-to-l from-transparent via-gray-300 to-gray-300 flex-1" />
          </div>

          {/* Footer Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center">
            {/* Social Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/15 px-4 py-2 rounded-full text-xs font-semibold text-gray-700 border border-amber-500/20 transition-colors"
            >
              <AtSign className="w-3.5 h-3.5" style={{ color: primary }} />
              <span>Follow us <strong style={{ color: primary }}>@{socialHandle}</strong></span>
            </motion.div>

            <span className="hidden md:inline text-gray-300">·</span>

            {/* Subtitle */}
            <div className="text-[11px] text-gray-400 font-medium tracking-wide">
              Digital Menu · Handcrafted for Café Lovers
            </div>
          </div>
        </div>

        {/* Mobile: Show single centered scene */}
        <div className="lg:hidden flex justify-center pb-8 pointer-events-none opacity-60">
          <div className="w-[220px]">
            <CafeBistroGraphicScene primary={primary} />
          </div>
        </div>
      </footer>

      {/* ── Item Detail Modal ── */}
      <ItemModal
        item={selectedItem}
        templateConfig={tc}
        onClose={() => setSelectedItem(null)}
      />

      {/* ── In-App Review & Rating Modal ── */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        restaurantName={rest.name}
        slug={slug}
        googleReviewUrl={rest.googleReviewUrl}
        templateConfig={tc}
      />
    </div>
    </>
  );
}
