import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Coffee, ChefHat, Gift, TrendingUp, TrendingDown, X, CreditCard, Bell, Sparkles } from 'lucide-react';
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
  const [redeemedItem, setRedeemedItem] = useState<RewardsCatalogItem | null>(null);
  const [pendingRewards, setPendingRewards] = useState<RewardsCatalogItem[]>([]);
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
      if (item) {
        setBalance((b) => b - item.point_cost);
        setRedeemedItem(item);
      }
      return;
    }
    setRedeeming(rewardId);
    const { data, error } = await supabase.rpc('redeem_reward', {
      p_user_id: userId,
      p_reward_catalog_id: rewardId,
    });
    setRedeeming(null);
    if (error || (data && data.status === 'error')) return;
    if (item) setRedeemedItem(item);
    fetchAccount();
    fetchTransactions();
    supabase.from('notifications').insert({
      user_id: userId,
      from_name: 'Rewards',
      message: `Your ${i18n.language === 'es' ? item?.name_es : item?.name_en} is ready! Show your meal card at the counter to collect.`,
      unread: true,
    }).then(() => {});
  };

  const handleDismissRedeemed = () => {
    if (redeemedItem) setPendingRewards((prev) => [redeemedItem, ...prev]);
    setRedeemedItem(null);
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

      {/* Pending rewards notification banner */}
      {pendingRewards.length > 0 && (
        <div className="mb-5 space-y-2">
          {pendingRewards.map((pr, i) => {
            const PrIcon = getRewardIcon(pr.reward_type);
            const prName = i18n.language === 'es' ? pr.name_es : pr.name_en;
            return (
              <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 shadow-sm animate-fadeIn">
                <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-900 truncate">Free item pending: {prName}</p>
                  <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 flex-shrink-0" />
                    Show at the counter or add to your meal card to collect
                  </p>
                </div>
                <button
                  onClick={() => setPendingRewards((prev) => prev.filter((_, j) => j !== i))}
                  className="text-amber-400 hover:text-amber-600 flex-shrink-0 ml-1"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

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

      {/* Redemption success modal */}
      {redeemedItem && (() => {
        const ModalIcon = getRewardIcon(redeemedItem.reward_type);
        const rewardName = i18n.language === 'es' ? redeemedItem.name_es : redeemedItem.name_en;
        const rewardDesc = i18n.language === 'es' ? (redeemedItem.description_es || '') : (redeemedItem.description_en || '');
        return (
          <div className="fixed inset-0 z-[90] flex items-end justify-center" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
              onClick={handleDismissRedeemed}
            />
            <div className="relative w-full max-w-[430px] bg-white rounded-t-3xl shadow-2xl flex flex-col sheet-enter"
              style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>

              {/* Drag handle */}
              <div className="pt-3 pb-1 flex justify-center">
                <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Celebration header */}
              <div className="px-6 pt-4 pb-6 text-center">
                <div className="relative inline-flex mb-5">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-xl">
                    <ModalIcon className="w-11 h-11 text-white" strokeWidth={1.8} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-md border-2 border-white">
                    <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-navy)]">Reward Redeemed!</h2>
                <p className="text-gray-500 text-sm mt-1">Your free item is waiting for you</p>
              </div>

              {/* Reward detail card */}
              <div className="mx-6 mb-4 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <ModalIcon className="w-6 h-6 text-orange-600" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[var(--color-navy)] truncate">{rewardName}</p>
                  {rewardDesc && <p className="text-sm text-gray-500 mt-0.5 leading-snug">{rewardDesc}</p>}
                </div>
              </div>

              {/* Instruction banner */}
              <div className="mx-6 mb-6 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Add to your meal card to collect</p>
                  <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                    Show this at the dining counter or scan your meal card. Your reward will be applied automatically.
                  </p>
                </div>
              </div>

              <div className="px-6">
                <button
                  onClick={handleDismissRedeemed}
                  className="w-full h-14 rounded-2xl bg-[var(--color-orange,#FF6B35)] text-white font-semibold text-base shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  Got it — add to my card
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
