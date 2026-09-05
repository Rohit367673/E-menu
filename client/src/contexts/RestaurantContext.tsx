import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import * as restaurantsApi from '../api/restaurants';
import * as categoriesApi from '../api/categories';
import * as menuApi from '../api/menu';
import type { Restaurant, Category, MenuItem, TemplateConfig } from '../types/menu';
import toast from 'react-hot-toast';

interface RestaurantContextType {
  restaurant: Restaurant | null;
  categories: Category[];
  menuItems: MenuItem[];
  isLoading: boolean;
  fetchRestaurant: () => Promise<void>;
  updateRestaurant: (data: Partial<Restaurant>) => Promise<void>;
  updateTemplate: (config: TemplateConfig) => Promise<void>;
  fetchCategories: () => Promise<void>;
  addCategory: (data: Partial<Category>) => Promise<void>;
  editCategory: (id: string, data: Partial<Category>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  reorderCategories: (items: { id: string; order: number }[]) => Promise<void>;
  fetchMenuItems: (categoryId?: string) => Promise<void>;
  addMenuItem: (data: Partial<MenuItem>) => Promise<void>;
  editMenuItem: (id: string, data: Partial<MenuItem>) => Promise<void>;
  removeMenuItem: (id: string) => Promise<void>;
  reorderMenuItems: (items: { id: string; order: number }[]) => Promise<void>;
  toggleItemAvailability: (id: string) => Promise<void>;
}

const clearClientMenuCache = () => {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('emenu_cache_')) localStorage.removeItem(key);
    });
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('emenu_cache_')) sessionStorage.removeItem(key);
    });
  } catch {}
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRestaurant = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await restaurantsApi.getRestaurant();
      setRestaurant(data.data.restaurant);
    } catch {
      toast.error('Failed to load restaurant data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateRestaurantData = async (data: Partial<Restaurant>) => {
    try {
      const { data: res } = await restaurantsApi.updateRestaurant(data);
      setRestaurant(res.data.restaurant);
      toast.success('Restaurant updated');
    } catch {
      toast.error('Failed to update restaurant');
      throw new Error('Update failed');
    }
  };

  const updateTemplate = async (config: TemplateConfig) => {
    try {
      const { data: res } = await restaurantsApi.updateTemplate(config);
      setRestaurant(res.data.restaurant);
      toast.success('Template saved');
    } catch {
      toast.error('Failed to save template');
      throw new Error('Update failed');
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await categoriesApi.getCategories();
      setCategories(data.data.categories);
    } catch {
      toast.error('Failed to load categories');
    }
  }, []);

  const addCategory = async (data: Partial<Category>) => {
    try {
      const { data: res } = await categoriesApi.createCategory(data);
      setCategories((prev) => [...prev, res.data.category]);
      clearClientMenuCache();
      toast.success('Category created');
    } catch {
      toast.error('Failed to create category');
      throw new Error('Create failed');
    }
  };

  const editCategory = async (id: string, data: Partial<Category>) => {
    try {
      const { data: res } = await categoriesApi.updateCategory(id, data);
      setCategories((prev) => prev.map((c) => (c._id === id ? res.data.category : c)));
      clearClientMenuCache();
      toast.success('Category updated');
    } catch {
      toast.error('Failed to update category');
      throw new Error('Update failed');
    }
  };

  const removeCategory = async (id: string) => {
    try {
      await categoriesApi.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      setMenuItems((prev) => prev.filter((item) => item.category !== id));
      clearClientMenuCache();
      toast.success('Category deleted');
    } catch {
      toast.error('Failed to delete category');
      throw new Error('Delete failed');
    }
  };

  const reorderCats = async (items: { id: string; order: number }[]) => {
    const previous = [...categories];
    setCategories((prev) =>
      prev.map((c) => {
        const found = items.find((i) => i.id === c._id);
        return found ? { ...c, order: found.order } : c;
      }).sort((a, b) => a.order - b.order)
    );
    try {
      await categoriesApi.reorderCategories(items);
      clearClientMenuCache();
    } catch {
      setCategories(previous);
      toast.error('Failed to reorder categories');
    }
  };

  const fetchMenuItems = useCallback(async (categoryId?: string) => {
    try {
      const { data } = await menuApi.getMenuItems(categoryId);
      setMenuItems(data.data.menuItems);
    } catch {
      toast.error('Failed to load menu items');
    }
  }, []);

  const addMenuItem = async (data: Partial<MenuItem>) => {
    try {
      const { data: res } = await menuApi.createMenuItem(data);
      setMenuItems((prev) => [...prev, res.data.menuItem]);
      clearClientMenuCache();
      toast.success('Menu item created');
    } catch {
      toast.error('Failed to create menu item');
      throw new Error('Create failed');
    }
  };

  const editMenuItem = async (id: string, data: Partial<MenuItem>) => {
    try {
      const { data: res } = await menuApi.updateMenuItem(id, data);
      setMenuItems((prev) => prev.map((item) => (item._id === id ? res.data.menuItem : item)));
      clearClientMenuCache();
      toast.success('Menu item updated');
    } catch {
      toast.error('Failed to update menu item');
      throw new Error('Update failed');
    }
  };

  const removeMenuItem = async (id: string) => {
    try {
      await menuApi.deleteMenuItem(id);
      setMenuItems((prev) => prev.filter((item) => item._id !== id));
      clearClientMenuCache();
      toast.success('Menu item deleted');
    } catch {
      toast.error('Failed to delete menu item');
      throw new Error('Delete failed');
    }
  };

  const reorderItems = async (items: { id: string; order: number }[]) => {
    const previous = [...menuItems];
    setMenuItems((prev) =>
      prev.map((item) => {
        const found = items.find((i) => i.id === item._id);
        return found ? { ...item, order: found.order } : item;
      }).sort((a, b) => a.order - b.order)
    );
    try {
      await menuApi.reorderMenuItems(items);
      clearClientMenuCache();
    } catch {
      setMenuItems(previous);
      toast.error('Failed to reorder items');
    }
  };

  const toggleItemAvailability = async (id: string) => {
    const previous = [...menuItems];
    setMenuItems((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, isAvailable: !item.isAvailable, available: !item.available }
          : item
      )
    );
    try {
      await menuApi.toggleAvailability(id);
      clearClientMenuCache();
    } catch {
      setMenuItems(previous);
      toast.error('Failed to toggle availability');
    }
  };

  return (
    <RestaurantContext.Provider
      value={{
        restaurant,
        categories,
        menuItems,
        isLoading,
        fetchRestaurant,
        updateRestaurant: updateRestaurantData,
        updateTemplate,
        fetchCategories,
        addCategory,
        editCategory,
        removeCategory,
        reorderCategories: reorderCats,
        fetchMenuItems,
        addMenuItem,
        editMenuItem,
        removeMenuItem,
        reorderMenuItems: reorderItems,
        toggleItemAvailability,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant(): RestaurantContextType {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
