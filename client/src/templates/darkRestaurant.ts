import type { TemplatePreset } from './types';

export const darkRestaurantTemplate: TemplatePreset = {
  id: 'dark-restaurant',
  name: 'Dark Restaurant',
  description: 'Premium dark aesthetic with luxury typography',
  previewColors: { primary: '#C9A962', secondary: '#8B7355', background: '#0D0D0D' },
  config: {
    templateId: 'dark-restaurant',
    colors: {
      primary: '#C9A962',
      secondary: '#8B7355',
      background: '#0D0D0D',
      surface: '#1A1A1A',
      text: '#F5F0E8',
      textSecondary: '#A89F94',
      accent: '#C9A962',
    },
    fonts: { heading: 'Cormorant Garamond', body: 'Montserrat' },
    borderRadius: 8,
    cardStyle: 'outlined',
    categoryStyle: 'underline',
    shadows: false,
  },
};
