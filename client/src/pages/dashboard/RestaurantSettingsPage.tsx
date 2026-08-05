import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Check, ImageOff } from 'lucide-react';
import { useRestaurant } from '../../contexts/RestaurantContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ImageUpload from '../../components/ui/ImageUpload';
import type { TemplateConfig } from '../../types/menu';
import type { TemplatePreset } from '../../templates/types';
import { modernCafeTemplate } from '../../templates/modernCafe';
import { darkRestaurantTemplate } from '../../templates/darkRestaurant';
import { classicMenuTemplate } from '../../templates/classicMenu';
import { getImageUrl } from '../../utils/image';

const templates: TemplatePreset[] = [
  modernCafeTemplate,
  darkRestaurantTemplate,
  classicMenuTemplate,
];

const fontOptions = [
  'Inter', 'Playfair Display', 'Cormorant Garamond', 'Montserrat',
  'Lora', 'Source Sans 3', 'Outfit', 'Open Sans',
];

const defaultConfig: TemplateConfig = modernCafeTemplate.config;

export default function RestaurantSettingsPage() {
  const { restaurant, categories, menuItems, updateTemplate, updateRestaurant } = useRestaurant();
  const [config, setConfig] = useState<TemplateConfig>(restaurant?.templateConfig || defaultConfig);
  const [name, setName] = useState(restaurant?.name || '');
  const [slug, setSlug] = useState(restaurant?.slug || 'menu');
  const [description, setDescription] = useState(restaurant?.description || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name);
      setSlug(restaurant.slug);
      setDescription(restaurant.description || '');
      if (restaurant.templateConfig) setConfig(restaurant.templateConfig);
    }
  }, [restaurant]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories]
  );

  const previewItems = useMemo(
    () => [...menuItems].sort((a, b) => a.order - b.order),
    [menuItems]
  );

  const updateColors = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };

  const updateFonts = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, fonts: { ...prev.fonts, [key]: value } }));
  };

  const applyTemplate = (template: TemplatePreset) => {
    setConfig(template.config);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateRestaurant({ name, slug, description });
      await updateTemplate(config);
    } catch {
      // handled in context
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-page admin-page-enter flex flex-col gap-6 py-2">
      <div className="admin-header-card">
        <div>
          <span className="admin-breadcrumb">Configuration</span>
          <h1 className="text-2xl font-bold text-text mt-0.5 leading-tight">Restaurant Settings</h1>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">
            Manage your restaurant details and customize the customer QR menu appearance.
          </p>
        </div>
        <Button size="md" onClick={handleSave} isLoading={isSaving} icon={<Save className="w-4 h-4" />} className="flex-shrink-0">
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Restaurant Details */}
        <div className="bg-white rounded-2xl border border-border/60 p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold text-text text-sm">Restaurant Details</h3>
          <Input label="Restaurant Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Menu URL Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          />
          <p className="text-xs text-text-secondary -mt-2">Your menu URL: /menu/{slug || 'menu'}</p>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Logo</p>
            <ImageUpload
              value={restaurant?.logo}
              onChange={(url) => updateRestaurant({ logo: url })}
              onRemove={() => updateRestaurant({ logo: '' })}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Cover Image</p>
            <ImageUpload
              value={restaurant?.coverImage}
              onChange={(url) => updateRestaurant({ coverImage: url })}
              onRemove={() => updateRestaurant({ coverImage: '' })}
            />
          </div>
        </div>

        {/* Template Gallery */}
        <div className="bg-white rounded-2xl border border-border/60 p-5 shadow-sm">
          <h3 className="font-semibold text-text text-sm mb-3">Menu Theme</h3>
          <div className="flex flex-col gap-2">
            {templates.map((template) => (
              <motion.button
                key={template.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => applyTemplate(template)}
                className={`relative w-full p-3 rounded-xl text-left border transition-all duration-200 cursor-pointer ${
                  config.templateId === template.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border/60 hover:border-primary/30'
                }`}
              >
                <div className="flex gap-1.5 mb-2">
                  <div className="w-5 h-5 rounded-full border border-black/10" style={{ background: template.previewColors.primary }} />
                  <div className="w-5 h-5 rounded-full border border-black/10" style={{ background: template.previewColors.secondary }} />
                  <div className="w-5 h-5 rounded-full border border-black/10" style={{ background: template.previewColors.background }} />
                </div>
                <p className="text-xs font-semibold text-text">{template.name}</p>
                <p className="text-[10px] text-text-secondary leading-tight mt-0.5">{template.description}</p>
                {config.templateId === template.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Colors</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(config.colors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => updateColors(key, e.target.value)}
                    className="w-7 h-7 rounded border border-border cursor-pointer"
                  />
                  <span className="text-[10px] text-text-secondary capitalize">{key}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Fonts</p>
              <select
                value={config.fonts.heading}
                onChange={(e) => updateFonts('heading', e.target.value)}
                className="w-full rounded-lg border border-border px-2 py-1.5 text-xs bg-white"
              >
                {fontOptions.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <select
                value={config.fonts.body}
                onChange={(e) => updateFonts('body', e.target.value)}
                className="w-full rounded-lg border border-border px-2 py-1.5 text-xs bg-white"
              >
                {fontOptions.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden xl:sticky xl:top-24 max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-3 border-b border-border/40">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Live Preview</p>
          </div>
          <div
            className="min-h-[500px] p-5"
            style={{
              backgroundColor: config.colors.background,
              color: config.colors.text,
              fontFamily: config.fonts.body,
            }}
          >
            <div className="text-center mb-6">
              {restaurant?.logo && (
                <img src={getImageUrl(restaurant.logo)} alt="" className="w-14 h-14 rounded-full mx-auto mb-2 object-cover" />
              )}
              <h2 className="text-lg font-bold" style={{ fontFamily: config.fonts.heading, color: config.colors.primary }}>
                {name || 'Restaurant Name'}
              </h2>
              {description && <p className="text-xs mt-1 opacity-60">{description}</p>}
            </div>

            <div className="flex flex-wrap gap-1.5 justify-center mb-4">
              {sortedCategories.slice(0, 4).map((cat) => (
                <span
                  key={cat._id}
                  className="px-3 py-1 text-[10px] font-medium rounded-full"
                  style={{
                    backgroundColor: config.colors.primary,
                    color: '#fff',
                  }}
                >
                  {cat.name}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {previewItems.slice(0, 3).map((item) => (
                <div
                  key={item._id}
                  className="overflow-hidden"
                  style={{
                    borderRadius: `${config.borderRadius}px`,
                    backgroundColor: config.colors.surface,
                    boxShadow: config.shadows ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {item.image ? (
                    <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-20 object-cover" />
                  ) : (
                    <div className="w-full h-20 flex items-center justify-center" style={{ backgroundColor: `${config.colors.primary}10` }}>
                      <ImageOff className="w-5 h-5 opacity-30" />
                    </div>
                  )}
                  <div className="p-2.5">
                    <h4 className="text-xs font-semibold" style={{ fontFamily: config.fonts.heading }}>{item.name}</h4>
                    <span className="text-xs font-bold" style={{ color: config.colors.primary }}>${item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
