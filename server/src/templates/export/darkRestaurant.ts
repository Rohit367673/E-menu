import type { ExportMenuData } from './modernCafe.js';

const escapeHtml = (str: string) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

export function renderDarkRestaurant(data: ExportMenuData): string {
  const { restaurant, categories } = data;

  const categorySections = categories
    .map(
      (cat) => `
      <section class="category">
        <h2 class="category-title">${escapeHtml(cat.name)}</h2>
        <div class="items">
          ${cat.items
            .map(
              (item) => `
            <article class="item">
              ${
                item.image
                  ? `<div class="item-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" /></div>`
                  : '<div class="item-image placeholder"></div>'
              }
              <div class="item-content">
                <div class="item-header">
                  <h3>${escapeHtml(item.name)}</h3>
                  <span class="price">${formatPrice(item.price)}</span>
                </div>
                ${item.description ? `<p class="description">${escapeHtml(item.description)}</p>` : ''}
              </div>
            </article>
          `
            )
            .join('')}
        </div>
      </section>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@300;400;500&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Montserrat', sans-serif;
      background: #0D0D0D;
      color: #F5F0E8;
      padding: 48px;
      line-height: 1.7;
    }
    .header {
      text-align: center;
      margin-bottom: 60px;
      padding-bottom: 48px;
      border-bottom: 1px solid #C9A962;
    }
    .logo { width: 90px; height: 90px; object-fit: cover; border-radius: 4px; margin-bottom: 24px; border: 1px solid #C9A962; }
    h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 52px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: #F5F0E8;
      margin-bottom: 16px;
    }
    .tagline { font-size: 13px; color: #C9A962; font-weight: 300; letter-spacing: 0.25em; text-transform: uppercase; }
    .category { margin-bottom: 56px; }
    .category-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 32px;
      font-weight: 500;
      color: #C9A962;
      margin-bottom: 32px;
      text-align: center;
      letter-spacing: 0.1em;
    }
    .items { display: flex; flex-direction: column; gap: 32px; }
    .item { display: flex; gap: 28px; align-items: flex-start; }
    .item-image { flex-shrink: 0; width: 140px; height: 140px; border-radius: 4px; overflow: hidden; border: 1px solid #333; }
    .item-image.placeholder { background: linear-gradient(135deg, #1a1a1a, #2a2a2a); }
    .item-image img { width: 100%; height: 100%; object-fit: cover; }
    .item-content { flex: 1; padding-top: 8px; }
    .item-header { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; margin-bottom: 10px; }
    .item-header h3 { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 500; letter-spacing: 0.03em; }
    .price { font-size: 18px; font-weight: 400; color: #C9A962; white-space: nowrap; }
    .description { font-size: 13px; color: #A89F94; font-weight: 300; line-height: 1.8; }
  </style>
</head>
<body>
  <header class="header">
    ${restaurant.logo ? `<img class="logo" src="${escapeHtml(restaurant.logo)}" alt="" />` : ''}
    <h1>${escapeHtml(restaurant.name)}</h1>
    ${restaurant.description ? `<p class="tagline">${escapeHtml(restaurant.description)}</p>` : ''}
  </header>
  ${categorySections}
</body>
</html>`;
}
