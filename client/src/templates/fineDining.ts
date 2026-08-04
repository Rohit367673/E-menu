import type { TemplatePreset } from './types';

export const fineDiningTemplate: TemplatePreset = {
  id: 'fine-dining',
  name: 'Fine Dining',
  description: 'Luxurious dark theme with gold accents',
  previewColors: { primary: '#C9A96E', secondary: '#1A1A2E', background: '#0D0D1A' },
  config: {
    templateId: 'fine-dining',
    colors: {
      primary: '#C9A96E',
      secondary: '#1A1A2E',
      background: '#0D0D1A',
      surface: '#1A1A2E',
      text: '#E8E8E8',
      accent: '#C9A96E',
    },
    fonts: { heading: 'Playfair Display', body: 'Montserrat' },
    borderRadius: 4,
    cardStyle: 'outlined',
    categoryStyle: 'underline',
    shadows: true,
  },
};
