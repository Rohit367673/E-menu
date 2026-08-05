import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  FolderOpen,
  CheckCircle2,
  Plus,
  QrCode,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import Button from '../../components/ui/Button';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as any } },
};

export default function DashboardHome() {
  const { user } = useAuth();
  const { categories, menuItems, restaurant } = useRestaurant();

  const activeItems = useMemo(() => menuItems.filter((i) => i.isAvailable || i.available).length, [menuItems]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const stats = [
    {
      label: 'Total Menu Items',
      value: menuItems.length,
      icon: UtensilsCrossed,
      bg: 'from-violet-500/10 to-indigo-500/10',
      iconBg: 'bg-violet-500',
      trend: `${menuItems.length} items`,
    },
    {
      label: 'Categories',
      value: categories.length,
      icon: FolderOpen,
      bg: 'from-amber-500/10 to-orange-500/10',
      iconBg: 'bg-amber-500',
      trend: `${categories.length} sections`,
    },
    {
      label: 'Active Items',
      value: activeItems,
      icon: CheckCircle2,
      bg: 'from-emerald-500/10 to-teal-500/10',
      iconBg: 'bg-emerald-500',
      trend: `${menuItems.length - activeItems} unavailable`,
    },
  ];

  const quickActions = [
    {
      id: 'qa-add-item',
      label: 'Add Menu Item',
      description: 'Add a new dish with image, price, and details',
      icon: Plus,
      to: '/admin/add-item',
      gradient: 'from-violet-600 to-indigo-600',
      lightBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      id: 'qa-manage-menu',
      label: 'Manage Menu',
      description: 'View, edit, and organize your menu items',
      icon: UtensilsCrossed,
      to: '/admin/menu',
      gradient: 'from-amber-500 to-orange-600',
      lightBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      id: 'qa-qr-code',
      label: 'Generate QR Code',
      description: 'Create and download your restaurant QR code',
      icon: QrCode,
      to: '/admin/qr-menu',
      gradient: 'from-emerald-500 to-teal-600',
      lightBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="admin-page flex flex-col gap-8 py-2">
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-white rounded-2xl border border-border/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="admin-breadcrumb">Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text">
            {greeting()}, <span className="text-gradient">{user?.email?.split('@')[0] || 'Admin'}</span>! 👋
          </h1>
          <p className="text-text-secondary mt-1.5 text-sm">
            {restaurant ? `Managing ${restaurant.name}` : 'Welcome to your E-Menu dashboard'}
          </p>
        </div>
        <Link to="/admin/add-item" id="dashboard-add-item-header">
          <Button icon={<Plus className="w-4 h-4" />}>Add Menu Item</Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden admin-card p-6"
            id={`stat-card-${i}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-60`} />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary/80 mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-text">{stat.value}</p>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <TrendingUp className="w-3.5 h-3.5 text-text-secondary/60" />
                  <span className="text-xs font-medium text-text-secondary/70">{stat.trend}</span>
                </div>
              </div>
              <div className={`w-13 h-13 ${stat.iconBg} rounded-2xl flex items-center justify-center shadow-md flex-shrink-0`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-text">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link key={action.id} to={action.to} id={action.id}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden admin-card p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300 cursor-pointer h-full"
              >
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${action.lightBg} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-text text-base">{action.label}</h3>
                    <p className="text-sm text-text-secondary mt-1 leading-relaxed">{action.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-text-secondary/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-0.5" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Public Menu URL */}
      <motion.div variants={itemVariants}>
        <div className="bg-gradient-to-r from-primary/8 via-indigo-500/5 to-purple-500/8 rounded-2xl border border-primary/20 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-text text-base">Your Public Menu</h3>
              <p className="text-sm text-text-secondary mt-1">Share this link with customers — or scan the QR code</p>
            </div>
            <a
              href={`${window.location.origin}/menu/${restaurant?.slug || 'menu'}`}
              target="_blank"
              rel="noopener noreferrer"
              id="public-menu-link"
              className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-border/80 text-sm text-primary font-semibold hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex-shrink-0"
            >
              <span className="truncate max-w-[240px]">
                {window.location.origin}/menu/{restaurant?.slug || 'menu'}
              </span>
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
