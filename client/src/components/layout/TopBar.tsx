import { Menu, ExternalLink, ShieldCheck, UserCheck } from 'lucide-react';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { useAuth } from '../../contexts/AuthContext';

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
}

export default function TopBar({ title, onMenuClick }: TopBarProps) {
  const { restaurant } = useRestaurant();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-text-secondary hover:bg-gray-100 hover:text-text transition-colors cursor-pointer"
            id="topbar-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-text leading-tight">{title}</h1>
            {restaurant && (
              <p className="text-xs text-text-secondary hidden sm:block">
                {restaurant.name}
              </p>
            )}
          </div>
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-2.5">
          {user && (
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border shadow-2xs ${
                user.role === 'manager'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}
            >
              {user.role === 'manager' ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Store Manager
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Sukoon Owner
                </>
              )}
            </span>
          )}

          {restaurant && (
            <a
              href={`${window.location.origin}/menu/${restaurant.slug || 'menu'}`}
              target="_blank"
              rel="noopener noreferrer"
              id="topbar-view-menu"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-primary border border-border/80 bg-white rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all shadow-2xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Menu
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
