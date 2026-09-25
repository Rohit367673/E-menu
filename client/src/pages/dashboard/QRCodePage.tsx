import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Copy,
  Check,
  Loader2,
  Smartphone,
  Palette,
  Maximize2,
  QrCode,
  Link as LinkIcon,
  Image as ImageIcon,
  ExternalLink,
  FileOutput,
  Printer,
  Plus,
  X,
} from 'lucide-react';
import apiClient from '../../api/client';
import { downloadQR } from '../../api/qr';
import Button from '../../components/ui/Button';
import type { Restaurant } from '../../types/menu';
import { useRestaurant } from '../../contexts/RestaurantContext';

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export const cleanTableValue = (tbl: string) => {
  const match = String(tbl || '').trim().match(/^Table\s*(\d+)$/i);
  if (match) return match[1];
  return String(tbl || '').trim();
};

export default function QRCodePage() {
  const navigate = useNavigate();
  const { addTable: contextAddTable } = useRestaurant();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [fgColor, setFgColor] = useState('#1f2937');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(280);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [customTable, setCustomTable] = useState<string>('');
  const [addingScanner, setAddingScanner] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const qrCanvasRef = useRef<HTMLDivElement>(null);
  const qrSvgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/restaurants/me');
        const rest = res.data.data.restaurant;
        setRestaurant(rest);
        if (rest?.templateConfig?.colors?.primary) {
          setFgColor(rest.templateConfig.colors.primary);
        }
      } catch (err) {
        console.error('Error loading restaurant:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, []);

  const tables = useMemo(() => {
    const list = restaurant?.tables && restaurant.tables.length > 0
      ? [...restaurant.tables]
      : Array.from({ length: 10 }, (_, i) => `Table ${i + 1}`);

    return list.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 999;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 999;
      if (a.startsWith('Table') && b.startsWith('Table')) return numA - numB;
      if (a.startsWith('Table')) return -1;
      if (b.startsWith('Table')) return 1;
      return a.localeCompare(b);
    });
  }, [restaurant?.tables]);

  const activeTableLabel = useMemo(() => {
    if (selectedTable === 'all') return '';
    if (selectedTable === 'custom') return customTable.trim() || 'Custom';
    return cleanTableValue(selectedTable);
  }, [selectedTable, customTable]);

  const displayBannerTitle = useMemo(() => {
    if (selectedTable === 'all') return 'Scan to view our menu';
    if (selectedTable === 'custom') {
      const c = customTable.trim();
      if (!c) return 'Custom Table — Scan to Order';
      return /^table\s+/i.test(c) ? `${c} — Scan to Order` : `Table ${c} — Scan to Order`;
    }
    if (/^table\s+/i.test(selectedTable)) return `${selectedTable} — Scan to Order`;
    return `Table ${selectedTable} — Scan to Order`;
  }, [selectedTable, customTable]);

  const menuUrl = useMemo(() => {
    const slug = restaurant?.slug;
    const base = (!slug || slug === 'menu') ? `${APP_URL}/menu` : `${APP_URL}/menu/${slug}`;
    if (selectedTable === 'all') return base;
    const tblVal = selectedTable === 'custom' ? (customTable.trim() || '1') : cleanTableValue(selectedTable);
    return `${base}?table=${encodeURIComponent(tblVal)}`;
  }, [restaurant?.slug, selectedTable, customTable]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = menuUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [menuUrl]);

  const handleQuickAddScanner = async () => {
    try {
      setAddingScanner(true);
      const newTable = await contextAddTable();
      if (restaurant) {
        setRestaurant({
          ...restaurant,
          tables: [...(restaurant.tables || []), newTable],
        });
      }
      setSelectedTable(newTable);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingScanner(false);
    }
  };

  const handleDownloadPNG = useCallback(async () => {
    const cleanLabel = activeTableLabel || 'menu';
    const filePrefix = selectedTable !== 'all'
      ? `${restaurant?.slug || 'sukoon'}-table-${cleanLabel.toLowerCase().replace(/\s+/g, '-')}`
      : `${restaurant?.slug || 'sukoon'}-menu`;

    try {
      const res = await downloadQR({ format: 'png', size: 1024, fgColor, bgColor });
      const blob = new Blob([res.data], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${filePrefix}-qr-code.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      if (!qrCanvasRef.current) return;
      const canvas = qrCanvasRef.current.querySelector('canvas');
      if (!canvas) return;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${filePrefix}-qr-code.png`;
      link.href = url;
      link.click();
    }
  }, [restaurant, fgColor, bgColor, selectedTable, activeTableLabel]);

  const handleDownloadSVG = useCallback(async () => {
    const cleanLabel = activeTableLabel || 'menu';
    const filePrefix = selectedTable !== 'all'
      ? `${restaurant?.slug || 'sukoon'}-table-${cleanLabel.toLowerCase().replace(/\s+/g, '-')}`
      : `${restaurant?.slug || 'sukoon'}-menu`;

    try {
      const res = await downloadQR({ format: 'svg', size: 1024, fgColor, bgColor });
      const blob = new Blob([res.data], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${filePrefix}-qr-code.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      if (!qrSvgRef.current) return;
      const svgElement = qrSvgRef.current.querySelector('svg');
      if (!svgElement) return;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${filePrefix}-qr-code.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [restaurant, fgColor, bgColor, selectedTable, activeTableLabel]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <QrCode className="w-12 h-12 mx-auto text-text-secondary/30 mb-4" />
          <h2 className="text-xl font-semibold text-text mb-2">No Restaurant Found</h2>
          <p className="text-text-secondary text-sm">Please set up your restaurant first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page admin-page-enter flex flex-col gap-6 py-2">
      {/* Page Header + Quick Actions */}
      <motion.div
        className="admin-header-card"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <span className="admin-breadcrumb">QR Menu</span>
          <h1 className="text-2xl font-bold text-text mt-0.5 leading-tight">QR Code Generator</h1>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">
            Generate and customize your restaurant tableside QR codes synchronized with your {tables.length} floor tables
          </p>
        </div>
        {/* Quick action buttons */}
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBatchModal(true)}
            icon={<Printer className="w-4 h-4" />}
            className="border border-border/80 hover:bg-stone-50 font-bold"
          >
            Print All Table QRs
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(menuUrl, '_blank')}
            icon={<ExternalLink className="w-4 h-4" />}
          >
            Preview Menu
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/print-menu')}
            icon={<FileOutput className="w-4 h-4" />}
          >
            Print Menu
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT: QR Preview */}
        <motion.div
          className="flex-1 min-w-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* QR Card */}
          <div className="admin-card overflow-hidden shadow-xl">
            {/* Card Header */}
            <div
              className="px-8 py-6 text-center"
              style={{
                background: `linear-gradient(135deg, ${restaurant.templateConfig?.colors?.primary || '#6366f1'}, ${restaurant.templateConfig?.colors?.secondary || '#8b5cf6'})`,
              }}
            >
              {restaurant.logo && (
                <img
                  src={restaurant.logo}
                  alt=""
                  className="w-14 h-14 rounded-xl mx-auto mb-3 object-cover border-2 border-white/30 shadow-lg"
                />
              )}
              <h2 className="text-xl font-bold text-white">{restaurant.name}</h2>
              <p className="text-white/90 text-sm mt-1 font-semibold tracking-wide">
                {displayBannerTitle}
              </p>
            </div>

            {/* QR Code */}
            <div className="px-8 py-10 flex flex-col items-center" style={{ backgroundColor: bgColor }}>
              {/* SVG version (for display & SVG download) */}
              <div ref={qrSvgRef}>
                <QRCodeSVG
                  value={menuUrl}
                  size={size}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level="H"
                  includeMargin={false}
                  imageSettings={
                    includeLogo && restaurant.logo
                      ? {
                          src: restaurant.logo,
                          height: Math.round(size * 0.18),
                          width: Math.round(size * 0.18),
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>

              {/* Hidden canvas for PNG download */}
              <div ref={qrCanvasRef} className="hidden">
                <QRCodeCanvas
                  value={menuUrl}
                  size={size * 2}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level="H"
                  includeMargin
                  imageSettings={
                    includeLogo && restaurant.logo
                      ? {
                          src: restaurant.logo,
                          height: Math.round(size * 0.36),
                          width: Math.round(size * 0.36),
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>
            </div>

            {/* Menu link */}
            <div className="px-8 pb-6">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-border/50">
                <LinkIcon className="w-4 h-4 text-text-secondary/50 flex-shrink-0" />
                <span className="text-sm text-text-secondary truncate flex-1">{menuUrl}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLink}
                  icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  className="h-8 px-3"
                >
                  <span className={copied ? 'text-emerald-600' : ''}>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="primary"
              size="lg"
              onClick={handleDownloadPNG}
              icon={<ImageIcon className="w-5 h-5" />}
              className="flex-1"
            >
              Download PNG
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleDownloadSVG}
              icon={<Download className="w-5 h-5" />}
              className="flex-1 border border-border hover:border-gray-300"
            >
              Download SVG
            </Button>
          </div>
        </motion.div>

        {/* RIGHT: Customization */}
        <motion.div
          className="lg:w-80 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="admin-card p-6 lg:sticky lg:top-20 flex flex-col gap-6">
            <h2 className="text-lg font-semibold text-text flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Customize
            </h2>

            {/* Table Specific QR Assignment */}
            <div className="border-b border-border/60 pb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-text">Table Scanners ({tables.length})</label>
                <span className="text-[11px] font-semibold text-text-secondary">Sync with Floor</span>
              </div>
              <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                Generate 1-to-1 matching QR codes for each table so customer orders automatically route to that table number.
              </p>

              {/* Table Chips Grid */}
              <div className="flex flex-wrap gap-1.5 mb-3 max-h-48 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setSelectedTable('all')}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    selectedTable === 'all'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  General
                </button>

                {tables.map((tbl) => {
                  const cleanNum = cleanTableValue(tbl);
                  const isSelected = selectedTable === tbl || (selectedTable === cleanNum && !tbl.includes(' '));
                  const chipLabel = /^\d+$/.test(cleanNum) ? `T-${cleanNum}` : cleanNum;

                  return (
                    <button
                      key={tbl}
                      type="button"
                      onClick={() => setSelectedTable(tbl)}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                      title={tbl}
                    >
                      {chipLabel}
                    </button>
                  );
                })}

                {/* + Add Table Scanner Button */}
                <button
                  type="button"
                  onClick={handleQuickAddScanner}
                  disabled={addingScanner}
                  className="py-1.5 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer border border-dashed border-stone-400 text-stone-700 hover:border-stone-900 hover:text-stone-900 hover:bg-stone-50 flex items-center gap-1 shadow-2xs"
                  title="Add next table scanner"
                >
                  {addingScanner ? (
                    <Loader2 className="w-3 h-3 animate-spin text-stone-600" />
                  ) : (
                    <Plus className="w-3 h-3 stroke-[3]" />
                  )}
                  <span>+ Add Scanner</span>
                </button>
              </div>

              {/* Custom Table Input Option */}
              <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setSelectedTable('custom')}
                  className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                    selectedTable === 'custom'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Custom
                </button>
                {selectedTable === 'custom' && (
                  <input
                    type="text"
                    placeholder="e.g. Patio 2, Bar 1"
                    value={customTable}
                    onChange={(e) => setCustomTable(e.target.value)}
                    className="flex-1 h-8 px-2.5 text-xs border border-border rounded-lg outline-none focus:border-stone-900 font-semibold"
                  />
                )}
              </div>
            </div>

            {/* Foreground Color */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">QR Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-border hover:scale-105 transition-transform"
                  style={{ appearance: 'none', WebkitAppearance: 'none' }}
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="flex-1 h-10 px-3 text-sm border border-border rounded-lg font-mono focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Background Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-border hover:scale-105 transition-transform"
                  style={{ appearance: 'none', WebkitAppearance: 'none' }}
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 h-10 px-3 text-sm border border-border rounded-lg font-mono focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Maximize2 className="w-4 h-4" />
                    Size
                  </span>
                  <span className="text-text-secondary font-normal">{size}px</span>
                </div>
              </label>
              <input
                type="range"
                min={150}
                max={400}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>

            {/* Logo Toggle */}
            {restaurant.logo && (
              <div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-text flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Include Logo
                  </span>
                  <button
                    type="button"
                    onClick={() => setIncludeLogo(!includeLogo)}
                    className={`admin-toggle ${includeLogo ? 'active' : 'inactive'}`}
                    aria-label="Toggle logo inclusion"
                  >
                    <span className="sr-only">{includeLogo ? 'Included' : 'Excluded'}</span>
                  </button>
                </label>
                <p className="text-xs text-text-secondary mt-1 ml-6">Show restaurant logo in QR center</p>
              </div>
            )}

            {/* Quick Presets */}
            <div>
              <label className="block text-sm font-medium text-text mb-3">Quick Presets</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { fg: '#1f2937', bg: '#ffffff', name: 'Classic' },
                  { fg: '#ffffff', bg: '#1f2937', name: 'Dark' },
                  { fg: restaurant.templateConfig?.colors?.primary || '#6366f1', bg: '#ffffff', name: 'Brand' },
                  { fg: '#059669', bg: '#ecfdf5', name: 'Green' },
                  { fg: '#dc2626', bg: '#fef2f2', name: 'Red' },
                  { fg: '#7c3aed', bg: '#f5f3ff', name: 'Purple' },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setFgColor(preset.fg);
                      setBgColor(preset.bg);
                    }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-border hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div
                      className="w-8 h-8 rounded-md border border-border"
                      style={{
                        background: `linear-gradient(135deg, ${preset.fg} 50%, ${preset.bg} 50%)`,
                      }}
                    />
                    <span className="text-xs text-text-secondary">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Batch Printable Sheet Modal for All Table QRs */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-stone-900 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-black tracking-tight">Print All Table QR Cards</h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  {tables.length} table cards ready for tabletop stands or tent cards.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-white text-stone-900 font-bold text-xs flex items-center gap-1.5 hover:bg-stone-100 transition-colors shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print All Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Printable Grid */}
            <div className="p-6 overflow-y-auto flex-1 bg-stone-50">
              <div
                id="printable-qr-grid"
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
              >
                {tables.map((tbl) => {
                  const cleanNum = cleanTableValue(tbl);
                  const slug = restaurant?.slug;
                  const cardUrl = (!slug || slug === 'menu')
                    ? `${APP_URL}/menu?table=${encodeURIComponent(cleanNum)}`
                    : `${APP_URL}/menu/${slug}?table=${encodeURIComponent(cleanNum)}`;

                  return (
                    <div
                      key={tbl}
                      className="bg-white rounded-2xl border-2 border-stone-300 p-5 flex flex-col items-center text-center shadow-xs page-break-inside-avoid"
                    >
                      {/* Brand Header */}
                      <div className="flex items-center gap-2 mb-3">
                        {restaurant.logo && (
                          <img
                            src={restaurant.logo}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                        )}
                        <span className="font-black text-sm text-stone-900 tracking-tight">
                          {restaurant.name}
                        </span>
                      </div>

                      {/* Large Table Number */}
                      <div className="py-1 px-4 mb-3 rounded-full bg-stone-900 text-white font-black text-sm tracking-wider uppercase">
                        {tbl}
                      </div>

                      {/* QR Code */}
                      <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs mb-3">
                        <QRCodeSVG
                          value={cardUrl}
                          size={150}
                          fgColor="#1c1917"
                          bgColor="#ffffff"
                          level="H"
                          includeMargin={false}
                          imageSettings={
                            includeLogo && restaurant.logo
                              ? {
                                  src: restaurant.logo,
                                  height: 28,
                                  width: 28,
                                  excavate: true,
                                }
                              : undefined
                          }
                        />
                      </div>

                      {/* Instructions */}
                      <p className="text-[12px] font-extrabold text-stone-800">
                        Scan to View Menu & Order
                      </p>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        Table {cleanNum} will be tagged automatically
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
