import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useRestaurant } from '../../contexts/RestaurantContext';

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/orders': 'Live Orders',
  '/admin/add-item': 'Add Menu Item',
  '/admin/menu': 'Menu Management',
  '/admin/qr-menu': 'QR Menu',
  '/admin/print-menu': 'Print Menu',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { fetchRestaurant, fetchCategories, fetchMenuItems } = useRestaurant();

  const title = pageTitles[location.pathname] || 'Dashboard';
  const isPrintMenu = location.pathname === '/admin/print-menu';

  useEffect(() => {
    fetchRestaurant();
    fetchCategories();
    fetchMenuItems();
  }, [fetchRestaurant, fetchCategories, fetchMenuItems]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Hide TopBar on Print Menu page (it has its own toolbar) */}
        {!isPrintMenu && (
          <TopBar title={title} onMenuClick={() => setSidebarOpen(true)} />
        )}
        <main className={isPrintMenu ? 'flex-1' : 'flex-1 p-4 md:p-6 lg:p-8'}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
