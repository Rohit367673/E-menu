/* =====================================================
   CUSTOMER MENU PAGE — Mobile-First Professional Design
   QR-scanned menu optimized for phone screens (375-430px).
   Card-based mobile layout, elegant desktop with alternating sections.
   ===================================================== */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { UtensilsCrossed, AtSign, Download, MapPin, Phone } from 'lucide-react';
import type { Restaurant, MenuItem, Category, TemplateConfig } from '../../types/menu';
import ItemModal from '../../components/customer/ItemModal';
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
    <span
      className="inline-flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, border: `1.5px solid ${c}`, borderRadius: 2 }}
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
    >
      <span style={{ width: innerSize, height: innerSize, borderRadius: '50%', backgroundColor: c }} />
    </span>
  );
}

/* ── Showcase Image — crossfades when user hovers an item (Desktop only) ── */
function ShowcaseImage({ item, primary }: { item: MenuItem | undefined; primary: string }) {
  const [imgErr, setImgErr] = useState(false);
  useEffect(() => { setImgErr(false); }, [item?._id]);

  return (
    <div
      className="relative overflow-hidden w-full"
      style={{
        aspectRatio: '4/5',
        borderRadius: '1.25rem',
        boxShadow: '0 20px 50px -12px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
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
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className="w-full h-full object-cover absolute inset-0"
          />
        ) : (
          <motion.div
            key="ph"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${primary}15, ${primary}05)` }}
          >
            <UtensilsCrossed className="w-14 h-14" style={{ color: primary, opacity: 0.15 }} />
          </motion.div>
        )}
      </AnimatePresence>
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
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((j) => (
            <div key={j} className="flex items-center gap-3 p-3">
              <div className="w-[76px] h-[76px] bg-gray-100 rounded-2xl" />
              <div className="flex-1 space-y-2">
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

/* ── Glowing Hanging Bulbs Decoration (hidden on mobile) ── */
function HangingBulbs() {
  const bulbs = [
    { left: '8%', height: 45, delay: '0s' },
    { left: '22%', height: 70, delay: '0.6s' },
    { left: '78%', height: 68, delay: '1.5s' },
    { left: '92%', height: 43, delay: '0.4s' },
  ];

  return (
    <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-20 overflow-hidden no-print hidden md:block">
      {/* Wire string */}
      <svg className="absolute top-0 left-0 w-full h-12 text-gray-800/10" preserveAspectRatio="none" viewBox="0 0 100 10">
        <path d="M 0 0 C 15 3, 35 3, 50 0 C 65 3, 85 3, 100 0" fill="none" stroke="currentColor" strokeWidth="0.2" />
      </svg>

      {bulbs.map((b, idx) => (
        <div
          key={idx}
          className="absolute flex flex-col items-center origin-top animate-sway"
          style={{
            left: b.left,
            animationDelay: b.delay,
            animationDuration: '4.5s',
          }}
        >
          {/* Cord */}
          <div className="w-[1.5px] bg-[#4b5563]" style={{ height: b.height }} />
          {/* Cap */}
          <div className="w-3.5 h-2.5 bg-[#374151] rounded-t-xs" style={{ borderBottom: '1px solid #1f2937' }} />
          {/* Bulb Body */}
          <div
            className="w-6 h-8 rounded-b-full rounded-t-sm relative flex items-center justify-center animate-bulb-glow"
            style={{
              background: 'radial-gradient(circle at center, #ffffff 10%, #fef3c7 40%, #fbbf24 85%, #d97706 100%)',
              animationDelay: b.delay,
              animationDuration: '2.5s',
            }}
          >
            {/* Filament */}
            <div className="w-[1.5px] h-2.5 bg-amber-100/90 rounded-full shadow-[0_0_3px_#fff]" />
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
  const tabsRef = useRef<HTMLDivElement>(null);

  /* Fetch data */
  useEffect(() => {
    (async () => {
      try {
        const path = slug ? `/api/restaurants/${slug}/public` : '/api/restaurants/public';
        const url = API_BASE ? `${API_BASE}${path}` : path;
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
        className="relative w-full safe-top"
        style={{
          background: `radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.14) 0%, rgba(255, 255, 255, 0) 70%), linear-gradient(160deg, ${primary}06 0%, #ffffff 50%, ${tc.colors.secondary || primary}04 100%)`,
        }}
      >
        {/* Glowing Hanging Bulbs — hidden on mobile */}
        <HangingBulbs />

        {/* Decorative blob */}
        <div
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl hidden md:block"
          style={{ background: primary, opacity: 0.04 }}
        />

        {/* Mobile header: compact centered stack */}
        <div className="md:hidden flex flex-col items-center text-center px-5 pt-6 pb-3">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-3"
          >
            {rest.logo ? (
              <div className="w-14 h-14 rounded-full overflow-hidden shadow-md"
                style={{ border: `2px solid ${primary}18` }}
              >
                <img src={getImageUrl(rest.logo)} alt={rest.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-md"
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
            className="text-[26px] font-bold leading-tight"
            style={{ fontFamily: headingFont, color: tc.colors.text }}
          >
            {rest.name}
          </motion.h1>
          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[13px] mt-1.5 italic font-light leading-relaxed max-w-xs"
            style={{ color: tc.colors.textSecondary, fontFamily: headingFont }}
          >
            {rest.description || 'Welcome to our menu'}
          </motion.p>
        </div>

        {/* Desktop header: centered brand identity */}
        <div className="hidden md:flex flex-col max-w-5xl w-full mx-auto px-4 md:px-6 pt-16 pb-10 items-center justify-center text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-4"
          >
            {rest.logo ? (
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg"
                style={{ border: `3px solid ${primary}18` }}
              >
                <img src={getImageUrl(rest.logo)} alt={rest.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${primary}18, ${primary}08)`, border: `2px solid ${primary}10` }}
              >
                <UtensilsCrossed className="w-9 h-9" style={{ color: primary }} />
              </div>
            )}
          </motion.div>

          {/* Restaurant Name + Tagline */}
          <div className="flex flex-col items-center text-center">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-[40px] font-bold leading-tight"
              style={{ fontFamily: headingFont, color: tc.colors.text }}
            >
              {rest.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[16px] mt-2 italic max-w-xl font-light leading-relaxed text-center"
              style={{ color: tc.colors.textSecondary, fontFamily: headingFont }}
            >
              {rest.description || 'Welcome to our menu'}
            </motion.p>
            {(rest.address || rest.phone) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-4 mt-3"
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
                    <div className="flex-1 space-y-1">
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
        <div className="hidden md:block space-y-14 md:space-y-20">
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
      <footer className="w-full bg-white border-t border-gray-100 pt-8 pb-16 md:pt-10 md:pb-16">
        <div className="max-w-5xl w-full mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
            
            {/* Social Handle */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 text-gray-500 text-xs md:text-sm font-medium order-2 md:order-1"
            >
              <AtSign className="w-4 h-4 text-gray-400" />
              <span>Follow us <strong style={{ color: primary }}>@{socialHandle}</strong></span>
            </motion.div>

            {/* Brand / Copyright */}
            <div className="text-center order-3 md:order-2">
              <span className="text-[12px] md:text-xs text-gray-400 font-medium tracking-wide">
                Digital Menu · <span className="font-semibold text-gray-600">{rest.name}</span>
              </span>
            </div>

            {/* Download Menu Button */}
            <div className="order-1 md:order-3 w-full md:w-auto flex justify-center">
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.04, translateY: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-bold text-white text-xs md:text-sm tracking-wide shadow-md hover:shadow-lg transition-all cursor-pointer uppercase"
                style={{
                  background: `linear-gradient(135deg, ${primary}, ${tc.colors.secondary || primary})`,
                  boxShadow: `0 4px 14px ${primary}40`,
                }}
              >
                <Download className="w-4 h-4" />
                <span>Download Menu</span>
              </motion.button>
            </div>

          </div>
        </div>
      </footer>

      {/* ── Item Detail Modal ── */}
      <ItemModal
        item={selectedItem}
        templateConfig={tc}
        onClose={() => setSelectedItem(null)}
      />
    </div>
    </>
  );
}
