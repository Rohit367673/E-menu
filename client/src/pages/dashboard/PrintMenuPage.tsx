/* ====================================================
   PrintMenuPage.tsx
   Admin-only print menu generator with 3 templates
   Export: PNG (html2canvas) | PDF (server Puppeteer)
   ==================================================== */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  FileImage,
  FileText,
  Loader2,
  Check,
  ArrowLeft,
  Eye,
  LayoutTemplate,
  Coffee,
  Sparkles,
  Moon,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import Template1Modern from '../../components/print/Template1Modern';
import Template2Luxury from '../../components/print/Template2Luxury';
import Template3Dark from '../../components/print/Template3Dark';
import type { Restaurant, Category, MenuItem } from '../../types/menu';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface MenuData {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
}

const TEMPLATES = [
  {
    id: 1,
    name: 'Modern Cafe',
    description: 'Clean white layout with bold headings and food images in a 2-column grid',
    icon: Coffee,
    preview: '#6366f1',
    tag: 'Popular',
  },
  {
    id: 2,
    name: 'Luxury Restaurant',
    description: 'Classic ivory & serif typography with elegant dotted price lines — timeless bistro style',
    icon: Sparkles,
    preview: '#c4a254',
    tag: 'Classic',
  },
  {
    id: 3,
    name: 'Dark Premium Cafe',
    description: 'Dark background with amber gold accents — perfect for a premium or specialty cafe',
    icon: Moon,
    preview: '#f59e0b',
    tag: 'Premium',
  },
];

export default function PrintMenuPage() {
  const navigate = useNavigate();
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null);
  const [exported, setExported] = useState<'png' | 'pdf' | null>(null);
  const templateRef = useRef<HTMLDivElement>(null);

  const primaryColor =
    menuData?.restaurant?.templateConfig?.colors?.primary || '#6366f1';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const serverHost = (API_BASE || '').replace(/\/api\/?$/, '');
        const url = `${serverHost}/api/restaurants/public`;
        const res = await axios.get(url);
        const { restaurant, categories } = res.data.data;
        const items = categories.flatMap((c: Category & { items: MenuItem[] }) => c.items || []);
        setMenuData({ restaurant, categories, items });
      } catch {
        toast.error('Failed to load menu data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportPNG = useCallback(async () => {
    if (!templateRef.current || !menuData) return;
    setExporting('png');
    const toastId = toast.loading('Generating PNG...');
    try {
      await new Promise((r) => setTimeout(r, 300)); // let template render
      const canvas = await html2canvas(templateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: selectedTemplate === 3 ? '#0c0c0f' : '#ffffff',
        logging: false,
        width: 794,
      });
      const link = document.createElement('a');
      link.download = `${menuData.restaurant.name.replace(/\s+/g, '_')}_menu.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('PNG downloaded!', { id: toastId });
      setExported('png');
      setTimeout(() => setExported(null), 3000);
    } catch {
      toast.error('Export failed. Please try again.', { id: toastId });
    } finally {
      setExporting(null);
    }
  }, [menuData, selectedTemplate]);

  const handleExportPDF = useCallback(async () => {
    if (!menuData) return;
    setExporting('pdf');
    const toastId = toast.loading('Generating PDF...');
    try {
      const serverHost = (API_BASE || '').replace(/\/api\/?$/, '');
      const url = `${serverHost}/api/export/menu`;

      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';

      const res = await axios.post(
        url,
        { templateId: selectedTemplate },
        {
          responseType: 'blob',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }
      );

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.download = `${menuData.restaurant.name.replace(/\s+/g, '_')}_menu.pdf`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('PDF downloaded!', { id: toastId });
      setExported('pdf');
      setTimeout(() => setExported(null), 3000);
    } catch {
      // fallback: print
      toast.error('PDF generation failed. Opening print dialog as fallback.', { id: toastId });
      window.print();
    } finally {
      setExporting(null);
    }
  }, [menuData, selectedTemplate]);

  // Template renderer
  const renderTemplate = () => {
    if (!menuData) return null;
    const props = {
      restaurant: menuData.restaurant,
      categories: menuData.categories,
      items: menuData.items,
      primaryColor,
    };
    switch (selectedTemplate) {
      case 1: return <Template1Modern {...props} />;
      case 2: return <Template2Luxury {...props} />;
      case 3: return <Template3Dark {...props} />;
      default: return <Template1Modern {...props} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading menu data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/qr-menu')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-gray-900 text-sm">Print Menu Generator</span>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPNG}
            isLoading={exporting === 'png'}
            icon={exported === 'png' ? <Check className="w-4 h-4 text-emerald-600" /> : <FileImage className="w-4 h-4" />}
            disabled={!!exporting}
          >
            {exporting === 'png' ? 'Exporting...' : 'Export PNG'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportPDF}
            isLoading={exporting === 'pdf'}
            icon={exported === 'pdf' ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            disabled={!!exporting}
          >
            {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── Left Sidebar: Template Selector ── */}
        <div className="w-72 flex-shrink-0 bg-white border-r border-gray-100 overflow-y-auto p-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">
            Choose Template
          </h2>

          <div className="space-y-3">
            {TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              const isActive = selectedTemplate === tpl.id;
              return (
                <motion.button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full text-left p-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer"
                  style={{
                    borderColor: isActive ? '#6366f1' : '#f3f4f6',
                    backgroundColor: isActive ? '#6366f108' : 'white',
                    boxShadow: isActive ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isActive ? '#6366f115' : '#f9fafb',
                        border: isActive ? '1px solid #6366f130' : '1px solid #f3f4f6',
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: isActive ? '#6366f1' : '#9ca3af' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-[13px]" style={{ color: isActive ? '#6366f1' : '#111827' }}>
                          {tpl.name}
                        </span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${tpl.preview}15`,
                            color: tpl.preview,
                          }}
                        >
                          {tpl.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{tpl.description}</p>
                    </div>
                  </div>

                  {isActive && (
                    <div
                      className="mt-3 h-0.5 rounded-full"
                      style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Export info */}
          <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Export Options</h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <FileImage className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-700">PNG Export</p>
                  <p className="text-[11px] text-gray-400">High-resolution image · 2× scale</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-700">PDF Export</p>
                  <p className="text-[11px] text-gray-400">Print-ready A4 · Server-rendered</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-[11px] text-amber-700 leading-relaxed">
              💡 <strong>Tip:</strong> PNG works instantly in the browser. PDF requires the server to be running with Puppeteer installed.
            </p>
          </div>
        </div>

        {/* ── Right: Template Preview ── */}
        <div className="flex-1 overflow-auto bg-gray-100">
          {/* Preview header */}
          <div className="sticky top-0 z-10 bg-gray-100 border-b border-gray-200 px-6 py-2.5 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">
              Preview — {TEMPLATES[selectedTemplate - 1].name}
            </span>
            <span className="text-[10px] text-gray-400 ml-auto">A4 · 794px wide</span>
          </div>

          {/* Template preview container */}
          <div className="flex justify-center p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTemplate}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="shadow-2xl"
                style={{ transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: '-160px' }}
              >
                {/* Hidden full-size template for capture */}
                <div
                  ref={templateRef}
                  style={{
                    width: '794px',
                    transformOrigin: 'top left',
                  }}
                >
                  {renderTemplate()}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating export bar (mobile fallback) */}
      <div className="fixed bottom-4 right-4 flex gap-2 md:hidden">
        <button
          onClick={handleExportPNG}
          disabled={!!exporting}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl text-white shadow-lg cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
    </div>
  );
}
