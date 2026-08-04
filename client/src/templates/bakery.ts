import type { TemplatePreset } from './types';

export const bakeryTemplate: TemplatePreset = {
  id: 'bakery',
  name: 'Bakery',
  description: 'Elegant and warm with artisan charm',
  previewColors: { primary: '#8B7355', secondary: '#F5E6D3', background: '#FFFBF5' },
  config: {
    templateId: 'bakery',
    colors: {
      primary: '#8B7355',
      secondary: '#F5E6D3',
      background: '#FFFBF5',
      surface: '#FFFFFF',
      text: '#4A3728',
      accent: '#C4956A',
    },
    fonts: { heading: 'Cormorant Garamond', body: 'Source Sans 3' },
    borderRadius: 8,
    cardStyle: 'flat',
    categoryStyle: 'cards',
    shadows: false,
  },
};
