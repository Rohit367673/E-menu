import type { TemplateConfig } from '../types/menu';

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  previewColors: { primary: string; secondary: string; background: string };
  config: TemplateConfig;
}
