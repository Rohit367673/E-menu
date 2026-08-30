import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  FolderOpen,
  Plus,
  QrCode,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Star,
  MessageSquareHeart,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import Button from '../../components/ui/Button';
import apiClient from '../../api/client';
import type { Review } from '../../types/menu';
import toast from 'react-hot-toast';

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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(4.9);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get<{
          success: boolean;
          data: { reviews: Review[]; total: number; averageRating: number };
        }>('/reviews/admin');
        if (res.data.success) {
          setReviews(res.data.data.reviews || []);
          setAvgRating(res.data.data.averageRating || 4.9);
          setTotalReviews(res.data.data.total || 0);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setIsLoadingReviews(false);
      }
    })();
  }, []);

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer review?')) return;
    try {
      await apiClient.delete(`/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      setTotalReviews((prev) => Math.max(0, prev - 1));
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review');
    }
  };

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
      label: 'Customer Rating',
      value: `${avgRating.toFixed(1)} ★`,
      icon: Star,
      bg: 'from-amber-500/10 to-yellow-500/10',
      iconBg: 'bg-amber-500',
      trend: `${totalReviews} customer feedback`,
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
      <motion.div variants={itemVariants} className="admin-header-card">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="admin-breadcrumb">Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text leading-tight">
            {greeting()}, <span className="text-gradient">{user?.email?.split('@')[0] || 'Admin'}</span>! 👋
          </h1>
          <p className="text-text-secondary mt-1.5 text-sm leading-relaxed">
            {restaurant ? `Managing ${restaurant.name}` : 'Welcome to your E-Menu dashboard'}
          </p>
        </div>
        <Link to="/admin/add-item" id="dashboard-add-item-header" className="flex-shrink-0">
          <Button icon={<Plus className="w-4 h-4" />}>Add Menu Item</Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -3 }}
            className="relative overflow-hidden admin-card p-6 border border-border/80 shadow-sm"
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

      {/* Customer Reviews & Feedback */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-text">Customer Reviews & Ratings</h2>
          </div>
          <span className="text-xs font-semibold text-text-secondary">
            {totalReviews} Total Feedback · {avgRating.toFixed(1)} ★ Rating
          </span>
        </div>

        {isLoadingReviews ? (
          <div className="p-8 text-center text-sm text-text-secondary">Loading customer reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="admin-card p-8 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-1">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>
            <h3 className="text-base font-bold text-text">No Customer Reviews Yet</h3>
            <p className="text-xs text-text-secondary max-w-md">
              When customers view your digital menu, they can tap "Rate & Review Us" at the bottom to submit their 5-star rating and feedback!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev._id}
                className="admin-card p-5 flex flex-col justify-between gap-3 border border-border/80 relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-text">{rev.name || 'Happy Guest'}</h4>
                      <p className="text-[10px] text-text-secondary">
                        {new Date(rev.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-text/90 mt-2.5 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  )}

                  {rev.tags && rev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {rev.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev._id)}
                    className="text-text-secondary/50 hover:text-danger p-1 rounded-md transition-colors cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
