import { Menu, ExternalLink } from 'lucide-react';
import { useRestaurant } from '../../contexts/RestaurantContext';

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
}

export default function TopBar({ title, onMenuClick }: TopBarProps) {
  const { restaurant } = useRestaurant();

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
        <div className="flex items-center gap-2">
          {restaurant && (
            <a
              href={`${window.location.origin}/menu/${restaurant.slug || 'menu'}`}
              target="_blank"
              rel="noopener noreferrer"
              id="topbar-view-menu"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-primary border border-border/60 rounded-lg hover:border-primary/30 transition-colors"
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
