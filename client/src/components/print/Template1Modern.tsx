/* ====================================================
   Template 1: Modern Cafe Menu
   - Clean white, bold headings, 2-column grid
   - Accent color bar on category
   ==================================================== */

import type { Restaurant, Category, MenuItem } from '../../types/menu';

interface TemplateProps {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  primaryColor: string;
}

function VegIndicator({ type }: { type?: 'veg' | 'nonveg' }) {
  const isVeg = !type || type === 'veg';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '12px',
        height: '12px',
        borderRadius: '2px',
        border: `1.5px solid ${isVeg ? '#16a34a' : '#dc2626'}`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: isVeg ? '#16a34a' : '#dc2626',
          display: 'block',
        }}
      />
    </span>
  );
}

export default function Template1Modern({ restaurant, categories, items, primaryColor }: TemplateProps) {
  const sortedCats = [...categories]
    .filter((c) => c.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const getItems = (catId: string) =>
    items.filter((i) => i.category === catId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div
      style={{
        width: '794px',
        minHeight: '1123px',
        backgroundColor: '#ffffff',
        fontFamily: '"Inter", "Helvetica Neue", sans-serif',
        color: '#1f2937',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: '6px', background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}88)` }} />

      {/* Header */}
      <div style={{ padding: '32px 48px 24px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {restaurant.logo && (
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              style={{ width: '72px', height: '72px', borderRadius: '16px', objectFit: 'cover', border: `2px solid ${primaryColor}25` }}
            />
          )}
          <div>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 900,
                margin: 0,
                color: '#111827',
                letterSpacing: '-0.5px',
              }}
            >
              {restaurant.name}
            </h1>
            {restaurant.description && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{restaurant.description}</p>
            )}
            {restaurant.address && (
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#9ca3af' }}>📍 {restaurant.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Menu title strip */}
      <div
        style={{
          padding: '10px 48px',
          backgroundColor: `${primaryColor}08`,
          borderBottom: `1px solid ${primaryColor}15`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ width: '3px', height: '18px', borderRadius: '2px', backgroundColor: primaryColor }} />
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: primaryColor }}>
          Our Menu
        </span>
      </div>

      {/* Categories */}
      <div style={{ padding: '24px 48px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {sortedCats.map((cat) => {
          const catItems = getItems(cat._id);
          if (catItems.length === 0) return null;

          return (
            <div key={cat._id}>
              {/* Category header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '16px',
                  paddingBottom: '10px',
                  borderBottom: `2px solid ${primaryColor}`,
                }}
              >
                <span style={{ fontSize: '17px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#111827' }}>
                  {cat.icon && <span style={{ marginRight: '6px' }}>{cat.icon}</span>}
                  {cat.name}
                </span>
                {cat.description && (
                  <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>{cat.description}</span>
                )}
              </div>

              {/* Items grid: 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {catItems.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid #f3f4f6',
                      alignItems: 'flex-start',
                      backgroundColor: '#fafafa',
                    }}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                        <VegIndicator type={item.vegType} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{item.name}</span>
                      </div>
                      {item.description && (
                        <p
                          style={{
                            fontSize: '11px',
                            color: '#6b7280',
                            margin: '0 0 5px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                      <span style={{ fontSize: '14px', fontWeight: 800, color: primaryColor }}>₹{item.price}</span>
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
          borderTop: '1px solid #f3f4f6',
          padding: '14px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{restaurant.name} · Digital Menu</span>
        {restaurant.phone && (
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>📞 {restaurant.phone}</span>
        )}
      </div>

      {/* Bottom accent bar */}
      <div style={{ height: '4px', background: `linear-gradient(90deg, ${primaryColor}00, ${primaryColor}, ${primaryColor}00)` }} />
    </div>
  );
}
