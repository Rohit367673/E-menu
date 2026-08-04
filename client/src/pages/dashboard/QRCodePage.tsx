import { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import apiClient from '../../api/client';
import { downloadQR } from '../../api/qr';
import type { Restaurant } from '../../types/menu';

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export default function QRCodePage() {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [fgColor, setFgColor] = useState('#1f2937');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(280);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [copied, setCopied] = useState(false);
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

  const menuUrl = `${APP_URL}/menu/${restaurant?.slug || 'menu'}`;

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

  const handleDownloadPNG = useCallback(async () => {
    try {
      const res = await downloadQR({ format: 'png', size: 1024, fgColor, bgColor });
      const blob = new Blob([res.data], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${restaurant?.slug || 'menu'}-qr-code.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      if (!qrCanvasRef.current) return;
      const canvas = qrCanvasRef.current.querySelector('canvas');
      if (!canvas) return;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${restaurant?.name || 'menu'}-qr-code.png`;
      link.href = url;
      link.click();
    }
  }, [restaurant, fgColor, bgColor]);

  const handleDownloadSVG = useCallback(async () => {
    try {
      const res = await downloadQR({ format: 'svg', size: 1024, fgColor, bgColor });
      const blob = new Blob([res.data], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${restaurant?.slug || 'menu'}-qr-code.svg`;
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
      link.download = `${restaurant?.name || 'menu'}-qr-code.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [restaurant, fgColor, bgColor]);

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
    <div className="admin-page admin-page-enter">
      {/* Page Header + Quick Actions */}
      <motion.div
        className="mb-6 flex items-start justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <span className="admin-breadcrumb">QR Menu</span>
          <p className="text-sm text-text-secondary mt-0.5">Generate and customize your restaurant QR code</p>
        </div>
        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`/menu/${restaurant.slug || 'menu'}`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border-2 border-border bg-white hover:border-gray-300 hover:bg-gray-50 text-text transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Preview Menu
          </button>
          <button
            onClick={() => navigate('/admin/print-menu')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}
          >
            <FileOutput className="w-4 h-4" />
            Print Menu
          </button>
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
              <p className="text-white/70 text-sm mt-1">Scan to view our menu</p>
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
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white rounded-lg border border-border hover:border-gray-300 text-text transition-colors flex-shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleDownloadPNG}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25 cursor-pointer text-sm"
            >
              <ImageIcon className="w-5 h-5" />
              Download PNG
            </button>
            <button
              onClick={handleDownloadSVG}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-text font-semibold rounded-xl border-2 border-border hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer text-sm"
            >
              <Download className="w-5 h-5" />
              Download SVG
            </button>
          </div>
        </motion.div>

        {/* RIGHT: Customization */}
        <motion.div
          className="lg:w-80 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="admin-card p-6 lg:sticky lg:top-20 space-y-6">
            <h2 className="text-lg font-semibold text-text flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Customize
            </h2>

            {/* Foreground Color */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">QR Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-lg font-mono focus:border-primary focus:ring-0 outline-none transition-colors"
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
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-lg font-mono focus:border-primary focus:ring-0 outline-none transition-colors"
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
    </div>
  );
}
