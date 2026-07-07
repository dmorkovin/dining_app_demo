import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { DEMO_MODE } from '../lib/demoMode';
import { PlanDetailModal } from './PlanDetailModal';

interface PlanRecommendationCardProps {
  userId: string;
  planCardData: { totalSpend: number; orderCount: number; avgPerOrder: number };
  dismissed: boolean;
  onDismiss: () => void;
}

export function PlanRecommendationCard({ userId, planCardData, dismissed, onDismiss }: PlanRecommendationCardProps) {
  const { t } = useTranslation('home');
  const [planDetailOpen, setPlanDetailOpen] = useState(false);
  const shownLogged = useRef(false);

  if (dismissed) return null;

  const logPlanCardEvent = async (eventType: string) => {
    if (DEMO_MODE) return;
    try {
      await supabase.from('plan_conversion_events').insert({
        user_id: userId,
        event_type: eventType,
        cumulative_orders_at_event: planCardData.orderCount,
        cumulative_spend_at_event: planCardData.totalSpend,
      });
    } catch (err) {
      console.error('Plan card event log failed:', err);
    }
  };

  if (!shownLogged.current) {
    shownLogged.current = true;
    logPlanCardEvent('card_shown');
  }

  const { totalSpend, orderCount, avgPerOrder } = planCardData;
  let planName = 'Block 50';
  let planCost = 550;
  let planMeals = 50;
  let planPerMeal = 11;
  if (avgPerOrder < 10) {
    planName = 'Block 100';
    planCost = 956;
    planMeals = 100;
    planPerMeal = 9.56;
  } else if (avgPerOrder < 11) {
    planName = 'Block 75';
    planCost = 785;
    planMeals = 75;
    planPerMeal = 10.47;
  }

  const savingsPerOrder = avgPerOrder - planPerMeal;
  const projectedSavings = Math.round(savingsPerOrder * orderCount * 3);

  return (
    <>
      <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900">{t('planCardTitle')}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{t('planCardSubtitle')}</p>

        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-gray-900">${totalSpend.toFixed(0)}</span>
          <span className="text-sm text-gray-500">{t('across')} {orderCount} {t('orders')}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {t('average')}: <span className="font-semibold text-gray-700">${avgPerOrder.toFixed(2)}</span> {t('perOrder')}
        </p>

        <div className="mt-4 bg-white/60 rounded-xl p-3 border border-teal-100">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{planName}</span> {t('mightFitYou')} — ${planCost} {t('for')} {planMeals} {t('meals')} (${planPerMeal.toFixed(2)} {t('perMeal')}).
          </p>
          {projectedSavings > 0 ? (
            <p className="text-xs text-teal-700 font-medium mt-1.5">
              {t('savingsLine')} <span className="font-bold">${projectedSavings}</span> {t('thisTerm')}.
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1.5">{t('noSavingsYet')}</p>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => { logPlanCardEvent('card_tapped'); setPlanDetailOpen(true); }}
            className="flex-1 h-10 rounded-xl bg-teal-600 text-white text-sm font-semibold shadow-sm hover:bg-teal-700 active:scale-[0.97] transition-all"
          >
            {t('seeTheMath')} →
          </button>
          <button
            onClick={() => {
              logPlanCardEvent('card_dismissed');
              onDismiss();
              if (!DEMO_MODE) {
                supabase.from('loyalty_accounts').update({ plan_conversion_card_dismissed_at: new Date().toISOString() }).eq('user_id', userId).then(() => {});
              }
            }}
            className="flex-1 h-10 rounded-xl bg-white text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-50 active:scale-[0.97] transition-all"
          >
            {t('notInterested')}
          </button>
        </div>
      </div>

      {planDetailOpen && (
        <PlanDetailModal userId={userId} onClose={() => setPlanDetailOpen(false)} />
      )}
    </>
  );
}
