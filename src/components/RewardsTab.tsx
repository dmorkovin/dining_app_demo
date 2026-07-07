import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Coffee, ChefHat, Gift, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DEMO_MODE } from '../lib/demoMode';
import { WelcomeWeekCard } from './WelcomeWeekCard';
import { PlanRecommendationCard } from './PlanRecommendationCard';

interface RewardsCatalogItem {
  id: string;
  name_en: string;
  name_es: string;
  description_en: string | null;
  description_es: string | null;
  point_cost: number;
  reward_type: string;
  image_url: string | null;
  display_order: number;
}

interface LoyaltyTransaction {
  id: string;
  transaction_type: string;
  points_delta: number;
  reason: string | null;
  created_at: string;
}

const FREE_ENTREE_THRESHOLD = 1200;
const COFFEE_GOAL = 10;

interface RewardsTabProps {
  userId: string;
}

export function RewardsTab({ userId }: RewardsTabProps) {
  const { t, i18n } = useTranslation('rewards');
  const [balance, setBalance] = useState(0);
  const [coffeeCount, setCoffeeCount] = useState(0);
  const [catalog, setCatalog] = useState<RewardsCatalogItem[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [welcomeStationsVisited, setWelcomeStationsVisited] = useState<number[]>([]);
  const [foundingFalconBadge, setFoundingFalconBadge] = useState(false);
  const [challengeStations, setChallengeStations] = useState<{ id: number; name: string; icon: string }[]>([]);
  const [planCardData, setPlanCardData] = useState<{ totalSpend: number; orderCount: number; avgPerOrder: number } | null>(null);
  const [planCardDismissed, setPlanCardDismissed] = useState(false);
  const [userMealPlanType, setUserMealPlanType] = useState<string | null>(null);

  useEffect(() => {
    fetchAccount();
    fetchCatalog();
    fetchTransactions();
    fetchWelcomeWeekData();
    fetchPlanCardData();
  }, []);

  const fetchAccount = async () => {
    const { data } = await supabase
      .from('loyalty_accounts')
      .select('balance, coffee_drinks_count')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) {
      setBalance(data.balance);
      setCoffeeCount(data.coffee_drinks_count);
    }
  };

  const fetchCatalog = async () => {
    const { data } = await supabase
      .from('rewards_catalog')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (data) setCatalog(data);
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('loyalty_transactions')
      .select('id, transaction_type, points_delta, reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setTransactions(data);
  };

  const fetchWelcomeWeekData = async () => {
    const { data } = await supabase
      .from('loyalty_accounts')
      .select('welcome_week_stations_visited, founding_falcon_badge')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) {
      setWelcomeStationsVisited(data.welcome_week_stations_visited ?? []);
      setFoundingFalconBadge(data.founding_falcon_badge ?? false);
    }
    const { data: stationsData } = await supabase
      .from('stations')
      .select('id, name, icon')
      .eq('is_active', true)
      .order('display_order');
    if (stationsData) setChallengeStations(stationsData);
  };

  const fetchPlanCardData = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('meal_plan_type')
        .eq('id', userId)
        .maybeSingle();
      setUserMealPlanType(userData?.meal_plan_type ?? null);

      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('imputed_dollar_amount')
        .eq('user_id', userId)
        .eq('transaction_type', 'earn_order');
      if (error || !data) return;
      const orderCount = data.length;
      const totalSpend = data.reduce((sum, row) => sum + (Number(row.imputed_dollar_amount) || 0), 0);
      const avgPerOrder = orderCount > 0 ? totalSpend / orderCount : 0;
      setPlanCardData({ totalSpend, orderCount, avgPerOrder });

      const { data: dismissalEvent } = await supabase
        .from('plan_conversion_events')
        .select('cumulative_orders_at_event')
        .eq('user_id', userId)
        .eq('event_type', 'card_dismissed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (dismissalEvent && orderCount < dismissalEvent.cumulative_orders_at_event + 20) {
        setPlanCardDismissed(true);
      }
    } catch (err) {
      console.error('Plan card data fetch failed:', err);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    const item = catalog.find((c) => c.id === rewardId);
    if (DEMO_MODE) {
      if (item) setBalance((b) => b - item.point_cost);
      setToastMessage(t('redeemSuccess'));
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    setRedeeming(rewardId);
    const { data, error } = await supabase.rpc('redeem_reward', {
      p_user_id: userId,
      p_reward_catalog_id: rewardId,
    });
    setRedeeming(null);
    if (error || (data && data.status === 'error')) return;
    setToastMessage(t('redeemSuccess'));
    fetchAccount();
    fetchTransactions();
    setTimeout(() => setToastMessage(''), 3000);
  };

  const progressPercent = Math.min((balance / FREE_ENTREE_THRESHOLD) * 100, 100);
  const pointsRemaining = Math.max(FREE_ENTREE_THRESHOLD - balance, 0);
  const entreeAvailable = balance >= FREE_ENTREE_THRESHOLD;

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return t('justNow');
    if (diffMin < 60) return t('minutesAgo', { count: diffMin });
    if (diffHours < 24) return t('hoursAgo', { count: diffHours });
    return t('daysAgo', { count: diffDays });
  };

  const getTransactionLabel = (tx: LoyaltyTransaction) => {
    if (tx.transaction_type === 'redeem_coffee') return t('freeDrinkPerch');
    if (tx.transaction_type === 'redeem') return t('rewardRedeemed');
    if (tx.reason) return tx.reason;
    if (tx.transaction_type === 'earn_order') return t('order');
    return t('order');
  };

  const getRewardIcon = (rewardType: string) => {
    if (rewardType === 'coffee_free_drink') return Coffee;
    if (rewardType === 'free_item') return ChefHat;
    return Gift;
  };

  const getRewardName = (item: RewardsCatalogItem) =>
    i18n.language === 'es' ? item.name_es : item.name_en;

  const getRewardDescription = (item: RewardsCatalogItem) =>
    i18n.language === 'es' ? (item.description_es || '') : (item.description_en || '');

  const canRedeem = (item: RewardsCatalogItem) => {
    if (item.reward_type === 'coffee_free_drink') return coffeeCount >= COFFEE_GOAL;
    return balance >= item.point_cost;
  };

  const getDisabledText = (item: RewardsCatalogItem) => {
    if (item.reward_type === 'coffee_free_drink') {
      const remaining = COFFEE_GOAL - coffeeCount;
      return t('moreDrinksNeeded', { count: remaining });
    }
    return t('morePointsNeeded', { count: item.point_cost - balance });
  };

  return (
   <div className="px-5 lg:px-6 pt-6 pb-8" style={{ position: 'relative', overflowY: 'auto', overscrollBehavior: 'contain', height: '100%' }}>
      {/* Points Balance Card */}
      <div
        className="rounded-[14px] p-6 card-shadow-lg mb-4 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/assets/oranges.png)',
          backgroundSize: 'auto 200%',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }} />

        <div className="relative">
          <div className="mb-6">
            <div className="text-white/80 text-sm mb-2" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{t('pointsBalance')}</div>
            <div className="text-5xl font-serif font-bold text-white" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
              {balance.toLocaleString()}
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/90 text-sm" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                {entreeAvailable ? t('freeEntreeAvailable') : t('progressToEntree')}
              </span>
              {!entreeAvailable && (
                <span className="text-white/90 text-sm font-semibold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                  {t('pointsToGo', { count: pointsRemaining })}
                </span>
              )}
            </div>
            <div className="bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Coffee Milestone Strip */}
      <div className="bg-white rounded-[14px] p-4 card-shadow mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-lg">☕</span>
            <span className="text-sm font-bold text-[var(--color-navy)]">
              {coffeeCount}/{COFFEE_GOAL}
            </span>
            <span className="text-sm text-gray-600 ml-1">{t('drinksAtPerch')}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          {Array.from({ length: COFFEE_GOAL }).map((_, i) => (
            <Coffee
              key={i}
              className={`w-5 h-5 transition-colors ${
                i < coffeeCount
                  ? 'text-[var(--color-orange)] fill-[var(--color-orange)]'
                  : 'text-gray-300'
              }`}
              strokeWidth={i < coffeeCount ? 2 : 1.5}
            />
          ))}
        </div>
      </div>

      {/* Welcome Week Challenge */}
      {challengeStations.length > 0 && (
        <div className="mb-5">
          <WelcomeWeekCard
            foundingFalconBadge={foundingFalconBadge}
            welcomeStationsVisited={welcomeStationsVisited}
            challengeStations={challengeStations}
          />
        </div>
      )}

      {/* Plan Recommendation — always visible on RewardsTab */}
      {(() => {
        const hasNoPlan = !userMealPlanType || userMealPlanType === 'none' || userMealPlanType === '';
        if (!hasNoPlan) return null;
        const data = planCardData ?? { totalSpend: 0, orderCount: 0, avgPerOrder: 0 };
        return (
          <div className="mb-5">
            <PlanRecommendationCard
              userId={userId}
              planCardData={data}
              dismissed={planCardDismissed}
              onDismiss={() => setPlanCardDismissed(true)}
            />
          </div>
        );
      })()}

      {/* Redeem Section */}
      <div>
        <h3 className="text-xl font-bold text-[var(--color-navy)] mb-4">{t('redeem')}</h3>
        <div className="grid gap-3">
          {catalog.map((item) => {
            const affordable = canRedeem(item);
            const IconComponent = getRewardIcon(item.reward_type);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-[14px] p-4 card-shadow ${
                  affordable ? 'ring-2 ring-[var(--color-orange)]/20' : 'opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      affordable
                        ? 'bg-[var(--color-orange)]/10 text-[var(--color-orange)]'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[var(--color-navy)]">{getRewardName(item)}</h4>
                    <p className="text-sm text-gray-600 mt-0.5">{getRewardDescription(item)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {item.point_cost > 0 && (
                      <div className="font-serif font-bold text-lg text-[var(--color-orange)]">
                        {item.point_cost}
                      </div>
                    )}
                    {affordable ? (
                      <button
                        onClick={() => handleRedeem(item.id)}
                        disabled={redeeming === item.id}
                        className="mt-1 text-xs font-bold text-white bg-[var(--color-orange)] px-3 py-1.5 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50"
                      >
                        {redeeming === item.id ? '...' : t('redeem')}
                      </button>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                        {getDisabledText(item)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-6">
        <h3 className="text-xl font-bold text-[var(--color-navy)] mb-4">{t('recentActivity')}</h3>
        <div className="space-y-3">
          {transactions.map((tx) => {
            const isPositive = tx.points_delta > 0;

            return (
              <div key={tx.id} className="bg-white rounded-[14px] p-4 card-shadow">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isPositive
                        ? 'bg-teal-50 text-[var(--color-teal)]'
                        : 'bg-orange-50 text-[var(--color-orange)]'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-navy)] font-medium">
                      {getTransactionLabel(tx)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(tx.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span
                      className={`font-serif font-bold ${
                        isPositive ? 'text-[var(--color-teal)]' : 'text-red-500'
                      }`}
                    >
                      {isPositive ? '+' : ''}{tx.points_delta}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg z-50 animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
