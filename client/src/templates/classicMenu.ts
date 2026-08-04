import type { TemplatePreset } from './types';

export const classicMenuTemplate: TemplatePreset = {
  id: 'classic-menu',
  name: 'Classic Menu',
  description: 'Traditional white layout, professional and print-friendly',
  previewColors: { primary: '#1A1A1A', secondary: '#555555', background: '#FFFFFF' },
  config: {
    templateId: 'classic-menu',
    colors: {
      primary: '#1A1A1A',
      secondary: '#555555',
      background: '#FFFFFF',
      surface: '#FAFAFA',
      text: '#1A1A1A',
      textSecondary: '#666666',
      accent: '#333333',
    },
    fonts: { heading: 'Lora', body: 'Source Sans 3' },
    borderRadius: 4,
    cardStyle: 'outlined',
    categoryStyle: 'tabs',
    shadows: false,
  },
};
