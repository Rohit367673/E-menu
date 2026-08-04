/* ====================================================
   Template 2: Luxury Restaurant Menu
   - Cream/ivory, serif typography, classic dotted lines
   - Elegant dividers, no images (classic bistro style)
   ==================================================== */

import type { Restaurant, Category, MenuItem } from '../../types/menu';

interface TemplateProps {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  primaryColor: string;
}

function DottedLine({ name, price, description, vegType }: {
  name: string;
  price: number;
  description?: string;
  vegType?: string;
}) {
  const isVeg = !vegType || vegType === 'veg';
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        {/* Veg dot */}
        <span
          style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isVeg ? '#16a34a' : '#dc2626',
            flexShrink: 0,
            marginBottom: '1px',
          }}
        />
        <span
          style={{
            fontSize: '14px',
            fontFamily: '"Georgia", serif',
            fontWeight: 600,
            color: '#2c1810',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </span>
        <span
          style={{
            flex: 1,
            borderBottom: '1px dotted #c4a882',
            margin: '0 6px 3px',
            minWidth: '20px',
          }}
        />
        <span
          style={{
            fontSize: '14px',
            fontFamily: '"Georgia", serif',
            fontWeight: 700,
            color: '#2c1810',
            whiteSpace: 'nowrap',
          }}
        >
          ₹{price}
        </span>
      </div>
      {description && (
        <p
          style={{
            margin: '2px 0 0 12px',
            fontSize: '11px',
            fontStyle: 'italic',
            color: '#8b7355',
            fontFamily: '"Georgia", serif',
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export default function Template2Luxury({ restaurant, categories, items }: TemplateProps) {
  const sortedCats = [...categories]
    .filter((c) => c.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const getItems = (catId: string) =>
    items.filter((i) => i.category === catId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const cream = '#fdf8f0';
  const darkBrown = '#2c1810';
  const gold = '#c4a254';

  return (
    <div
      style={{
        width: '794px',
        minHeight: '1123px',
        backgroundColor: cream,
        fontFamily: '"Georgia", "Times New Roman", serif',
        color: darkBrown,
        position: 'relative',
      }}
    >
      {/* Decorative border frame */}
      <div
        style={{
          position: 'absolute',
          inset: '12px',
          border: `1px solid ${gold}55`,
          borderRadius: '2px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '16px',
          border: `0.5px solid ${gold}30`,
          borderRadius: '2px',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ padding: '48px 64px 32px', textAlign: 'center', borderBottom: `1px solid ${gold}40` }}>
        {restaurant.logo && (
          <div style={{ marginBottom: '16px' }}>
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `2px solid ${gold}`,
                margin: '0 auto',
              }}
            />
          </div>
        )}

        {/* Decorative top ornament */}
        <div style={{ color: gold, fontSize: '20px', letterSpacing: '8px', marginBottom: '8px' }}>✦ ✦ ✦</div>

        <h1
          style={{
            fontSize: '36px',
            fontWeight: 400,
            margin: '0 0 6px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: darkBrown,
            fontFamily: '"Georgia", serif',
          }}
        >
          {restaurant.name}
        </h1>

        {restaurant.description && (
          <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#8b7355', margin: '6px 0 0' }}>
            {restaurant.description}
          </p>
        )}

        {/* Decorative line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '20px',
          }}
        >
          <div style={{ flex: 1, maxWidth: '100px', height: '1px', backgroundColor: gold }} />
          <span style={{ color: gold, fontSize: '16px' }}>✦</span>
          <div style={{ flex: 1, maxWidth: '100px', height: '1px', backgroundColor: gold }} />
        </div>

        <p
          style={{
            fontSize: '10px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: gold,
            marginTop: '10px',
          }}
        >
          À La Carte Menu
        </p>
      </div>

      {/* Categories — 2 columns */}
      <div
        style={{
          padding: '32px 64px 40px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px 48px',
        }}
      >
        {sortedCats.map((cat) => {
          const catItems = getItems(cat._id);
          if (catItems.length === 0) return null;

          return (
            <div key={cat._id}>
              {/* Category name */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h2
                  style={{
                    fontSize: '15px',
                    fontWeight: 400,
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    color: darkBrown,
                    margin: '0 0 8px',
                  }}
                >
                  {cat.icon && <span style={{ marginRight: '6px' }}>{cat.icon}</span>}
                  {cat.name}
                </h2>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ flex: 1, height: '0.5px', backgroundColor: `${gold}80` }} />
                  <span style={{ color: gold, fontSize: '10px' }}>✦</span>
                  <div style={{ flex: 1, height: '0.5px', backgroundColor: `${gold}80` }} />
                </div>
              </div>

              {/* Items */}
              {catItems.map((item) => (
                <DottedLine
                  key={item._id}
                  name={item.name}
                  price={item.price}
                  description={item.description}
                  vegType={item.vegType}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: `1px solid ${gold}40`,
          padding: '20px 64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ color: gold, fontSize: '14px', letterSpacing: '6px' }}>✦ ✦ ✦</div>
        {(restaurant.phone || restaurant.address) && (
          <div style={{ textAlign: 'center' }}>
            {restaurant.address && (
              <p style={{ fontSize: '10px', color: '#8b7355', margin: '0 0 2px', letterSpacing: '0.5px' }}>
                {restaurant.address}
              </p>
            )}
            {restaurant.phone && (
              <p style={{ fontSize: '10px', color: '#8b7355', margin: 0 }}>{restaurant.phone}</p>
            )}
          </div>
        )}
        <div style={{ color: gold, fontSize: '14px', letterSpacing: '6px' }}>✦ ✦ ✦</div>
      </div>
    </div>
  );
}
