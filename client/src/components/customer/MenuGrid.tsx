import { motion } from 'motion/react';
import ItemCard from './ItemCard';
import type { MenuItem, Category, TemplateConfig } from '../../types/menu';

interface MenuGridProps {
  categories: Category[];
  items: MenuItem[];
  templateConfig: TemplateConfig;
  onSelectItem: (item: MenuItem) => void;
}

export default function MenuGrid({ categories, items, templateConfig, onSelectItem }: MenuGridProps) {
  const primary = templateConfig.colors.primary || '#f97316';

  const getItems = (catId: string) =>
    items
      .filter((i) => i.category === catId && i.isAvailable !== false && i.available !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="px-4 md:px-6 pb-32">
      {categories.map((category, catIdx) => {
        const catItems = getItems(category._id);
        if (catItems.length === 0) return null;

        return (
          <motion.section
            key={category._id}
            id={`category-${category._id}`}
            className="mb-14 scroll-mt-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.6, delay: catIdx * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Category Header */}
            <div className="mb-6 flex items-end gap-4">
              <div className="flex-1">
                {/* Section label */}
                <div className="flex items-center gap-3 mb-1">
                  {/* Numbered marker */}
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black"
                    style={{
                      background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                      boxShadow: `0 3px 10px ${primary}40`,
                    }}
                  >
                    {catIdx + 1}
                  </div>

                  <h2
                    className="text-2xl md:text-3xl font-black tracking-tight"
                    style={{
                      fontFamily: templateConfig.fonts.heading,
                      color: templateConfig.colors.text,
                    }}
                  >
                    {category.icon && <span className="mr-2">{category.icon}</span>}
                    {category.name}
                  </h2>
                </div>

                {category.description && (
                  <p
                    className="text-sm ml-10 leading-relaxed"
                    style={{
                      fontFamily: templateConfig.fonts.body,
                      color: templateConfig.colors.textSecondary,
                      opacity: 0.65,
                    }}
                  >
                    {category.description}
                  </p>
                )}
              </div>

              {/* Item count badge */}
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 mb-1"
                style={{
                  backgroundColor: `${primary}10`,
                  color: primary,
                  border: `1px solid ${primary}25`,
                }}
              >
                {catItems.length} items
              </span>
            </div>

            {/* Divider */}
            <div className="mb-6 ml-10 h-px" style={{ background: `linear-gradient(to right, ${primary}30, transparent)` }} />

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {catItems.map((item, i) => (
                <ItemCard
                  key={item._id}
                  item={item}
                  templateConfig={templateConfig}
                  index={i}
                  onSelect={onSelectItem}
                />
              ))}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}
