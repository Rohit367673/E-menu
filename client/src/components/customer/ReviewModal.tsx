import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Heart, CheckCircle2, MessageSquareHeart, Sparkles } from 'lucide-react';
import apiClient from '../../api/client';
import type { TemplateConfig } from '../../types/menu';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  slug?: string;
  googleReviewUrl?: string;
  templateConfig: TemplateConfig;
}

const ratingLabels: Record<number, string> = {
  1: 'Could be better 😕',
  2: 'Fair 🙂',
  3: 'Good 😊',
  4: 'Very Good! 😍',
  5: 'Loved it! Exceptional! 🌟',
};

const experienceTags = [
  '☕ Great Coffee',
  '🍕 Delicious Food',
  '✨ Cozy Ambience',
  '⚡ Fast Service',
  '❤️ Friendly Staff',
  '🧼 Clean & Hygienic',
  '💰 Great Value',
  '🎶 Relaxing Vibes',
];

export default function ReviewModal({
  isOpen,
  onClose,
  restaurantName,
  slug,
  googleReviewUrl,
  templateConfig,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const primary = templateConfig.colors.primary || '#6366f1';

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/reviews', {
        rating,
        name: name.trim() || undefined,
        comment: comment.trim() || undefined,
        tags: selectedTags,
        slug,
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to submit review:', err);
      // Even if network has issues, still celebrate customer feedback locally
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setRating(5);
    setHoverRating(0);
    setName('');
    setComment('');
    setSelectedTags([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleResetAndClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10 my-auto"
        >
          {/* Close Button */}
          <button
            onClick={handleResetAndClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-gray-100/80 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {!isSubmitted ? (
            /* Review Form */
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 flex flex-col gap-6">
              {/* Header */}
              <div className="text-center pt-2">
                <div
                  className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${primary}20, ${primary}10)`,
                    color: primary,
                  }}
                >
                  <MessageSquareHeart className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  Rate Your Experience
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  How was your time at <strong className="text-gray-700">{restaurantName}</strong> today?
                </p>
              </div>

              {/* Interactive Star Selector */}
              <div className="flex flex-col items-center justify-center gap-2 py-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 sm:p-2 rounded-xl transition-transform hover:scale-125 active:scale-95 cursor-pointer focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                            active
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]'
                              : 'text-gray-200 fill-gray-100 hover:text-amber-200'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs sm:text-sm font-semibold text-amber-600 h-5 transition-all">
                  {ratingLabels[hoverRating || rating]}
                </span>
              </div>

              {/* Experience Tags */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  What did you like best? (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {experienceTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-amber-800 font-bold shadow-xs'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Review Textarea */}
              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya S. or leave blank"
                    maxLength={50}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-800 placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Your Review & Feedback (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Tell us what you loved, or how we can make your next dining experience even better..."
                    maxLength={500}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-800 placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${primary}, #f59e0b)`,
                    boxShadow: `0 8px 24px -4px ${primary}40`,
                  }}
                >
                  {isSubmitting ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Heart className="w-4 h-4 fill-white" />
                      <span>Submit Review & Rating</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Thank You / Confirmation Screen */
            <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center gap-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>

              <div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Thank You So Much!</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  Your feedback means the world to our kitchen and team at <strong>{restaurantName}</strong>. We look forward to serving you again soon!
                </p>
              </div>

              {googleReviewUrl && (
                <div className="w-full p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-center flex flex-col items-center gap-2 mt-2">
                  <p className="text-xs text-amber-900 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>Loved your visit? Share it on Google Maps too!</span>
                  </p>
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-800 border border-amber-300 shadow-xs hover:shadow-md text-xs font-bold transition-all"
                  >
                    <span>Post on Google Maps</span>
                    <span className="text-xs">↗</span>
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={handleResetAndClose}
                className="mt-3 px-6 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors cursor-pointer"
              >
                Back to Menu
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
