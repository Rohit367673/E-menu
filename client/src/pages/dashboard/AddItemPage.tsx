import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, ChefHat, Tag, IndianRupee, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useRestaurant } from '../../contexts/RestaurantContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ImageUpload from '../../components/ui/ImageUpload';
import toast from 'react-hot-toast';

export default function AddItemPage() {
  const { categories, addMenuItem, menuItems } = useRestaurant();
  const navigate = useNavigate();

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

  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]._id);
    }
  }, [categories, category]);

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
      await addMenuItem({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        image: image || undefined,
        category,
        vegType,
        available,
        order: menuItems.length,
      });
      toast.success('Menu item added successfully!');
      navigate('/admin/menu');
    } catch {
      toast.error('Failed to add menu item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-page admin-page-enter flex flex-col gap-6 py-2">
      {/* Header & Back Action */}
      <div className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-border/60 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/admin/menu')}
          className="p-2.5 rounded-xl border border-border/70 bg-white hover:bg-gray-50 text-text-secondary hover:text-text hover:shadow-md transition-all duration-200 cursor-pointer flex-shrink-0"
          title="Back to Menu"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="admin-breadcrumb">Dashboard</span>
          <h1 className="text-2xl font-bold text-text mt-0.5">New Menu Item</h1>
        </div>
      </div>

      {/* Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Image, Veg-Type & Status */}
        <div className="lg:col-span-5 flex">
          <div className="admin-card p-6 flex flex-col justify-between h-full gap-6 w-full">
            <div className="flex flex-col gap-6">
              <h3 className="admin-section-label">Media & Type</h3>
              
              {/* Photo Upload */}
              <ImageUpload
                value={image}
                onChange={setImage}
                onRemove={() => setImage('')}
                label="Dish Presentation Image"
                id="additem-photo"
              />

              {/* Veg / Non-Veg Toggle Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2.5">
                  Food Category Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      {
                        value: 'veg',
                        label: 'Vegetarian',
                        icon: CheckCircle,
                        colorClass: vegType === 'veg' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm shadow-emerald-500/10' : 'border-border text-text-secondary hover:border-emerald-200',
                        iconColor: vegType === 'veg' ? 'text-emerald-500' : 'text-text-secondary/50',
                      },
                      {
                        value: 'nonveg',
                        label: 'Non-Veg',
                        icon: XCircle,
                        colorClass: vegType === 'nonveg' ? 'border-red-500 bg-red-50/50 text-red-700 shadow-sm shadow-red-500/10' : 'border-border text-text-secondary hover:border-red-200',
                        iconColor: vegType === 'nonveg' ? 'text-red-500' : 'text-text-secondary/50',
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVegType(opt.value)}
                      className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200 cursor-pointer ${opt.colorClass}`}
                    >
                      <opt.icon className={`w-4 h-4 flex-shrink-0 ${opt.iconColor}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Availability Switch */}
            <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-border/50">
              <div>
                <p className="text-sm font-semibold text-text">Availability Status</p>
                <p className="text-xs text-text-secondary/80 mt-0.5">
                  {available ? 'Currently active & visible' : 'Hidden from public e-menu'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAvailable(!available)}
                className={`admin-toggle ${available ? 'active' : 'inactive'}`}
                aria-label="Toggle availability"
              >
                <span className="sr-only">{available ? 'Available' : 'Unavailable'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Menu details */}
        <div className="lg:col-span-7 flex">
          <div className="admin-card p-6 md:p-8 flex flex-col justify-between h-full gap-6 w-full">
            <div className="space-y-6">
              <h3 className="admin-section-label">Dish Specifications</h3>

              {/* Item Name */}
              <Input
                label="Dish Title *"
                id="additem-name"
                placeholder="e.g. Double Patty Cheese Burger, Hazelnut Frappé"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                icon={<ChefHat className="w-4 h-4 text-text-secondary/60" />}
              />

              {/* Category Selector */}
              <div>
                <label htmlFor="additem-category" className="block text-sm font-medium text-text mb-1.5">
                  Menu Category *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 pointer-events-none z-10">
                    <Tag className="w-4 h-4" />
                  </span>
                  <select
                    id="additem-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`admin-select ${errors.category ? 'border-danger' : ''}`}
                    style={{ paddingLeft: '2.75rem' }}
                  >
                    <option value="">Select Category</option>
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
                  <p className="mt-2 text-xs text-amber-600 font-semibold flex items-center gap-1.5">
                    <span>⚠️ Please add a category under "Menu Items" first.</span>
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="additem-desc" className="block text-sm font-medium text-text mb-1.5">
                  Description (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-text-secondary/60 pointer-events-none">
                    <FileText className="w-4 h-4" />
                  </span>
                  <textarea
                    id="additem-desc"
                    rows={3}
                    placeholder="Describe preparation, ingredients, portion sizes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white pr-4 py-2.5 text-sm text-text placeholder:text-text-secondary/50 outline-none resize-none focus:border-primary transition-colors duration-200"
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
              </div>

              {/* Pricing Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Standard Price (₹) *"
                  id="additem-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="199"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  error={errors.price}
                  icon={<IndianRupee className="w-4 h-4 text-text-secondary/60" />}
                />
                <Input
                  label="Discounted Price (₹)"
                  id="additem-discount-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  error={errors.discountPrice}
                  icon={<IndianRupee className="w-4 h-4 text-text-secondary/60" />}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40 w-full">
              <Button
                variant="ghost"
                type="button"
                onClick={() => navigate('/admin/menu')}
                id="additem-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                icon={<Plus className="w-4 h-4" />}
                id="additem-submit"
              >
                Add Item
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
