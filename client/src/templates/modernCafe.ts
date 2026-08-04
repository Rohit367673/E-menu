import type { TemplatePreset } from './types';

export const modernCafeTemplate: TemplatePreset = {
  id: 'modern-cafe',
  name: 'Modern Cafe',
  description: 'Clean design with large typography and elegant spacing',
  previewColors: { primary: '#8B5E3C', secondary: '#D4A574', background: '#FAF7F2' },
  config: {
    templateId: 'modern-cafe',
    colors: {
      primary: '#8B5E3C',
      secondary: '#D4A574',
      background: '#FAF7F2',
      surface: '#FFFFFF',
      text: '#2C1810',
      textSecondary: '#6B5B4F',
      accent: '#C8956C',
    },
    fonts: { heading: 'Playfair Display', body: 'Inter' },
    borderRadius: 16,
    cardStyle: 'elevated',
    categoryStyle: 'pills',
    shadows: true,
  },
};
