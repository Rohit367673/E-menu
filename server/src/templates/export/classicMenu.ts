import type { ExportMenuData } from './modernCafe.js';

const escapeHtml = (str: string) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

export function renderClassicMenu(data: ExportMenuData): string {
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
              <div class="item-row">
                <span class="item-name">${escapeHtml(item.name)}</span>
                <span class="dots"></span>
                <span class="price">${formatPrice(item.price)}</span>
              </div>
              ${item.description ? `<p class="description">${escapeHtml(item.description)}</p>` : ''}
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
  <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=Source+Sans+3:wght@300;400&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Source Sans 3', sans-serif;
      background: #FFFFFF;
      color: #1A1A1A;
      padding: 40px 56px;
      line-height: 1.5;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 3px double #1A1A1A;
    }
    .logo { width: 64px; height: 64px; object-fit: contain; margin-bottom: 16px; }
    h1 {
      font-family: 'Lora', serif;
      font-size: 36px;
      font-weight: 600;
      color: #1A1A1A;
      margin-bottom: 8px;
    }
    .tagline { font-size: 14px; color: #555; font-style: italic; }
    .category { margin-bottom: 36px; page-break-inside: avoid; }
    .category-title {
      font-family: 'Lora', serif;
      font-size: 22px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 1px solid #CCC;
    }
    .items { display: flex; flex-direction: column; gap: 14px; }
    .item-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .item-name { font-family: 'Lora', serif; font-size: 16px; font-weight: 500; white-space: nowrap; }
    .dots { flex: 1; border-bottom: 1px dotted #AAA; margin-bottom: 4px; min-width: 20px; }
    .price { font-size: 16px; font-weight: 400; white-space: nowrap; }
    .description { font-size: 13px; color: #666; font-style: italic; margin-top: 2px; padding-left: 2px; }
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
