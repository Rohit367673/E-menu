import type { TemplatePreset } from './types';

export const fastFoodTemplate: TemplatePreset = {
  id: 'fast-food',
  name: 'Fast Food',
  description: 'Bold and energetic with red-orange vibes',
  previewColors: { primary: '#FF4500', secondary: '#FFD700', background: '#FFFFFF' },
  config: {
    templateId: 'fast-food',
    colors: {
      primary: '#FF4500',
      secondary: '#FFD700',
      background: '#FFFFFF',
      surface: '#FFF9F0',
      text: '#1A1A1A',
      accent: '#FF4500',
    },
    fonts: { heading: 'Bebas Neue', body: 'Open Sans' },
    borderRadius: 16,
    cardStyle: 'elevated',
    categoryStyle: 'pills',
    shadows: true,
  },
};
