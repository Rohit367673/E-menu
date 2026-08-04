export interface ExportMenuData {
  restaurant: {
    name: string;
    logo?: string;
    description?: string;
  };
  categories: Array<{
    name: string;
    items: Array<{
      name: string;
      description?: string;
      price: number;
      image?: string;
    }>;
  }>;
}

const escapeHtml = (str: string) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

export function renderModernCafe(data: ExportMenuData): string {
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
                  : ''
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
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #FAF7F2;
      color: #2C1810;
      padding: 48px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 56px;
      padding-bottom: 40px;
      border-bottom: 2px solid #E8DFD4;
    }
    .logo { width: 80px; height: 80px; object-fit: cover; border-radius: 50%; margin-bottom: 20px; }
    h1 {
      font-family: 'Playfair Display', serif;
      font-size: 48px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #2C1810;
      margin-bottom: 12px;
    }
    .tagline { font-size: 16px; color: #8B7355; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; }
    .category { margin-bottom: 48px; }
    .category-title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 600;
      color: #8B5E3C;
      margin-bottom: 28px;
      padding-bottom: 12px;
      border-bottom: 1px solid #D4C4B0;
    }
    .items { display: flex; flex-direction: column; gap: 24px; }
    .item { display: flex; gap: 20px; align-items: flex-start; }
    .item-image { flex-shrink: 0; width: 100px; height: 100px; border-radius: 12px; overflow: hidden; }
    .item-image img { width: 100%; height: 100%; object-fit: cover; }
    .item-content { flex: 1; }
    .item-header { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; margin-bottom: 6px; }
    .item-header h3 { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; }
    .price { font-size: 18px; font-weight: 500; color: #8B5E3C; white-space: nowrap; }
    .description { font-size: 14px; color: #6B5B4F; font-weight: 300; }
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
