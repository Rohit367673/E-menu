/* =====================================================
   CUSTOMER MENU PAGE — Mobile-First Professional Design
   QR-scanned menu optimized for phone screens (375-430px).
   Card-based mobile layout, elegant desktop with alternating sections.
   ===================================================== */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { UtensilsCrossed, AtSign, Download, MapPin, Phone, Star, Plus, Minus } from 'lucide-react';
import type { Restaurant, MenuItem, Category, TemplateConfig } from '../../types/menu';
import ItemModal from '../../components/customer/ItemModal';
import ReviewModal from '../../components/customer/ReviewModal';
import FloatingOrderBar from '../../components/customer/FloatingOrderBar';
import OrderDrawer from '../../components/customer/OrderDrawer';
import { useCart } from '../../contexts/CartContext';
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
        aspectRatio: '4/3',
        borderRadius: '1rem',
        boxShadow: isHovered
          ? '0 20px 45px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)'
          : '0 12px 35px -10px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)',
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
  const [imgErr, setImgErr] = useState(false);
  const isAvail = item.isAvailable !== false && item.available !== false;
  const { addItem, removeItem, getItemQuantity } = useCart();
  const qty = getItemQuantity(item._id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={onClick}
      className="menu-card-item w-full flex items-center justify-between gap-2.5 cursor-pointer select-none"
      style={{ opacity: isAvail ? 1 : 0.4 }}
    >
      {/* Thumbnail */}
      {item.image && !imgErr ? (
        <div className="menu-card-thumb flex-shrink-0">
          <img
            src={getImageUrl(item.image)}
            alt={item.name}
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        </div>
      ) : (
        <div
          className="menu-card-thumb flex items-center justify-center flex-shrink-0"
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
        <div className="flex items-center gap-2">
          <span
            className="font-bold text-[15px]"
            style={{ fontFamily: headingFont, color: primary }}
          >
            ₹{item.price}
          </span>
          {!isAvail && (
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
              Sold out
            </span>
          )}
        </div>
      </div>

      {/* Quick Add / Stepper Button */}
      {isAvail && (
        <div
          className="flex-shrink-0 ml-1"
          onClick={(e) => e.stopPropagation()}
        >
          {qty > 0 ? (
            <div className="flex items-center rounded-xl border border-amber-500/40 bg-amber-50 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => removeItem(item._id)}
                className="w-7 h-7 flex items-center justify-center text-amber-900 hover:bg-amber-100 active:bg-amber-200 transition-colors cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-xs font-black text-amber-950">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => addItem(item)}
                className="w-7 h-7 flex items-center justify-center text-amber-900 hover:bg-amber-100 active:bg-amber-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => addItem(item)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-amber-950 bg-amber-100 hover:bg-amber-200 active:scale-95 border border-amber-300/80 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3 text-amber-800" />
              <span>Add</span>
            </button>
          )}
        </div>
      )}
    </motion.div>
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
  const { addItem, removeItem, getItemQuantity } = useCart();
  const qty = getItemQuantity(item._id);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onClick}
      className="w-full text-left group cursor-pointer flex items-center justify-between select-none"
      style={{
        padding: '8px 12px',
        borderLeft: `3px solid ${isActive ? primary : 'transparent'}`,
        background: isActive ? `${primary}08` : 'transparent',
        borderRadius: 8,
        transition: 'all 0.25s ease',
        opacity: isAvail ? 1 : 0.4,
      }}
    >
      <div className="flex-1 min-w-0 mr-3">
        {/* Name ··· Price */}
        <div className="flex items-baseline gap-2">
          <VegDot type={item.vegType} />
          <span
            className="font-bold text-[16px] md:text-[17px] whitespace-nowrap"
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
              marginBottom: 4,
            }}
          />
          <span className="font-bold text-[15px] md:text-[16px] flex-shrink-0" style={{ fontFamily: headingFont, color: primary }}>
            ₹{item.price}
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-[12px] mt-0.5 line-clamp-1" style={{ color: '#9ca3af', paddingLeft: 22 }}>
            {item.description}
          </p>
        )}

        {!isAvail && (
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider mt-0.5" style={{ paddingLeft: 22 }}>
            Sold out
          </span>
        )}
      </div>

      {/* Quick Add Button */}
      {isAvail && (
        <div
          className="flex-shrink-0 opacity-85 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {qty > 0 ? (
            <div className="flex items-center rounded-xl border border-amber-500/40 bg-amber-50 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => removeItem(item._id)}
                className="w-7 h-7 flex items-center justify-center text-amber-900 hover:bg-amber-100 active:bg-amber-200 transition-colors cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-xs font-black text-amber-950">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => addItem(item)}
                className="w-7 h-7 flex items-center justify-center text-amber-900 hover:bg-amber-100 active:bg-amber-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => addItem(item)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-amber-950 bg-amber-100 hover:bg-amber-200 active:scale-95 border border-amber-300/80 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3 text-amber-800" />
              <span>Add</span>
            </button>
          )}
        </div>
      )}
    </motion.div>
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── Category Label ── */}
      <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${primary}30, transparent)` }} />
        <h2
          className="text-[13px] md:text-[16px] font-bold uppercase tracking-[0.18em] md:tracking-[0.22em] flex-shrink-0"
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
          borderRadius: 16,
          padding: '16px 18px',
          background: '#ffffff',
        }}
      >
        <div
          className="hidden lg:flex gap-6 items-center"
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
          <div className="flex-shrink-0" style={{ width: 240 }}>
            <ShowcaseImage item={displayItem} primary={primary} />
          </div>
        </div>

        {/* Tablet: stacked (image on top) — between md and lg */}
        <div className="lg:hidden">
          <div className="mb-3 mx-auto" style={{ maxWidth: 220 }}>
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

/* ── Animated Café Footer Component ── */
function AnimatedCafeFooter({
  primary,
  secondary,
  headingFont,
  socialHandle,
  onDownloadPdf,
  onOpenReviewModal,
}: {
  primary: string;
  secondary?: string;
  headingFont: string;
  socialHandle: string;
  onDownloadPdf: () => void;
  onOpenReviewModal: () => void;
}) {
  return (
    <footer
      className="w-full border-t border-[#e8dfd5] mt-6 md:mt-10 relative overflow-hidden"
      style={{
        width: '100%',
        background: 'linear-gradient(180deg, #faf7f2 0%, #f4eee5 100%)',
      }}
    >
      {/* Subtle Warm Background Glow */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[480px] h-[200px] rounded-full blur-3xl pointer-events-none"
        style={{ background: primary, opacity: 0.07 }}
      />

      {/* Floating Amber Glow Particles in Footer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/60 blur-[0.5px] animate-ambient-float"
            style={{
              left: `${8 + i * 16}%`,
              bottom: `${10 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.9}s`,
              animationDuration: `${4.5 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      {/* Delicate Curved Fairy Light String on Footer Top */}
      <div className="relative w-full h-6 pointer-events-none z-10 overflow-hidden opacity-35">
        <svg className="w-full h-full text-amber-900/30" preserveAspectRatio="none" viewBox="0 0 100 8">
          <path d="M 0 0 C 20 6, 35 6, 50 2 C 65 6, 80 6, 100 0" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1.5,1.5" />
        </svg>
      </div>

      {/* ═══ Main Footer Content ═══ */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center py-5 md:py-7 px-4">
        {/* Animated Steaming Cup Emblem */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative mb-2.5 flex flex-col items-center justify-center"
        >
          {/* Animated Steam Wisps */}
          <div className="relative h-5 w-8 flex justify-center gap-1.5">
            <span
              className="w-1 h-3.5 rounded-full bg-gradient-to-t from-amber-700/40 to-transparent animate-steam"
              style={{ animationDelay: '0s', animationDuration: '2.2s' }}
            />
            <span
              className="w-1 h-4.5 rounded-full bg-gradient-to-t from-amber-700/50 to-transparent animate-steam"
              style={{ animationDelay: '0.4s', animationDuration: '2.5s' }}
            />
            <span
              className="w-1 h-3 rounded-full bg-gradient-to-t from-amber-700/40 to-transparent animate-steam"
              style={{ animationDelay: '0.8s', animationDuration: '2.1s' }}
            />
          </div>

          {/* Cup & Saucer Badge */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-xs -mt-1"
            style={{
              background: `linear-gradient(135deg, #ffffff, #faf5ee)`,
              border: `1.5px solid ${primary}25`,
            }}
          >
            <span className="text-sm select-none">☕</span>
          </div>
        </motion.div>

        {/* Action CTAs: Download Menu PDF & Rate & Review Us */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-3.5 w-full max-w-md mx-auto mb-2.5">
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDownloadPdf}
            className="download-menu-btn w-full sm:w-auto"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${secondary || primary})`,
              boxShadow: `0 4px 14px -2px ${primary}40`,
              fontFamily: headingFont,
            }}
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            <span>Download Menu PDF</span>
          </motion.button>

          <motion.button
            type="button"
            onClick={onOpenReviewModal}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="review-menu-btn w-full sm:w-auto"
            style={{ fontFamily: headingFont }}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-400 flex-shrink-0" />
            <span>Rate & Review Us</span>
          </motion.button>
        </div>

        <p className="text-[11px] sm:text-xs text-[#786b5f] font-medium max-w-sm mx-auto leading-tight mb-2.5 text-center">
          Download a print-ready copy or tap above to share your dining rating & feedback
        </p>

        {/* Delicate Divider */}
        <div className="w-full max-w-[160px] mx-auto flex items-center justify-center gap-2 my-2.5 opacity-60">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-900/30 to-amber-900/30 flex-1" />
          <span className="text-[10px] text-amber-800/70 select-none">🫘</span>
          <div className="h-px bg-gradient-to-l from-transparent via-amber-900/30 to-amber-900/30 flex-1" />
        </div>

        {/* Footer Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center w-full">
          {/* Social Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 bg-white/90 hover:bg-white px-3 py-1 rounded-full text-[11px] font-semibold text-[#4a3f35] border border-amber-900/15 shadow-2xs transition-colors cursor-default"
          >
            <AtSign className="w-3 h-3" style={{ color: primary }} />
            <span>Follow us <strong style={{ color: primary }}>@{socialHandle}</strong></span>
          </motion.div>

          <span className="hidden sm:inline text-amber-900/30 text-xs">·</span>

          {/* Subtitle */}
          <div className="text-[11px] text-[#8c7e72] font-medium tracking-wide">
            Digital Tableside Menu · Handcrafted for Café Lovers
          </div>
        </div>
      </div>
    </footer>
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

  /* Fetch data with Instant SWR Cache for lightning-fast loading */
  useEffect(() => {
    let isMounted = true;
    const cacheKey = `emenu_cache_${slug || 'default'}`;

    // 1. Instant Cache Retrieval for 0ms initial render
    try {
      const cachedStr = sessionStorage.getItem(cacheKey) || localStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached: PublicMenuData = JSON.parse(cachedStr);
        if (cached?.restaurant && cached?.categories && cached?.items) {
          setData(cached);
          setLoading(false);
          const sorted = [...cached.categories]
            .filter((c) => c.isActive !== false)
            .sort((a, b) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0));
          const visibleSorted = sorted.filter((c) =>
            cached.items.some((i) => i.category === c._id && i.isAvailable !== false && i.available !== false)
          );
          if (visibleSorted.length > 0) {
            setActiveCatId(visibleSorted[0]._id);
          } else if (sorted.length > 0) {
            setActiveCatId(sorted[0]._id);
          }
        }
      }
    } catch {
      // Ignore cache parse error
    }

    // 2. Fresh Network Fetch in Background
    (async () => {
      try {
        const serverHost = (API_BASE || '').replace(/\/api\/?$/, '');
        const path = slug ? `/api/restaurants/${slug}/public` : '/api/restaurants/public';
        const url = `${serverHost}${path}`;
        const res = await axios.get<{
          success: boolean;
          data: { restaurant: Restaurant; categories: (Category & { items: MenuItem[] })[] };
        }>(url);
        if (!isMounted) return;

        const { restaurant, categories } = res.data.data;
        const items = categories.flatMap((c) => c.items || []);
        const payload: PublicMenuData = { restaurant, categories, items };
        setData(payload);

        // Store in cache for instant re-loads
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(payload));
          localStorage.setItem(cacheKey, JSON.stringify(payload));
        } catch {}

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
        if (!isMounted) return;
        if (!data) {
          setError(axios.isAxiosError(err) && err.response?.status === 404
            ? 'This menu could not be found.'
            : 'Something went wrong. Please try again.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
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
    const scrollContainer = (tabsRef.current.querySelector('.category-tabs-row') || tabsRef.current) as HTMLElement;
    const activeTab = tabsRef.current.querySelector(`[data-cat="${activeCatId}"]`) as HTMLElement;
    if (scrollContainer && activeTab) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      const relativeTabLeft = tabRect.left - containerRect.left + scrollContainer.scrollLeft;
      const targetScrollLeft = relativeTabLeft - (containerRect.width / 2) + (tabRect.width / 2);
      scrollContainer.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth',
      });
    }
  }, [activeCatId]);

  if (loading) return <SkeletonLoader />;
  if (error || !data) return <ErrorState message={error || 'Something went wrong.'} />;

  const rest = {
    ...data.restaurant,
    name:
      !data.restaurant.name ||
      data.restaurant.name === "Client's Restaurant" ||
      data.restaurant.name === 'ChillCups Café'
        ? 'Sukoon Cafe & Bar'
        : data.restaurant.name,
  };
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
    <div className="screen-ui min-h-screen w-full relative" style={{ backgroundColor: '#fefefe', fontFamily: bodyFont }}>

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
        <div className="md:hidden relative z-20 flex flex-col items-center justify-center text-center px-4 pt-5 pb-2 w-full mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-2 flex items-center justify-center w-full mx-auto text-center"
          >
            {rest.logo ? (
              <div className="w-12 h-12 rounded-full overflow-hidden shadow-md mx-auto"
                style={{ border: `2px solid ${primary}18` }}
              >
                <img src={getImageUrl(rest.logo)} alt={rest.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md mx-auto"
                style={{ background: `linear-gradient(135deg, ${primary}18, ${primary}08)`, border: `2px solid ${primary}10` }}
              >
                <UtensilsCrossed className="w-6 h-6" style={{ color: primary }} />
              </div>
            )}
          </motion.div>
          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-[22px] font-bold leading-tight text-center w-full"
            style={{ fontFamily: headingFont, color: tc.colors.text }}
          >
            {rest.name}
          </motion.h1>
          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[12px] mt-0.5 italic font-light leading-relaxed max-w-xs text-center mx-auto"
            style={{ color: tc.colors.textSecondary, fontFamily: headingFont }}
          >
            {rest.description || 'Welcome to our menu'}
          </motion.p>
        </div>

        {/* Desktop header: centered brand identity */}
        <div className="hidden md:flex flex-col w-full mx-auto px-4 md:px-6 pt-6 pb-4 md:pt-8 md:pb-5 items-center justify-center text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-2.5 flex items-center justify-center w-full mx-auto text-center"
          >
            {rest.logo ? (
              <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg mx-auto"
                style={{ border: `3px solid ${primary}18` }}
              >
                <img src={getImageUrl(rest.logo)} alt={rest.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg mx-auto"
                style={{ background: `linear-gradient(135deg, ${primary}18, ${primary}08)`, border: `2px solid ${primary}10` }}
              >
                <UtensilsCrossed className="w-8 h-8" style={{ color: primary }} />
              </div>
            )}
          </motion.div>

          {/* Restaurant Name + Tagline */}
          <div className="flex flex-col items-center justify-center text-center w-full mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-[30px] md:text-[34px] font-bold leading-tight text-center w-full"
              style={{ fontFamily: headingFont, color: tc.colors.text }}
            >
              {rest.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[14px] md:text-[15px] mt-1 italic max-w-xl font-light leading-relaxed text-center mx-auto"
              style={{ color: tc.colors.textSecondary, fontFamily: headingFont }}
            >
              {rest.description || 'Welcome to our menu'}
            </motion.p>
            {(rest.address || rest.phone) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-4 mt-2 w-full mx-auto"
              >
                {rest.address && (
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <MapPin className="w-3 h-3" /> {rest.address}
                  </span>
                )}
                {rest.phone && (
                  <a href={`tel:${rest.phone}`} className="flex items-center gap-1.5 text-[11px]" style={{ color: primary }}>
                    <Phone className="w-3 h-3" /> {rest.phone}
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
      <main className="max-w-5xl w-full mx-auto px-4 md:px-6 pt-2 pb-6 md:pt-3 md:pb-8">
        {/* Mobile Page-Based Menu Booklet */}
        <div
          className="md:hidden flex flex-col flex-1 mt-2.5"
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
                    dragDirectionLock
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.25}
                    onDragEnd={(_e, info) => {
                      const swipeThreshold = 45;
                      const velocityThreshold = 350;
                      if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
                        goToNextCategory();
                      } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
                        goToPrevCategory();
                      }
                    }}
                  >
                    {/* Sketch Illustration Banner */}
                    <div className="w-full h-32 rounded-xl overflow-hidden mb-3 border border-[#c8a97e]/30 shadow-sm relative">
                      <img
                        src={getImageUrl(sketchPath)}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent flex items-end p-3.5">
                        <h2 className="text-white text-[16px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: headingFont }}>
                          {cat.icon && <span>{cat.icon}</span>}
                          {cat.name}
                        </h2>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      {catItems.length === 0 ? (
                        <div className="text-center py-8 text-xs text-text-secondary/60 font-medium">
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
                    <div className="flex items-center justify-between mt-5 text-[11px] text-text-secondary/80 font-bold pt-3 border-t border-border/40 uppercase tracking-wider">
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
        <div className="hidden md:flex md:flex-col gap-5 md:gap-7">
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
      </main>

      {/* ═══════════ ANIMATED CAFÉ FOOTER ═══════════ */}
      <AnimatedCafeFooter
        primary={primary}
        secondary={tc.colors.secondary}
        headingFont={headingFont}
        socialHandle={socialHandle}
        onDownloadPdf={() => window.print()}
        onOpenReviewModal={() => setShowReviewModal(true)}
      />

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

      {/* ── Tableside Floating Order Bar ── */}
      <FloatingOrderBar
        primaryColor={primary}
        headingFont={headingFont}
      />

      {/* ── Tableside Order Checkout & Flow Ordering Drawer ── */}
      <OrderDrawer
        primaryColor={primary}
        headingFont={headingFont}
        restaurantName={rest.name}
        slug={slug}
      />
    </div>
    </>
  );
}
