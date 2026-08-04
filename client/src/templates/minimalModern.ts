import type { TemplatePreset } from './types';

export const minimalModernTemplate: TemplatePreset = {
  id: 'minimal-modern',
  name: 'Minimal Modern',
  description: 'Clean and sophisticated with minimal design',
  previewColors: { primary: '#1A1A1A', secondary: '#F8F8F8', background: '#FFFFFF' },
  config: {
    templateId: 'minimal-modern',
    colors: {
      primary: '#1A1A1A',
      secondary: '#F8F8F8',
      background: '#FFFFFF',
      surface: '#FAFAFA',
      text: '#1A1A1A',
      accent: '#1A1A1A',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
    borderRadius: 8,
    cardStyle: 'flat',
    categoryStyle: 'tabs',
    shadows: false,
  },
};
