import { useState } from 'react';
import { motion } from 'motion/react';
import { Download, FileText, Image as ImageIcon, Loader2, Coffee, Moon, BookOpen } from 'lucide-react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

type ExportTemplateId = 'modern-cafe' | 'dark-restaurant' | 'classic-menu';

interface TemplateOption {
  id: ExportTemplateId;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: { bg: string; accent: string; text: string };
}

const templateOptions: TemplateOption[] = [
  {
    id: 'modern-cafe',
    name: 'Modern Cafe',
    description: 'Clean design with large typography and elegant coffee shop spacing',
    icon: <Coffee className="w-6 h-6" />,
    preview: { bg: '#FAF7F2', accent: '#8B5E3C', text: '#2C1810' },
  },
  {
    id: 'dark-restaurant',
    name: 'Dark Restaurant',
    description: 'Premium dark background with luxury typography and large food images',
    icon: <Moon className="w-6 h-6" />,
    preview: { bg: '#0D0D0D', accent: '#C9A962', text: '#F5F0E8' },
  },
  {
    id: 'classic-menu',
    name: 'Classic Menu',
    description: 'Traditional white layout, easy printing, professional appearance',
    icon: <BookOpen className="w-6 h-6" />,
    preview: { bg: '#FFFFFF', accent: '#1A1A1A', text: '#333333' },
  },
];

export default function ExportMenuPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplateId>('modern-cafe');
  const [isExporting, setIsExporting] = useState<'pdf' | 'png' | null>(null);

  const handleExport = async (format: 'pdf' | 'png') => {
    setIsExporting(format);
    try {
      const response = await apiClient.post(
        '/export/menu',
        { template: selectedTemplate, format },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'image/png',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `menu-${selectedTemplate}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Menu exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Failed to export menu. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  const selected = templateOptions.find((t) => t.id === selectedTemplate)!;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text">Export Menu</h1>
        <p className="text-sm text-text-secondary mt-1">
          Choose a template and download your menu as PDF or PNG. Data is pulled automatically from your menu.
        </p>
      </motion.div>

      {/* Workflow Steps */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
        {['Select Template', 'Auto-Generate', 'Download'].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-[10px]">
              {i + 1}
            </span>
            <span>{step}</span>
            {i < 2 && <span className="text-border mx-1">→</span>}
          </div>
        ))}
      </div>

      {/* Template Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templateOptions.map((template, index) => (
          <motion.button
            key={template.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            onClick={() => setSelectedTemplate(template.id)}
            className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
              selectedTemplate === template.id
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                : 'border-border/60 bg-white hover:border-primary/30'
            }`}
          >
            <div
              className="w-full h-32 rounded-xl mb-4 p-4 flex flex-col justify-between"
              style={{ backgroundColor: template.preview.bg }}
            >
              <div className="flex items-center gap-2" style={{ color: template.preview.accent }}>
                {template.icon}
                <span className="text-sm font-bold" style={{ fontFamily: 'serif' }}>
                  Menu
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-2 w-3/4 rounded" style={{ backgroundColor: template.preview.text, opacity: 0.3 }} />
                <div className="h-2 w-1/2 rounded" style={{ backgroundColor: template.preview.text, opacity: 0.2 }} />
              </div>
            </div>
            <h3 className="font-semibold text-text text-sm">{template.name}</h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{template.description}</p>
          </motion.button>
        ))}
      </div>

      {/* Export Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-border/60 p-6 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-text">Ready to Export</h3>
            <p className="text-sm text-text-secondary mt-1">
              Template: <span className="font-medium text-text">{selected.name}</span>
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Includes restaurant name, logo, categories, items, prices, images, and descriptions.
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting !== null}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isExporting === 'pdf' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
              Download PDF
            </button>
            <button
              onClick={() => handleExport('png')}
              disabled={isExporting !== null}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white text-text font-medium rounded-xl border-2 border-border hover:border-primary/30 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isExporting === 'png' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
              Download PNG
            </button>
          </div>
        </div>
      </motion.div>

      <div className="text-center text-xs text-text-secondary/60 flex items-center justify-center gap-2">
        <Download className="w-3.5 h-3.5" />
        No manual design editing required — your menu data generates the layout automatically.
      </div>
    </div>
  );
}
