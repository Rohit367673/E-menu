import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '../../api/upload';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  id?: string;
}

export default function ImageUpload({ value, onChange, onRemove, label, id }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const uploadId = id || 'image-upload';

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }
      setIsUploading(true);
      setProgress(0);

      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 90));
      }, 200);

      try {
        const { data } = await uploadImage(file);
        setProgress(100);
        onChange(data.data.url);
        toast.success('Image uploaded');
      } catch {
        toast.error('Upload failed');
      } finally {
        clearInterval(progressInterval);
        setTimeout(() => {
          setIsUploading(false);
          setProgress(0);
        }, 500);
      }
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      {label && <p className="text-sm font-medium text-text mb-1.5">{label}</p>}
      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl overflow-hidden border border-border group"
          >
            <img src={value} alt="Upload preview" className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
              {onRemove && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 bg-white rounded-full shadow-lg cursor-pointer"
                  onClick={() => {
                    onRemove();
                  }}
                  id={`${uploadId}-remove`}
                  type="button"
                >
                  <X className="w-5 h-5 text-danger" />
                </motion.button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.label
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            htmlFor={uploadId}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`
              relative flex flex-col items-center justify-center w-full h-48
              rounded-xl border-2 border-dashed cursor-pointer
              transition-all duration-300
              ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/40 hover:bg-gray-50'}
              ${isUploading ? 'pointer-events-none' : ''}
            `}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-sm text-text-secondary">Uploading... {progress}%</p>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-full bg-primary/10 mb-3">
                  {isDragging ? (
                    <ImageIcon className="w-6 h-6 text-primary" />
                  ) : (
                    <Upload className="w-6 h-6 text-primary" />
                  )}
                </div>
                <p className="text-sm font-medium text-text">
                  {isDragging ? 'Drop image here' : 'Click or drag image'}
                </p>
                <p className="text-xs text-text-secondary mt-1">PNG, JPG up to 5MB</p>
              </>
            )}
            <input
              type="file"
              id={uploadId}
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
}
