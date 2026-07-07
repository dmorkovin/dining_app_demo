import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

interface PlanDetailModalProps {
  userId: string;
  onClose: () => void;
}

const PLANS = [
  { name: 'Block 25', cost: 256, meals: 25, perMeal: 10.24 },
  { name: 'Block 50', cost: 550, meals: 50, perMeal: 11.0 },
  { name: 'Block 75', cost: 785, meals: 75, perMeal: 10.47 },
  { name: 'Block 100', cost: 956, meals: 100, perMeal: 9.56 },
];

const MAILTO_URL =
  'mailto:housing@utpb.edu?subject=Meal%20Plan%20Add%20Request&body=Hi%2C%0A%0AI%27d%20like%20to%20add%20a%20meal%20plan%20to%20my%20UTPB%20account%20for%20this%20semester.%0A%0APlan%20I%27m%20interested%20in%3A%20%5Bfill%20in%5D%0AStudent%20ID%3A%20%5Bfill%20in%5D%0AName%3A%20%5Bfill%20in%5D%0A%0AThanks';

export function PlanDetailModal({ userId, onClose }: PlanDetailModalProps) {
  const { t } = useTranslation('home');
  const [stats, setStats] = useState<{
    totalSpend: number;
    orderCount: number;
    avgPerOrder: number;
    coffeeLifetime: number;
  } | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [txRes, loyaltyRes] = await Promise.all([
      supabase
        .from('loyalty_transactions')
        .select('imputed_dollar_amount')
        .eq('user_id', userId)
        .eq('transaction_type', 'earn_order'),
      supabase
        .from('loyalty_accounts')
        .select('coffee_drinks_lifetime')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    const rows = txRes.data ?? [];
    const orderCount = rows.length;
    const totalSpend = rows.reduce((sum, r) => sum + (Number(r.imputed_dollar_amount) || 0), 0);
    const avgPerOrder = orderCount > 0 ? totalSpend / orderCount : 0;
    const coffeeLifetime = loyaltyRes.data?.coffee_drinks_lifetime ?? 0;

    setStats({ totalSpend, orderCount, avgPerOrder, coffeeLifetime });
  };

  const getBestFitIndex = (avg: number): number => {
    if (avg < 10) return 3; // Block 100
    if (avg < 11) return 2; // Block 75
    return 1; // Block 50
  };

  if (!stats) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-pulse w-8 h-8 rounded-full bg-gray-200 mx-auto" />
        </div>
      </div>
    );
  }

  const bestFitIdx = getBestFitIndex(stats.avgPerOrder);
  const bestPlan = PLANS[bestFitIdx];
  const savings = Math.max(0, Math.round((stats.avgPerOrder - bestPlan.perMeal) * stats.orderCount));

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/40 flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('planDetailTitle')}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{t('planDetailSubtitle')}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Section 1 — Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t('totalSpent')} value={`$${stats.totalSpend.toFixed(0)}`} />
            <StatCard label={t('numberOfOrders')} value={String(stats.orderCount)} />
            <StatCard label={t('averagePerOrder')} value={`$${stats.avgPerOrder.toFixed(2)}`} />
            <StatCard label={t('coffeeDrinksAtPerch')} value={String(stats.coffeeLifetime)} />
          </div>

          {/* Section 2 — Plan options */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">{t('allPlanOptions')}</h3>
            <div className="space-y-2">
              {PLANS.map((plan, idx) => (
                <div
                  key={plan.name}
                  className={`rounded-xl border p-3 flex items-center justify-between transition-all ${
                    idx === bestFitIdx
                      ? 'border-teal-300 bg-teal-50 ring-1 ring-teal-200'
                      : 'border-gray-150 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{plan.name}</span>
                    {idx === bestFitIdx && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-teal-600 text-white">
                        {t('bestFitForYou')}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">${plan.cost}</span>
                    <span className="text-xs text-gray-500 ml-1.5">
                      {plan.meals} {t('planMeals')} · ${plan.perMeal.toFixed(2)}/{t('perMeal')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 — Savings math */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-700 font-medium">
              {t('ifYouHadPlan', { plan: bestPlan.name })}
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('youdHaveUsed')}</span>
                <span className="font-semibold text-gray-900">
                  {stats.orderCount} {t('of')} {bestPlan.meals} {t('mealsSoFar')}
                </span>
              </div>
              {savings > 0 ? (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('estimatedSavings')}</span>
                  <span className="font-bold text-teal-700">${savings}</span>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-1">{t('breakEvenMessage')}</p>
              )}
            </div>
          </div>

          {/* Section 4 — Disclaimers */}
          <div className="space-y-1.5">
            <p className="text-[11px] text-gray-400">{t('downgradeLock')}</p>
            <p className="text-[11px] text-gray-400">{t('planPurchaseNote')}</p>
          </div>

          {/* Section 5 — CTAs */}
          <div className="space-y-3 pb-2">
            <button
              onClick={() => {
                supabase.from('plan_conversion_events').insert({
                  user_id: userId,
                  event_type: 'comparison_viewed',
                  cumulative_orders_at_event: stats.orderCount,
                  cumulative_spend_at_event: stats.totalSpend,
                }).then(() => {});
                window.open(MAILTO_URL, '_blank');
              }}
              className="w-full h-12 rounded-xl bg-teal-600 text-white text-sm font-semibold shadow-sm hover:bg-teal-700 active:scale-[0.98] transition-all"
            >
              {t('emailHousing')}
            </button>
            <button
              onClick={onClose}
              className="w-full h-10 rounded-xl bg-white text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              {t('notNow')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
      <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
