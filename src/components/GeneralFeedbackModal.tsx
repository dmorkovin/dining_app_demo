import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronDown, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { haptic } from '../utils/haptics';

const CATEGORIES = ['appIssue', 'suggestion', 'stationFood', 'other'] as const;

interface GeneralFeedbackModalProps {
  userId: string;
  onClose: () => void;
}

export function GeneralFeedbackModal({ userId, onClose }: GeneralFeedbackModalProps) {
  const { t } = useTranslation('profile');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim() || submitting) return;
    setSubmitting(true);
    haptic.medium();

    const categoryLabel = t(`generalFeedback.categories.${category}`);

    await supabase.from('general_feedback').insert({
      user_id: userId,
      category: categoryLabel,
      comment: comment.trim(),
    });

    setSubmitting(false);
    setSubmitted(true);
    haptic.success();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl animate-fadeIn overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold text-[var(--color-navy)]">
            {t('generalFeedback.title')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {!submitted ? (
          <div className="px-5 pb-5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {t('generalFeedback.categoryLabel')}
            </label>
            <div className="relative mb-4">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[var(--color-navy)] font-medium hover:border-gray-300 transition-colors"
              >
                <span>{t(`generalFeedback.categories.${category}`)}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                        category === cat ? 'text-[var(--color-orange)] font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <span>{t(`generalFeedback.categories.${cat}`)}</span>
                      {category === cat && <Check className="w-4 h-4 text-[var(--color-orange)]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('generalFeedback.commentPlaceholder')}
              maxLength={500}
              rows={4}
              className="w-full p-3 rounded-xl border border-gray-200 resize-none text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-orange)]/30 focus:border-[var(--color-orange)] transition-all"
            />

            <button
              onClick={handleSubmit}
              disabled={!comment.trim() || submitting}
              className="mt-4 w-full h-12 rounded-xl font-semibold text-white bg-[var(--color-orange)] shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('generalFeedback.submitting') : t('generalFeedback.submit')}
            </button>
          </div>
        ) : (
          <div className="px-5 pb-5 text-center py-6">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-500" />
            </div>
            <p className="text-sm text-gray-700 font-medium">
              {t('generalFeedback.success')}
            </p>
            <button
              onClick={onClose}
              className="mt-5 px-8 h-10 rounded-xl font-semibold text-sm text-white bg-[var(--color-navy)] active:scale-[0.98] transition-all"
            >
              {t('generalFeedback.done')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
