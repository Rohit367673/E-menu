import type { TemplatePreset } from './types';

export const smoothieBarTemplate: TemplatePreset = {
  id: 'smoothie-bar',
  name: 'Smoothie Bar',
  description: 'Fresh and vibrant with coral and teal accents',
  previewColors: { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFFFFF' },
  config: {
    templateId: 'smoothie-bar',
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      background: '#FFFFFF',
      surface: '#F7F9FC',
      text: '#2D3436',
      accent: '#FF6B6B',
    },
    fonts: { heading: 'Outfit', body: 'Inter' },
    borderRadius: 20,
    cardStyle: 'glass',
    categoryStyle: 'pills',
    shadows: true,
  },
};
