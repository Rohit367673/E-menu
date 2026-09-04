import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  UtensilsCrossed,
  Plus,
  QrCode,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  FolderOpen,
  FileOutput,
  LayoutDashboard,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isOwner = user?.role !== 'manager';

  const navItems = isOwner
    ? [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/admin/orders', icon: ShoppingBag, label: 'Live Orders', end: false, hasBadge: true },
        { to: '/admin/earnings', icon: TrendingUp, label: 'Monthly Earnings', end: false },
        { to: '/admin/add-item', icon: Plus, label: 'Add Menu Item', end: false },
        { to: '/admin/menu', icon: FolderOpen, label: 'Menu Items', end: false },
      ]
    : [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/admin/orders', icon: ShoppingBag, label: 'Live Orders', end: false, hasBadge: true },
        { to: '/admin/add-item', icon: Plus, label: 'Add Menu Item', end: false },
        { to: '/admin/menu', icon: FolderOpen, label: 'Menu Items', end: false },
        { to: '/admin/qr-menu', icon: QrCode, label: 'QR Menu', end: false },
        { to: '/admin/print-menu', icon: FileOutput, label: 'Print Menu', end: false },
      ];

  useEffect(() => {
    const checkOrders = async () => {
      try {
        const res = await apiClient.get<{ success: boolean; data: { stats: { pendingCount: number } } }>('/orders/admin');
        if (res.data.success && res.data.data.stats) {
          setPendingOrdersCount(res.data.data.stats.pendingCount || 0);
        }
      } catch {}
    };

    checkOrders();
    const interval = setInterval(checkOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-6">
        <motion.div
          className="flex items-center gap-3"
          initial={false}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-accent shadow-lg shadow-primary/20 flex-shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-base font-bold text-white whitespace-nowrap overflow-hidden tracking-tight"
              >
                Sukoon Cafe & Bar
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Mobile close */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          id="sidebar-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop collapse */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          id="sidebar-collapse-btn"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 flex flex-col gap-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            id={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
              ${
                isActive
                  ? 'bg-primary/20 text-primary-light shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }
              ${isCollapsed ? 'justify-center' : ''}
              `
            }
          >
            {({ isActive }) => (
              <>
                {/* Active left indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-light"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-light' : ''}`} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap overflow-hidden flex-1 text-left flex items-center justify-between"
                    >
                      <span>{item.label}</span>
                      {item.hasBadge && pendingOrdersCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-stone-950 animate-pulse shadow-xs">
                          {pendingOrdersCount}
                        </span>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-5">
        <div className={`flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full gradient-accent flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="text-sm font-bold text-white truncate">
                  {user?.name || user?.email?.split('@')[0] || 'Admin'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                      user?.role === 'manager'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {user?.role === 'manager' ? '👔 Manager' : '👑 Owner'}
                  </span>
                  <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-white/40 hover:text-danger hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
                id="sidebar-logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] gradient-sidebar z-50 lg:hidden shadow-2xl"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 76 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col gradient-sidebar border-r border-white/5 h-screen sticky top-0 overflow-hidden"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
