import { categoriesData, menuItemsData } from './src/data/sukoonMenu.js';

const RENDER_BASE = 'https://e-menu-yjsk.onrender.com/api';

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${RENDER_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`API error on ${path} (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function syncRender() {
  console.log('--- Logging into Render as Admin ---');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'owner@sukoon.com',
      password: 'owner123',
    }),
  });

  const token = loginRes.data.token;
  console.log('Login successful! Admin token acquired.');

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 1. Fetch and delete existing menu items
  console.log('Fetching existing menu items from Render...');
  const itemsRes = await request('/menu-items', { headers: authHeaders });
  const existingItems = itemsRes.data.menuItems || [];
  console.log(`Found ${existingItems.length} existing items on Render. Deleting...`);
  for (const it of existingItems) {
    await request(`/menu-items/${it._id}`, { method: 'DELETE', headers: authHeaders });
  }
  console.log('All existing items deleted from Render.');

  // 2. Fetch and delete existing categories
  console.log('Fetching existing categories from Render...');
  const catsRes = await request('/categories', { headers: authHeaders });
  const existingCats = catsRes.data.categories || [];
  console.log(`Found ${existingCats.length} existing categories on Render. Deleting...`);
  for (const c of existingCats) {
    await request(`/categories/${c._id}`, { method: 'DELETE', headers: authHeaders });
  }
  console.log('All existing categories deleted from Render.');

  // 3. Create new 12 categories
  console.log('Creating 12 authentic categories on Render...');
  const catMap: Record<string, string> = {};
  for (const c of categoriesData) {
    const res = await request('/categories', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: c.name }),
    });
    const created = res.data.category;
    catMap[c.name] = created._id;
    console.log(`+ Created category: ${c.name} (${created._id})`);
  }

  // 4. Create all 166 authentic menu items
  console.log(`Creating ${menuItemsData.length} authentic menu items on Render...`);
  let count = 0;
  for (const it of menuItemsData) {
    const catId = catMap[it.catName];
    if (!catId) {
      console.warn(`Missing category for: ${it.name} (${it.catName})`);
      continue;
    }

    await request('/menu-items', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        category: catId,
        name: it.name,
        description: it.description,
        price: it.price,
        vegType: it.vegType,
        image: it.image,
        featured: it.featured ?? false,
        available: true,
      }),
    });
    count++;
    if (count % 15 === 0 || count === menuItemsData.length) {
      console.log(`Created ${count}/${menuItemsData.length} items...`);
    }
  }

  console.log(`\n🎉 SUCCESS! Fully synchronized ${count} authentic items to Render backend.`);

  // 5. Verify public endpoint
  console.log('\nVerifying public endpoint...');
  const pubRes = await request('/restaurants/public');
  const pubData = pubRes.data;
  console.log(`Public API verified: ${pubData.categories.length} categories, ${pubData.categories.reduce((acc: number, c: any) => acc + (c.items?.length || 0), 0)} items.`);
}

syncRender().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
