import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { haptic } from '../utils/haptics';

interface FeedbackItem {
  id: string;
  name: string;
}

interface OrderFeedbackModalProps {
  orderId: string;
  stationId: number;
  stationName: string;
  items: FeedbackItem[];
  userId: string;
  onClose: () => void;
}

type Step = 'rating' | 'items' | 'positive' | 'negative' | 'thanks';

const REASON_TAGS = [
  'coldFood',
  'wrongItem',
  'longWait',
  'portionSize',
  'taste',
  'other',
] as const;

export function OrderFeedbackModal({
  orderId,
  stationId,
  stationName,
  items,
  userId,
  onClose,
}: OrderFeedbackModalProps) {
  const { t } = useTranslation('feedback');
  const [step, setStep] = useState<Step>('rating');
  const [overallRating, setOverallRating] = useState(0);
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
  const [reasonTags, setReasonTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [routedPublic, setRoutedPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(false);

  const handleStarTap = (rating: number) => {
    haptic.light();
    setOverallRating(rating);
    if (items.length > 1) {
      setStep('items');
    } else if (rating >= 4) {
      setStep('positive');
    } else {
      setStep('negative');
    }
  };

  const handleItemRating = (itemId: string, rating: number) => {
    haptic.light();
    setItemRatings((prev) => ({ ...prev, [itemId]: rating }));
  };

  const handleItemsNext = () => {
    if (overallRating >= 4) {
      setStep('positive');
    } else {
      setStep('negative');
    }
  };

  const toggleReasonTag = (tag: string) => {
    haptic.light();
    setReasonTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAppStoreRate = () => {
    haptic.medium();
    setRoutedPublic(true);
    submitFeedback(true);
  };

  const submitFeedback = async (isPublicRoute = false) => {
    if (submitting) return;
    setSubmitting(true);

    const menuItemRatingsPayload =
      Object.keys(itemRatings).length > 0
        ? Object.entries(itemRatings).map(([id, rating]) => ({
            menu_item_id: id,
            name: items.find((i) => i.id === id)?.name || '',
            rating,
          }))
        : null;

    const reasonTagsPayload =
      reasonTags.length > 0
        ? reasonTags.map((tag) => t(tag as keyof typeof REASON_TAGS))
        : null;

    try {
      const { error } = await supabase.from('order_feedback').insert({
        user_id: userId,
        order_id: orderId,
        station_id: stationId,
        overall_rating: overallRating,
        reason_tags: reasonTagsPayload,
        comment: comment.trim() || null,
        menu_item_ratings: menuItemRatingsPayload,
        routed_public: isPublicRoute,
      });

      if (!error) {
        try {
          const { data: bonusData } = await supabase.rpc('award_bonus', {
            p_user_id: userId,
            p_points: 10,
            p_source_rule: `feedback_${orderId}`,
            p_reason: 'Thanks for your feedback',
          });
          const result = bonusData as { status: string } | null;
          if (result?.status === 'ok') {
            await supabase
              .from('order_feedback')
              .update({ points_awarded: true })
              .eq('order_id', orderId);
            setPointsAwarded(true);
          }
        } catch (loyaltyErr) {
          console.error('Feedback points award failed:', loyaltyErr);
        }
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }

    setSubmitting(false);
    setStep('thanks');
  };

  const renderStars = (
    rating: number,
    onRate: (r: number) => void,
    size: 'lg' | 'sm' = 'lg'
  ) => {
    const starSize = size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
    const gap = size === 'lg' ? 'gap-2' : 'gap-1';
    return (
      <div className={`flex items-center ${gap}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRate(star)}
            className="transition-transform active:scale-110"
          >
            <Star
              className={`${starSize} transition-colors ${
                star <= rating
                  ? 'fill-[var(--color-orange)] text-[var(--color-orange)]'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[70] bg-white/95 backdrop-blur-sm flex flex-col animate-fadeIn">
      <div className="flex justify-end p-4">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {step === 'rating' && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-8">
              {t('howWasOrder')}
            </h2>
            {renderStars(overallRating, handleStarTap, 'lg')}
            <button
              onClick={onClose}
              className="mt-10 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('skip')}
            </button>
          </div>
        )}

        {step === 'items' && (
          <div className="animate-fadeIn w-full max-w-sm">
            <h2 className="text-xl font-bold text-[var(--color-navy)] mb-6">
              {t('rateYourItems')}
            </h2>
            <div className="space-y-4 mb-8">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-700 truncate mr-3">
                    {item.name}
                  </span>
                  {renderStars(
                    itemRatings[item.id] || 0,
                    (r) => handleItemRating(item.id, r),
                    'sm'
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={handleItemsNext}
              className="w-full h-12 rounded-xl font-semibold text-white bg-[var(--color-orange)] shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
            >
              {overallRating >= 4 ? t('done') : t('submit')}
            </button>
            <button
              onClick={handleItemsNext}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('skip')}
            </button>
          </div>
        )}

        {step === 'positive' && (
          <div className="animate-fadeIn">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-2">
              {t('gladYouEnjoyed')}
            </h2>
            <button
              onClick={handleAppStoreRate}
              disabled={submitting}
              className="mt-8 w-full max-w-xs h-12 rounded-xl font-semibold text-white bg-[var(--color-teal)] shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {t('rateOnAppStore')}
            </button>
            <button
              onClick={() => submitFeedback(false)}
              disabled={submitting}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-60"
            >
              {t('done')}
            </button>
          </div>
        )}

        {step === 'negative' && (
          <div className="animate-fadeIn w-full max-w-sm">
            <h2 className="text-xl font-bold text-[var(--color-navy)] mb-1">
              {t('sorryNotGreat')}
            </h2>
            <p className="text-sm text-gray-500 mb-6">{t('whatWentWrong')}</p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {REASON_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleReasonTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                    reasonTags.includes(tag)
                      ? 'bg-[var(--color-orange)] text-white border-[var(--color-orange)]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {t(tag)}
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('commentPlaceholder')}
              maxLength={200}
              className="w-full h-24 p-3 rounded-xl border border-gray-200 resize-none text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-orange)]/30 focus:border-[var(--color-orange)]"
            />
            <button
              onClick={() => submitFeedback(false)}
              disabled={submitting}
              className="mt-6 w-full h-12 rounded-xl font-semibold text-white bg-[var(--color-orange)] shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {t('submit')}
            </button>
          </div>
        )}

        {step === 'thanks' && (
          <div className="animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 fill-green-500 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-navy)] mb-2">
              {overallRating >= 4
                ? t('thankYou')
                : t('sharedWithTeam', { station: stationName })}
            </h2>
            {pointsAwarded && (
              <p className="text-sm font-semibold text-[var(--color-teal)] mt-2">
                {t('pointsEarned')}
              </p>
            )}
            <button
              onClick={onClose}
              className="mt-8 px-8 h-12 rounded-xl font-semibold text-white bg-[var(--color-navy)] shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
            >
              {t('done')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
