/* ====================================================
   Template 3: Dark Premium Cafe Menu
   - Dark background, amber/gold accents
   - Full-width category banners, glowing borders
   ==================================================== */

import type { Restaurant, Category, MenuItem } from '../../types/menu';

interface TemplateProps {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  primaryColor: string;
}

function VegDot({ type }: { type?: string }) {
  const isVeg = !type || type === 'veg';
  return (
    <span
      style={{
        display: 'inline-block',
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        backgroundColor: isVeg ? '#4ade80' : '#f87171',
        flexShrink: 0,
      }}
    />
  );
}

export default function Template3Dark({ restaurant, categories, items }: TemplateProps) {
  const sortedCats = [...categories]
    .filter((c) => c.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const getItems = (catId: string) =>
    items.filter((i) => i.category === catId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const dark = '#0c0c0f';
  const card = '#1e1e22';
  const accent = '#f59e0b'; // amber gold
  const textLight = '#f3f4f6';
  const textMuted = '#9ca3af';

  return (
    <div
      style={{
        width: '794px',
        minHeight: '1123px',
        backgroundColor: dark,
        fontFamily: '"Inter", "Helvetica Neue", sans-serif',
        color: textLight,
        position: 'relative',
      }}
    >
      {/* Gradient header glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '300px',
          background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${accent}18, transparent)`,
          pointerEvents: 'none',
        }}
      />

      {/* Top border line */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      {/* Header */}
      <div style={{ padding: '40px 48px 28px', textAlign: 'center', borderBottom: `1px solid ${accent}20` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          {restaurant.logo && (
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '14px',
                overflow: 'hidden',
                border: `1.5px solid ${accent}40`,
                boxShadow: `0 0 20px ${accent}25`,
                flexShrink: 0,
              }}
            >
              <img src={restaurant.logo} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ textAlign: restaurant.logo ? 'left' : 'center' }}>
            <p
              style={{
                fontSize: '10px',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                color: accent,
                margin: '0 0 4px',
                fontWeight: 600,
              }}
            >
              ✦ Premium Menu ✦
            </p>
            <h1
              style={{
                fontSize: '34px',
                fontWeight: 900,
                margin: 0,
                letterSpacing: '-0.5px',
                color: textLight,
              }}
            >
              {restaurant.name}
            </h1>
            {restaurant.description && (
              <p style={{ margin: '5px 0 0', fontSize: '12px', color: textMuted }}>{restaurant.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Motto strip */}
      <div
        style={{
          padding: '8px 48px',
          background: `linear-gradient(90deg, ${dark}, ${accent}10, ${dark})`,
          textAlign: 'center',
          borderBottom: `1px solid ${accent}15`,
        }}
      >
        <span style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: `${accent}80` }}>
          Crafted with passion · Served with love
        </span>
      </div>

      {/* Categories */}
      <div style={{ padding: '24px 48px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {sortedCats.map((cat) => {
          const catItems = getItems(cat._id);
          if (catItems.length === 0) return null;

          return (
            <div key={cat._id}>
              {/* Category banner */}
              <div
                style={{
                  padding: '8px 18px',
                  marginBottom: '14px',
                  borderRadius: '8px',
                  borderLeft: `3px solid ${accent}`,
                  backgroundColor: `${accent}08`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    color: accent,
                  }}
                >
                  {cat.icon && <span style={{ marginRight: '6px' }}>{cat.icon}</span>}
                  {cat.name}
                </span>
                {cat.description && (
                  <span style={{ fontSize: '11px', color: textMuted, fontStyle: 'italic' }}>{cat.description}</span>
                )}
              </div>

              {/* Items grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {catItems.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: card,
                      border: `1px solid ${accent}12`,
                      alignItems: 'flex-start',
                    }}
                  >
                    {item.image ? (
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: `1px solid ${accent}20`,
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '10px',
                          flexShrink: 0,
                          background: `${accent}10`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                        }}
                      >
                        🍽️
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                        <VegDot type={item.vegType} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: textLight, lineHeight: 1.3 }}>
                          {item.name}
                        </span>
                      </div>
                      {item.description && (
                        <p
                          style={{
                            fontSize: '10px',
                            color: textMuted,
                            margin: '0 0 6px',
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '15px',
                            fontWeight: 900,
                            color: accent,
                          }}
                        >
                          ₹{item.price}
                        </span>
                        {item.discountPrice && item.discountPrice < item.price && (
                          <span style={{ fontSize: '10px', color: '#f87171', textDecoration: 'line-through' }}>
                            ₹{item.discountPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: `1px solid ${accent}20`,
          padding: '16px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(90deg, transparent, ${accent}06, transparent)`,
        }}
      >
        <span style={{ fontSize: '10px', color: `${accent}60`, letterSpacing: '2px', textTransform: 'uppercase' }}>
          {restaurant.name}
        </span>
        {restaurant.phone && (
          <span style={{ fontSize: '10px', color: textMuted }}>📞 {restaurant.phone}</span>
        )}
        <span style={{ fontSize: '10px', color: `${accent}60` }}>Digital Menu</span>
      </div>

      {/* Bottom border line */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
    </div>
  );
}
