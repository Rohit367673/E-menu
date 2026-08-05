import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ImageUpload from '../ui/ImageUpload';
import type { MenuItem, Category } from '../../types/menu';

interface MenuItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<MenuItem>) => Promise<void>;
  categories: Category[];
  initialData?: MenuItem | null;
}

/* ── Veg / Non-Veg selector ─────────────────────────────── */
function VegTypeSelector({
  value,
  onChange,
}: {
  value: 'veg' | 'nonveg';
  onChange: (v: 'veg' | 'nonveg') => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-text mb-2">Food Type</p>
      <div className="flex gap-3">
        {([
          { value: 'veg', label: 'Vegetarian', dotColor: 'bg-emerald-500', borderColor: 'border-emerald-500', activeBg: 'bg-emerald-50', activeText: 'text-emerald-700' },
          { value: 'nonveg', label: 'Non-Vegetarian', dotColor: 'bg-red-500', borderColor: 'border-red-500', activeBg: 'bg-red-50', activeText: 'text-red-700' },
        ] as const).map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              id={`vegtype-${opt.value}`}
              className={`flex items-center gap-2.5 flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer font-medium text-sm ${
                isActive
                  ? `${opt.borderColor} ${opt.activeBg} ${opt.activeText}`
                  : 'border-border text-text-secondary hover:border-gray-300'
              }`}
            >
              {/* FSSAI-style square indicator */}
              <span className={`flex items-center justify-center w-5 h-5 rounded border-2 flex-shrink-0 ${opt.borderColor}`}>
                {isActive && <span className={`w-2.5 h-2.5 rounded-full ${opt.dotColor}`} />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MenuItemForm({
  isOpen,
  onClose,
  onSubmit,
  categories,
  initialData,
}: MenuItemFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('');
  const [vegType, setVegType] = useState<'veg' | 'nonveg'>('veg');
  const [available, setAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* Reset on open/close */
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setPrice(String(initialData.price));
      setDiscountPrice(initialData.discountPrice ? String(initialData.discountPrice) : '');
      setImage(initialData.image || '');
      setCategory(initialData.category);
      setVegType(initialData.vegType || 'veg');
      setAvailable(initialData.isAvailable ?? initialData.available ?? true);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setDiscountPrice('');
      setImage('');
      setCategory(categories[0]?._id || '');
      setVegType('veg');
      setAvailable(true);
    }
    setErrors({});
  }, [initialData, isOpen, categories]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!price || isNaN(Number(price)) || Number(price) <= 0) e.price = 'Valid price is required';
    if (discountPrice && (isNaN(Number(discountPrice)) || Number(discountPrice) <= 0))
      e.discountPrice = 'Invalid discount price';
    if (!category) e.category = 'Category is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        image: image || undefined,
        category,
        vegType,
        available,
      });
      onClose();
    } catch {
      /* handled by context */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Slide panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-text">
                  {initialData ? 'Edit Menu Item' : 'Add Menu Item'}
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  {initialData ? 'Update the item details below' : 'Fill in the details to add a new item'}
                </p>
              </div>
              <button
                onClick={onClose}
                type="button"
                id="menuitem-close-btn"
                className="p-2 rounded-xl hover:bg-gray-100 text-text-secondary hover:text-text transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <form id="menuitem-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-6 flex flex-col gap-6">

                {/* Image upload */}
                <ImageUpload
                  value={image}
                  onChange={setImage}
                  onRemove={() => setImage('')}
                  label="Item Photo"
                  id="menuitem-image-upload"
                />

                {/* Veg / Non-veg */}
                <VegTypeSelector value={vegType} onChange={setVegType} />

                {/* Name */}
                <Input
                  label="Item Name *"
                  id="menuitem-name"
                  placeholder="e.g. Paneer Tikka, Chicken Biryani"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                />

                {/* Category */}
                <div>
                  <label htmlFor="menuitem-category" className="block text-sm font-medium text-text mb-1.5">
                    Category *
                  </label>
                  <div className="relative">
                    <select
                      id="menuitem-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`admin-select pl-4 ${errors.category ? 'border-danger' : ''}`}
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.category && (
                    <p className="mt-1.5 text-xs text-danger font-medium">{errors.category}</p>
                  )}
                  {categories.length === 0 && (
                    <p className="mt-1.5 text-xs text-amber-600 font-medium">
                      ⚠ No categories yet — go to the Categories tab to add one first.
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="menuitem-description" className="block text-sm font-medium text-text mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="menuitem-description"
                    rows={3}
                    placeholder="Describe the dish — ingredients, taste, serving size..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text placeholder:text-text-secondary/50 outline-none resize-none focus:border-primary transition-colors duration-200"
                  />
                </div>

                {/* Price + Discount Price */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Price (₹) *"
                    id="menuitem-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="299"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    error={errors.price}
                  />
                  <Input
                    label="Discount Price (₹)"
                    id="menuitem-discount-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    error={errors.discountPrice}
                  />
                </div>

                {/* Availability toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border/60">
                  <div>
                    <p className="text-sm font-medium text-text">Availability</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {available ? 'Item is visible to customers' : 'Item is hidden from customers'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAvailable(!available)}
                    id="menuitem-availability-toggle"
                    className={`admin-toggle ${available ? 'active' : 'inactive'}`}
                    aria-label="Toggle availability"
                  >
                    <span className="sr-only">{available ? 'Available' : 'Unavailable'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-gray-50/50 flex-shrink-0">
              <Button
                variant="ghost"
                type="button"
                onClick={onClose}
                id="menuitem-cancel-btn"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="menuitem-form"
                isLoading={isLoading}
                id="menuitem-save-btn"
              >
                {initialData ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
