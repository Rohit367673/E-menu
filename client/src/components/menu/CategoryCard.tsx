import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { GripVertical, Edit2, Trash2, FolderOpen } from 'lucide-react';
import type { Category } from '../../types/menu';

interface CategoryCardProps {
  category: Category;
  itemCount: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CategoryCard({
  category,
  itemCount,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: CategoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category._id,
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
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer
        transition-all duration-200 border
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
        ${
          isSelected
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-white border-transparent hover:bg-gray-50 text-text'
        }
      `}
      onClick={onSelect}
      id={`category-card-${category._id}`}
    >
      <button
        className="touch-none text-text-secondary/40 hover:text-text-secondary transition-colors cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        id={`category-drag-${category._id}`}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{category.name}</p>
        <p className="text-xs text-text-secondary">{itemCount} items</p>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 rounded-md hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors cursor-pointer"
          id={`category-edit-${category._id}`}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded-md hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors cursor-pointer"
          id={`category-delete-${category._id}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {!isSelected && itemCount === 0 && (
        <FolderOpen className="w-4 h-4 text-text-secondary/30" />
      )}
    </motion.div>
  );
}
