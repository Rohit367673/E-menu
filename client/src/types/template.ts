import type { TemplateConfig } from './menu';

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  previewColors: {
    primary: string;
    secondary: string;
    background: string;
  };
  config: TemplateConfig;
}
