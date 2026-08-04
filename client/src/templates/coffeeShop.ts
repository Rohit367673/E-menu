import type { TemplatePreset } from './types';

export const coffeeShopTemplate: TemplatePreset = {
  id: 'coffee-shop',
  name: 'Coffee Shop',
  description: 'Warm and cozy with rich browns and cream tones',
  previewColors: { primary: '#2C1810', secondary: '#D4A574', background: '#FFF8F0' },
  config: {
    templateId: 'coffee-shop',
    colors: {
      primary: '#2C1810',
      secondary: '#D4A574',
      background: '#FFF8F0',
      surface: '#FFFFFF',
      text: '#2C1810',
      accent: '#8B6914',
    },
    fonts: { heading: 'Playfair Display', body: 'Lora' },
    borderRadius: 12,
    cardStyle: 'elevated',
    categoryStyle: 'underline',
    shadows: true,
  },
};
