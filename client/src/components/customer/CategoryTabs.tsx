import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import type { Category, TemplateConfig } from '../../types/menu';

interface CategoryTabsProps {
  categories: Category[];
  templateConfig: TemplateConfig;
  activeCategoryId: string;
  onCategoryChange: (id: string) => void;
}

export default function CategoryTabs({
  categories,
  templateConfig,
  activeCategoryId,
  onCategoryChange,
}: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const primary = templateConfig.colors.primary || '#f97316';
  const bg = templateConfig.colors.background || '#ffffff';

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 360);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabClick = useCallback(
    (categoryId: string) => {
      onCategoryChange(categoryId);
      const section = document.getElementById(`category-${categoryId}`);
      if (section) {
        const yOffset = -72;
        const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    },
    [onCategoryChange]
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    const btn = scrollRef.current.querySelector(`[data-cat="${activeCategoryId}"]`);
    if (btn) {
      (btn as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeCategoryId]);

  if (!categories.length) return null;

  return (
    <motion.div
      className="sticky top-0 z-40"
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      style={{
        backgroundColor: isSticky ? `${bg}f0` : bg,
        backdropFilter: isSticky ? 'blur(24px) saturate(180%)' : 'none',
        WebkitBackdropFilter: isSticky ? 'blur(24px) saturate(180%)' : 'none',
        boxShadow: isSticky ? `0 1px 0 ${primary}18, 0 4px 20px rgba(0,0,0,0.06)` : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-2 px-4 py-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((cat) => {
          const isActive = cat._id === activeCategoryId;
          return (
            <button
              key={cat._id}
              data-cat={cat._id}
              onClick={() => handleTabClick(cat._id)}
              className="relative flex-shrink-0 px-5 py-2 text-sm font-semibold rounded-full transition-all duration-250 whitespace-nowrap cursor-pointer outline-none focus:outline-none"
              style={{
                fontFamily: templateConfig.fonts.body,
                color: isActive ? '#fff' : templateConfig.colors.textSecondary,
                backgroundColor: isActive ? primary : 'transparent',
                boxShadow: isActive ? `0 4px 16px ${primary}45, 0 2px 6px ${primary}30` : 'none',
                border: isActive ? 'none' : `1.5px solid ${templateConfig.colors.text}12`,
                transform: isActive ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
              {cat.name}
            </button>
          );
        })}
      </div>
      {/* Bottom line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${primary}20, transparent)` }}
      />
    </motion.div>
  );
}
