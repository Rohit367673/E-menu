import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, UtensilsCrossed } from 'lucide-react';
import VegBadge from './VegBadge';
import type { MenuItem, TemplateConfig } from '../../types/menu';

interface SearchOverlayProps {
  items: MenuItem[];
  templateConfig: TemplateConfig;
  onSelectItem: (item: MenuItem) => void;
}

export default function SearchOverlay({ items, templateConfig, onSelectItem }: SearchOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.isAvailable &&
        (item.name.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)))
    );
  }, [query, items]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    },
    [handleClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  return (
    <>
      {/* Floating Search Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white"
        style={{
          background: `linear-gradient(135deg, ${templateConfig.colors.primary}, ${templateConfig.colors.accent || templateConfig.colors.primary})`,
        }}
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      >
        <Search className="w-6 h-6" />
      </motion.button>

      {/* Search Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-xl"
              onClick={handleClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Search Content */}
            <motion.div
              className="relative z-10 flex flex-col h-full max-w-2xl mx-auto w-full px-4 pt-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Search Input */}
              <div className="relative mb-4">
                <div className="flex items-center bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                  <Search className="w-5 h-5 text-white/60 ml-4 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search menu items..."
                    className="flex-1 bg-transparent text-white placeholder-white/40 px-4 py-4 outline-none text-lg"
                    style={{ fontFamily: templateConfig.fonts.body }}
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="p-2 mr-2 text-white/60 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="absolute -right-0 -top-0 mt-[-2.5rem] text-white/60 hover:text-white p-2 transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto pb-8" style={{ scrollbarWidth: 'none' }}>
                {query.trim() === '' && (
                  <div className="flex flex-col items-center justify-center pt-20 text-white/40">
                    <Search className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium" style={{ fontFamily: templateConfig.fonts.body }}>
                      Start typing to search
                    </p>
                    <p className="text-sm mt-1 opacity-60">Search by name, description, or tags</p>
                  </div>
                )}

                {query.trim() !== '' && filteredItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center pt-20 text-white/40">
                    <UtensilsCrossed className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium" style={{ fontFamily: templateConfig.fonts.body }}>
                      No items found
                    </p>
                    <p className="text-sm mt-1 opacity-60">Try a different search term</p>
                  </div>
                )}

                {filteredItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-white/40 text-sm mb-3">
                      {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} found
                    </p>
                    {filteredItems.map((item, index) => (
                      <motion.button
                        key={item._id}
                        className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all text-left"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => {
                          onSelectItem(item);
                          handleClose();
                        }}
                      >
                        {/* Mini image */}
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${templateConfig.colors.primary}30, ${templateConfig.colors.secondary || templateConfig.colors.primary}20)`,
                            }}
                          >
                            <UtensilsCrossed className="w-5 h-5 opacity-30 text-white" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <VegBadge type={item.vegType} />
                            <h4
                              className="text-white font-semibold text-sm truncate"
                              style={{ fontFamily: templateConfig.fonts.heading }}
                            >
                              {item.name}
                            </h4>
                          </div>
                          {item.description && (
                            <p className="text-white/40 text-xs truncate mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          {item.discountPrice && item.discountPrice < item.price ? (
                            <div>
                              <span className="text-sm font-bold" style={{ color: templateConfig.colors.accent }}>
                                ₹{item.discountPrice.toFixed(0)}
                              </span>
                              <span className="text-xs text-white/30 line-through ml-1">
                                ₹{item.price.toFixed(0)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-white">
                              ₹{item.price.toFixed(0)}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
