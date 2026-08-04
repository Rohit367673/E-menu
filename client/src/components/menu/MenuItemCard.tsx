import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { GripVertical, Edit2, Trash2, ImageOff } from 'lucide-react';
import Badge from '../ui/Badge';
import Toggle from '../ui/Toggle';
import type { MenuItem } from '../../types/menu';
import { getImageUrl } from '../../utils/image';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailability: () => void;
}

export default function MenuItemCard({ item, onEdit, onDelete, onToggleAvailability }: MenuItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        group bg-white rounded-xl border border-border/60 overflow-hidden
        hover:shadow-md transition-all duration-300
        ${isDragging ? 'opacity-50 shadow-xl' : ''}
        ${!item.isAvailable ? 'opacity-60' : ''}
      `}
      id={`menu-item-card-${item._id}`}
    >
      {/* Image */}
      <div className="relative h-36 bg-gray-100 overflow-hidden">
        {item.image ? (
          <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-8 h-8 text-text-secondary/30" />
          </div>
        )}
        {/* Drag handle */}
        <button
          className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/30 backdrop-blur-sm text-white/80 hover:text-white cursor-grab active:cursor-grabbing transition-colors"
          {...attributes}
          {...listeners}
          id={`item-drag-${item._id}`}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        {/* Badges */}
        {item.badges && Object.entries(item.badges).some(([_, active]) => active) && (
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {Object.entries(item.badges).map(([badge, active]) => 
              active ? <Badge key={badge} variant={badge as any} /> : null
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-sm text-text truncate flex-1">{item.name}</h3>
        </div>
        {item.description && (
          <p className="text-xs text-text-secondary line-clamp-2 mb-2">{item.description}</p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          {item.discountPrice ? (
            <>
              <span className="text-sm font-bold text-accent">₹{item.discountPrice}</span>
              <span className="text-xs text-text-secondary line-through">₹{item.price}</span>
            </>
          ) : (
            <span className="text-sm font-bold text-text">₹{item.price}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <Toggle
            checked={item.isAvailable}
            onChange={onToggleAvailability}
            id={`item-toggle-${item._id}`}
          />
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors cursor-pointer"
              id={`item-edit-${item._id}`}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors cursor-pointer"
              id={`item-delete-${item._id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
