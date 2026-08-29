import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Plus,
  Search,
  FolderOpen,
  UtensilsCrossed,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
  Filter,
  ImageOff,
} from 'lucide-react';
import { useRestaurant } from '../../contexts/RestaurantContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ImageUpload from '../../components/ui/ImageUpload';
import CategoryCard from '../../components/menu/CategoryCard';
import MenuItemForm from '../../components/menu/MenuItemForm';
import type { Category, MenuItem } from '../../types/menu';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/image';

/* ── Veg / Non-Veg badge ─────────────────────────────────── */
function VegBadge({ type }: { type: 'veg' | 'nonveg' | undefined }) {
  const isVeg = !type || type === 'veg';
  return (
    <span
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 flex-shrink-0 ${
        isVeg ? 'border-emerald-500' : 'border-red-500'
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-red-500'}`}
      />
    </span>
  );
}

/* ── Availability pill ───────────────────────────────────── */
function AvailabilityPill({ available }: { available: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        available
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-red-50 text-red-600 border border-red-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-emerald-500' : 'bg-red-400'}`} />
      {available ? 'Active' : 'Inactive'}
    </span>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function MenuPage() {
  const {
    categories,
    menuItems,
    addCategory,
    editCategory,
    removeCategory,
    reorderCategories,
    addMenuItem,
    editMenuItem,
    removeMenuItem,
    toggleItemAvailability,
  } = useRestaurant();

  /* tabs */
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');

  /* items view */
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');

  /* category modal */
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [printSketch, setPrintSketch] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  /* item form */
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0)),
    [categories]
  );

  const filteredItems = useMemo(() => {
    let items = [...menuItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (filterCategoryId) items = items.filter((i) => i.category === filterCategoryId);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [menuItems, filterCategoryId, search]);

  const getCategoryName = (catId: string) =>
    categories.find((c) => c._id === catId)?.name ?? '—';

  /* ── Category handlers ─────────────────────────── */
  const openCategoryCreate = () => {
    setEditingCategory(null);
    setCategoryName('');
    setPrintSketch('');
    setShowCategoryModal(true);
  };

  const openCategoryEdit = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setPrintSketch(cat.printSketch || '');
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async () => {
    if (!categoryName.trim()) { toast.error('Category name is required'); return; }
    setIsSavingCategory(true);
    try {
      if (editingCategory) {
        await editCategory(editingCategory._id, { name: categoryName.trim(), printSketch });
      } else {
        await addCategory({ name: categoryName.trim(), order: categories.length, printSketch });
      }
      setShowCategoryModal(false);
    } catch { /* handled in context */ } finally { setIsSavingCategory(false); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its items?')) return;
    try { await removeCategory(id); } catch { /* handled */ }
  };

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sortedCategories.findIndex((c) => c._id === active.id);
    const newIdx = sortedCategories.findIndex((c) => c._id === over.id);
    const reordered = [...sortedCategories];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);
    reorderCategories(reordered.map((c, i) => ({ id: c._id, order: i })));
  };

  /* ── Item handlers ─────────────────────────────── */
  const handleItemSubmit = async (data: Partial<MenuItem>) => {
    if (editingItem) {
      await editMenuItem(editingItem._id, data);
    } else {
      await addMenuItem({ ...data, order: menuItems.length });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    try { await removeMenuItem(id); } catch { /* handled */ }
  };

  /* ── Renders ───────────────────────────────────── */
  return (
    <div className="admin-page admin-page-enter flex flex-col gap-6 py-2">
      {/* ── Page header ────────────────────────────── */}
      <div className="admin-header-card">
        <div>
          <span className="admin-breadcrumb">Catalog</span>
          <h1 className="text-2xl font-bold text-text mt-0.5 leading-tight">Menu Management</h1>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">
            {menuItems.length} active menu items across {categories.length} categories
          </p>
        </div>
        <Button
          onClick={() => { setEditingItem(null); setShowItemForm(true); }}
          icon={<Plus className="w-4 h-4" />}
          id="add-menu-item-btn"
          className="flex-shrink-0"
        >
          Add Menu Item
        </Button>
      </div>

      {/* ── Tabs ───────────────────────────────────── */}
      <div className="relative flex items-center gap-1 bg-gray-200/60 p-1 rounded-xl w-fit border border-gray-300/40">
        {([
          { key: 'items', label: 'Menu Items', icon: UtensilsCrossed, count: menuItems.length },
          { key: 'categories', label: 'Categories', icon: FolderOpen, count: categories.length },
        ] as const).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              id={`tab-${tab.key}`}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer z-10 select-none ${
                isActive ? 'text-text' : 'text-text-secondary hover:text-text'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-active-tab"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <tab.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                <span>{tab.label}</span>
              </span>
              <span
                className={`relative z-10 text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'bg-gray-200/80 text-text-secondary'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ════════════════════════════════════════════
            ITEMS TAB
        ════════════════════════════════════════════ */}
        {activeTab === 'items' && (
          <motion.div
            key="items"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="w-full sm:w-72">
                <Input
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                  id="menu-search"
                />
              </div>

              {/* Category filter */}
              <div className="relative w-full sm:w-auto">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/70 pointer-events-none z-10" />
                <select
                  value={filterCategoryId}
                  onChange={(e) => setFilterCategoryId(e.target.value)}
                  id="menu-category-filter"
                  className="admin-select min-w-[170px]"
                  style={{ paddingLeft: '2.125rem' }}
                >
                  <option value="">All Categories</option>
                  {sortedCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200/60 sm:ml-auto h-10">
                <button
                  onClick={() => setViewMode('table')}
                  id="view-table-btn"
                  title="Table view"
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-text'
                  }`}
                  aria-pressed={viewMode === 'table'}
                >
                  <List className="w-4 h-4 flex-shrink-0" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  id="view-grid-btn"
                  title="Grid view"
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-text'
                  }`}
                  aria-pressed={viewMode === 'grid'}
                >
                  <LayoutGrid className="w-4 h-4 flex-shrink-0" />
                </button>
              </div>
            </div>

            {/* ── TABLE VIEW ── */}
            {viewMode === 'table' && (
              <AnimatePresence mode="wait">
                {filteredItems.length > 0 ? (
                  <motion.div
                    key="table"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="admin-card overflow-hidden"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px]">
                        <thead>
                          <tr className="bg-gray-50/80 border-b border-border/60">
                            <th className="w-14 px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider"></th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Item</th>
                            <th className="w-32 px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Category</th>
                            <th className="w-24 px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Price</th>
                            <th className="w-20 px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                            <th className="w-24 px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                            <th className="w-28 px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {filteredItems.map((item, idx) => {
                            const isAvail = item.isAvailable ?? item.available;
                            return (
                              <motion.tr
                                key={item._id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className={`hover:bg-gray-50/70 transition-colors group ${!isAvail ? 'opacity-60' : ''}`}
                                id={`row-${item._id}`}
                              >
                                {/* Thumbnail */}
                                <td className="px-4 py-3">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    {item.image ? (
                                      <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <ImageOff className="w-4 h-4 text-text-secondary/30" />
                                    )}
                                  </div>
                                </td>

                                {/* Name + description */}
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-sm text-text truncate max-w-[220px]">{item.name}</p>
                                  {item.description && (
                                    <p className="text-xs text-text-secondary truncate max-w-[220px] mt-0.5">{item.description}</p>
                                  )}
                                </td>

                                {/* Category */}
                                <td className="px-4 py-3">
                                  <span className="text-sm text-text-secondary">{getCategoryName(item.category)}</span>
                                </td>

                                {/* Price */}
                                <td className="px-4 py-3">
                                  <span className="text-sm font-bold text-text">₹{item.price}</span>
                                  {item.discountPrice && (
                                    <span className="text-xs text-text-secondary line-through ml-1.5">₹{item.discountPrice}</span>
                                  )}
                                </td>

                                {/* Veg badge */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <VegBadge type={item.vegType} />
                                    <span className="text-xs text-text-secondary hidden xl:inline">
                                      {!item.vegType || item.vegType === 'veg' ? 'Veg' : 'Non-Veg'}
                                    </span>
                                  </div>
                                </td>

                                {/* Availability */}
                                <td className="px-4 py-3">
                                  <AvailabilityPill available={isAvail} />
                                </td>

{/* Actions */}
                                 <td className="px-4 py-3">
                                   <div className="flex items-center justify-end gap-1.5">
                                     <button
                                       onClick={() => toggleItemAvailability(item._id)}
                                       title={isAvail ? 'Mark unavailable' : 'Mark available'}
                                       id={`toggle-${item._id}`}
                                       className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 text-text-secondary hover:text-text transition-colors cursor-pointer"
                                       aria-label={isAvail ? 'Mark unavailable' : 'Mark available'}
                                     >
                                       {isAvail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                     </button>
                                     <button
                                       onClick={() => { setEditingItem(item); setShowItemForm(true); }}
                                       title="Edit item"
                                       id={`edit-${item._id}`}
                                       className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors cursor-pointer"
                                       aria-label="Edit item"
                                     >
                                       <Edit2 className="w-4 h-4" />
                                     </button>
                                     <button
                                       onClick={() => handleDeleteItem(item._id)}
                                       title="Delete item"
                                       id={`delete-${item._id}`}
                                       className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors cursor-pointer"
                                       aria-label="Delete item"
                                     >
                                       <Trash2 className="w-4 h-4" />
                                     </button>
                                   </div>
                                 </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ) : (
                  <EmptyState search={search} onAdd={() => { setEditingItem(null); setShowItemForm(true); }} />
                )}
              </AnimatePresence>
            )}

            {/* ── GRID VIEW ── */}
            {viewMode === 'grid' && (
              <AnimatePresence mode="wait">
                {filteredItems.length > 0 ? (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                  >
                    {filteredItems.map((item, idx) => {
                      const isAvail = item.isAvailable ?? item.available;
                      return (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className={`group admin-card overflow-hidden hover:shadow-lg transition-all duration-300 ${!isAvail ? 'opacity-60' : ''}`}
                          id={`card-${item._id}`}
                        >
                          {/* Image */}
                          <div className="relative h-40 bg-gray-100 overflow-hidden">
                            {item.image ? (
                              <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageOff className="w-10 h-10 text-text-secondary/20" />
                              </div>
                            )}
                            {/* Veg badge overlay */}
                            <div className="absolute top-2.5 left-2.5">
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm ${
                                !item.vegType || item.vegType === 'veg'
                                  ? 'bg-emerald-500/90 text-white'
                                  : 'bg-red-500/90 text-white'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                {!item.vegType || item.vegType === 'veg' ? 'Veg' : 'Non-Veg'}
                              </div>
                            </div>
                            {/* Availability */}
                            <div className="absolute top-2.5 right-2.5">
                              <AvailabilityPill available={isAvail} />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="font-bold text-text text-sm leading-snug mb-1">{item.name}</h3>
                            {item.description && (
                              <p className="text-xs text-text-secondary line-clamp-2 mb-2">{item.description}</p>
                            )}
                            <p className="text-xs text-text-secondary/70 mb-3">
                              {getCategoryName(item.category)}
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-border/50">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-text">₹{item.price}</span>
                                {item.discountPrice && (
                                  <span className="text-xs text-text-secondary line-through">₹{item.discountPrice}</span>
                                )}
                              </div>
<div className="flex items-center gap-1">
                                 <button
                                   onClick={() => toggleItemAvailability(item._id)}
                                   className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-text-secondary hover:text-text transition-colors cursor-pointer"
                                   id={`grid-toggle-${item._id}`}
                                   aria-label={isAvail ? 'Mark unavailable' : 'Mark available'}
                                 >
                                   {isAvail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                 </button>
                                 <button
                                   onClick={() => { setEditingItem(item); setShowItemForm(true); }}
                                   className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors cursor-pointer"
                                   id={`grid-edit-${item._id}`}
                                   aria-label="Edit item"
                                 >
                                   <Edit2 className="w-4 h-4" />
                                 </button>
                                 <button
                                   onClick={() => handleDeleteItem(item._id)}
                                   className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors cursor-pointer"
                                   id={`grid-delete-${item._id}`}
                                   aria-label="Delete item"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <EmptyState search={search} onAdd={() => { setEditingItem(null); setShowItemForm(true); }} />
                )}
              </AnimatePresence>
            )}
          </motion.div>
        )}

        {/* ════════════════════════════════════════════
            CATEGORIES TAB
        ════════════════════════════════════════════ */}
        {activeTab === 'categories' && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">Drag to reorder. Categories appear in this order on the customer menu.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={openCategoryCreate}
                icon={<Plus className="w-4 h-4 flex-shrink-0" />}
                id="add-category-btn"
              >
                Add Category
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
              <SortableContext items={sortedCategories.map((c) => c._id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {sortedCategories.map((cat) => (
                    <CategoryCard
                      key={cat._id}
                      category={cat}
                      itemCount={menuItems.filter((i) => i.category === cat._id).length}
                      isSelected={false}
                      onSelect={() => { setFilterCategoryId(cat._id); setActiveTab('items'); }}
                      onEdit={() => openCategoryEdit(cat)}
                      onDelete={() => handleDeleteCategory(cat._id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {categories.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-text-secondary/30" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-1">No categories yet</h3>
                <p className="text-sm text-text-secondary mb-4">Add categories to organize your menu</p>
                <Button onClick={openCategoryCreate} icon={<Plus className="w-4 h-4" />} size="sm" id="empty-add-cat-btn">
                  Add Category
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Category Modal ─────────────────────────── */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        size="md"
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Category Name"
            id="category-name"
            placeholder="e.g. Starters, Main Course, Desserts"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />

          <div>
            <label className="text-sm font-semibold text-text mb-2 block">
              Download Menu Sketch Design
            </label>
            <p className="text-xs text-text-secondary mb-3">
              Choose a colorful hand-drawn watercolor illustration for the print layout, or upload a custom sketch.
            </p>
<div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: '�� Coffee / Tea', value: '/menu-sketches/coffee.jpg' },
                { label: '���� Snacks / Starters', value: '/menu-sketches/snacks.jpg' },
                { label: '���� Burgers / Pizzas', value: '/menu-sketches/burgers.jpg' },
                { label: '���� Smoothies / Shakes', value: '/menu-sketches/smoothies.jpg' },
                { label: '���� Desserts / Cakes', value: '/menu-sketches/desserts.jpg' },
                { label: '������� Classic Table Setup', value: '/menu-sketches/generic.jpg' },
              ].map((preset) => {
                const isSelected = printSketch === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setPrintSketch(preset.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm font-medium cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-border text-text hover:border-gray-300'
                    }`}
                  >
                    <span className="flex-1 text-start">{preset.label}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-border/60 pt-4">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-2">
                Or Upload Custom Sketch
              </label>
              <ImageUpload
                value={printSketch && !printSketch.startsWith('/menu-sketches/') ? printSketch : ''}
                onChange={(url) => setPrintSketch(url)}
                onRemove={() => setPrintSketch('')}
                id="category-sketch-upload"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border/60">
            <Button variant="ghost" onClick={() => setShowCategoryModal(false)} type="button" id="category-cancel-btn">
              Cancel
            </Button>
            <Button onClick={handleCategorySubmit} isLoading={isSavingCategory} id="category-save-btn">
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Menu Item Form (slide panel) ───────────── */}
      <MenuItemForm
        isOpen={showItemForm}
        onClose={() => { setShowItemForm(false); setEditingItem(null); }}
        onSubmit={handleItemSubmit}
        categories={categories}
        initialData={editingItem}
      />
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
function EmptyState({ search, onAdd }: { search: string; onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center admin-card"
    >
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <UtensilsCrossed className="w-8 h-8 text-text-secondary/30" />
      </div>
      <h3 className="text-lg font-semibold text-text mb-1">
        {search ? 'No items match your search' : 'No menu items yet'}
      </h3>
      <p className="text-sm text-text-secondary mb-6">
        {search ? 'Try a different keyword or clear your search' : 'Add your first item to get started'}
      </p>
      {!search && (
        <Button onClick={onAdd} icon={<Plus className="w-4 h-4" />} size="sm" id="empty-add-item-btn">
          Add Menu Item
        </Button>
      )}
    </motion.div>
  );
}
