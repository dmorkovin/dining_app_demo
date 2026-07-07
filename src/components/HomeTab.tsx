import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Calendar, X, Clock, MapPin, Coffee } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { haptic } from '../utils/haptics';
import { supabase } from '../lib/supabase';
import { isStationOpen } from '../lib/stationHours';
import { SUPPRESSED_TAGS } from '../lib/allergens';
import { Capacitor } from '@capacitor/core';
import { WelcomeWeekCard } from './WelcomeWeekCard';
import { PlanRecommendationCard } from './PlanRecommendationCard';
import type { Database } from '../lib/database.types';

const SHOW_WELCOME_CHALLENGE = true;
const SHOW_PLAN_CARD = true;

export const formatEventDateTime = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  };
};

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Station = Database['public']['Tables']['stations']['Row'];

type FeaturedItem = MenuItem;

interface UpcomingEvent {
  id: string;
  name: string;
  event_date: string;
  time: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
}

interface UserBalance {
  name: string | null;
  meals_count: number | null;
  flex_dollars: number | null;
  points: number | null;
}

interface HomeTabProps {
  userId: string;
  onTabChange: (tab: string) => void;
  onStationSelect: (stationId: number) => void;
  onStationRequest: (stationId: number, itemId?: string) => void;
}

function getGreetingKey(name?: string | null): string {
  const hour = new Date().getHours();
  const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  return name ? `home:greeting${period}` : `home:greeting${period}NoName`;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type HoursEntry = { open: string | null; close: string | null; closed: boolean };
type HoursMap = Record<string, HoursEntry> | null;

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return -1;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'AM' && hours === 12) hours = 0;
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  return hours * 60 + minutes;
}

type TimeContextResult =
  | { type: 'closes'; time: string }
  | { type: 'opensTomorrow'; time: string }
  | { type: 'opens'; time: string; day: string }
  | { type: 'none' };

function getStationTimeContextData(hours: HoursMap, isOpen: boolean): TimeContextResult {
  const now = new Date();
  const todayIdx = now.getDay();
  const dayName = DAY_NAMES[todayIdx];
  const entry = hours?.[dayName];

  if (isOpen && entry && entry.close) {
    return { type: 'closes', time: entry.close };
  }

  for (let i = 1; i <= 7; i++) {
    const nextIdx = (todayIdx + i) % 7;
    const nextDayName = DAY_NAMES[nextIdx];
    const nextEntry = hours?.[nextDayName];
    if (nextEntry && !nextEntry.closed && nextEntry.open) {
      if (i === 1) return { type: 'opensTomorrow', time: nextEntry.open };
      return { type: 'opens', time: nextEntry.open, day: DAY_ABBR[nextIdx] };
    }
  }

  return { type: 'none' };
}

function formatEventDate(eventDateStr: string, todayLabel: string): string {
  const parsed = new Date(eventDateStr);
  if (isNaN(parsed.getTime())) return eventDateStr;
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventMidnight = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const diffMs = eventMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return todayLabel;
  if (diffDays > 0 && diffDays < 7) {
    return parsed.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function computeStationStatus(station: Station): { isOpen: boolean; timeContextData: TimeContextResult } {
  const now = new Date();
  const todayIdx = now.getDay();
  const dayName = DAY_NAMES[todayIdx];
  const hours = station.hours as HoursMap;
  const entry = hours?.[dayName];
  let isOpen = false;

  if (entry && !entry.closed && entry.open && entry.close) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const openMin = parseTimeToMinutes(entry.open);
    const closeMin = parseTimeToMinutes(entry.close);
    if (openMin >= 0 && closeMin >= 0 && nowMinutes >= openMin && nowMinutes <= closeMin) {
      isOpen = true;
    }
  }

  const timeContextData = getStationTimeContextData(hours, isOpen);
  return { isOpen, timeContextData };
}

const PULL_THRESHOLD = 80;

export function HomeTab({ userId, onTabChange, onStationSelect, onStationRequest }: HomeTabProps) {
  const { t } = useTranslation(['home', 'common']);
  const [topSellers, setTopSellers] = useState<MenuItem[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [user, setUser] = useState<UserBalance | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [touchStartX, setTouchStartX] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [recentOrderItems, setRecentOrderItems] = useState<any[]>([]);
  const [loadingRecentOrders, setLoadingRecentOrders] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [allEvents, setAllEvents] = useState<UpcomingEvent[]>([]);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [coffeeCount, setCoffeeCount] = useState(0);
  const [activePromos, setActivePromos] = useState<{ id: string; name: string; ends_at: string }[]>([]);
  const [dismissedPromos, setDismissedPromos] = useState<Set<string>>(new Set());
  const [welcomeStationsVisited, setWelcomeStationsVisited] = useState<number[]>([]);
  const [foundingFalconBadge, setFoundingFalconBadge] = useState(false);
  const [challengeStations, setChallengeStations] = useState<{ id: number; name: string; icon: string }[]>([]);
  const [welcomeCardDismissed, setWelcomeCardDismissed] = useState(false);
  const [planCardDismissed, setPlanCardDismissed] = useState(false);
  const [planCardData, setPlanCardData] = useState<{ totalSpend: number; orderCount: number; avgPerOrder: number } | null>(null);
  const [userMealPlanType, setUserMealPlanType] = useState<string | null>(null);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTopSellers();
    fetchStations();
    fetchUser();
    fetchFeaturedItems();
    fetchUpcomingEvents();
    fetchRecentOrders();
    fetchLoyaltyAccount();
    fetchActivePromos();
    fetchPlanCardData();
  }, []);

  useEffect(() => {
    fetchActiveOrder();
    const interval = setInterval(fetchActiveOrder, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchActiveOrder = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        created_at,
        stations (name)
      `)
      .eq('user_id', userId)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setActiveOrder(data);
  };

  const fetchTopSellers = async () => {
    try {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .order('sold_count', { ascending: false })
        .limit(6);
      if (data) setTopSellers(data);
    } catch (err) {
      console.error('top sellers fetch failed:', err);
    }
  };

  const fetchFeaturedItems = async () => {
    try {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('trending', true)
        .order('sold_count', { ascending: false })
        .limit(3);
      if (data) setFeaturedItems(data as FeaturedItem[]);
    } finally {
      setLoadingFeatured(false);
    }
  };

  useEffect(() => {
    if (featuredItems.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => prev === featuredItems.length - 1 ? 0 : prev + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, [featuredItems.length]);

  const fetchUser = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('name, meals_count, flex_dollars, points, meal_plan_type')
        .eq('id', userId)
        .single();
      if (data) {
        setUser(data as UserBalance);
        setUserMealPlanType(data.meal_plan_type ?? null);
      }
    } catch (err) {
      console.error('user fetch failed:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, event_date, time, description, location, image_url')
        .not('event_date', 'is', null)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(2);
      console.log('events fetch:', data, error);
      if (data) setUpcomingEvents(data as UpcomingEvent[]);
    } catch (err) {
      console.error('events fetch failed:', err);
    }
  };

  const fetchAllEvents = async () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { data } = await supabase
      .from('events')
      .select('id, name, event_date, time, description, location, image_url')
      .gte('event_date', now.toISOString())
      .lte('event_date', thirtyDaysFromNow.toISOString())
      .order('event_date', { ascending: true });
    if (data) setAllEvents(data as UpcomingEvent[]);
  };

  const fetchRecentOrders = async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select(`
          id,
          station_id,
          order_items (
            menu_items (
              id,
              name,
              image_url,
              station_id
            )
          ),
          stations (
            id,
            name,
            is_active,
            ordering_available,
            hours
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (!data) return;
      const validItems: any[] = [];
      data.forEach(order => {
        const station = order.stations as any;
        if (!station) return;
        if (!station.is_active) return;
        if (!station.ordering_available) return;
        const { isOpen } = computeStationStatus(station);
        if (!isOpen) return;
        order.order_items?.forEach((oi: any) => {
          const item = oi.menu_items;
          if (!item) return;
          if (validItems.find(v => v.id === item.id)) return;
          validItems.push({
            ...item,
            station_name: station.name,
            station_id: station.id,
          });
        });
      });
      setRecentOrderItems(validItems.slice(0, 5));
    } catch (err) {
      console.error('recent orders fetch failed:', err);
    } finally {
      setLoadingRecentOrders(false);
    }
  };

  const fetchStations = async () => {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      console.log('stations fetch:', data, error);
      if (data) setStations(data);
    } catch (err) {
      console.error('stations fetch failed:', err);
    } finally {
      setLoadingStations(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchStations(), fetchFeaturedItems(), fetchUser(), fetchLoyaltyAccount(), fetchPlanCardData()]);
  };

  const fetchLoyaltyAccount = async () => {
    const { data } = await supabase
      .from('loyalty_accounts')
      .select('balance, coffee_drinks_count, welcome_week_stations_visited, founding_falcon_badge, welcome_week_card_dismissed_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) {
      setLoyaltyBalance(data.balance);
      setCoffeeCount(data.coffee_drinks_count);
      setWelcomeStationsVisited(data.welcome_week_stations_visited ?? []);
      setFoundingFalconBadge(data.founding_falcon_badge ?? false);
      setWelcomeCardDismissed(!!data.welcome_week_card_dismissed_at);
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

      // Check persistent dismissal
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
      } else {
        setPlanCardDismissed(false);
      }
    } catch (err) {
      console.error('Plan card data fetch failed:', err);
    }
  };

  const fetchActivePromos = async () => {
    const { data } = await supabase
      .from('promotions')
      .select('id, name, ends_at')
      .eq('is_active', true)
      .eq('display_on_home', true)
      .lte('starts_at', new Date().toISOString())
      .gte('ends_at', new Date().toISOString());
    if (data) setActivePromos(data);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === 0) return;
    const distance = e.touches[0].clientY - touchStartY.current;
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(distance * 0.5, PULL_THRESHOLD));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      haptic.light();
      setIsRefreshing(true);
      setPullDistance(0);
      touchStartY.current = 0;
      await refreshData();
      setIsRefreshing(false);
    } else {
      setPullDistance(0);
      touchStartY.current = 0;
    }
  };

  const addToCalendar = (event: UpcomingEvent) => {
    const startDate = new Date(event.event_date)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)

    const formatDate = (date: Date) =>
      date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z'

    const googleUrl = new URL('https://calendar.google.com/calendar/render');
    googleUrl.searchParams.set('action', 'TEMPLATE');
    googleUrl.searchParams.set('text', event.name);
    googleUrl.searchParams.set('dates', formatDate(startDate) + '/' + formatDate(endDate));
    googleUrl.searchParams.set('details', event.description || 'Genuine Dining Event');
    if (event.location) googleUrl.searchParams.set('location', event.location);
    if (Capacitor.isNativePlatform()) {
      window.location.href = googleUrl.toString();
    } else {
      window.open(googleUrl.toString(), '_blank');
    }
  }

  const maxSoldCount = topSellers[0]?.sold_count || 1;

  return (
    <>
    <div
      ref={containerRef}
      className="lg:pb-8"
      style={{ position: 'relative', overflowY: 'auto', overscrollBehaviorY: 'contain', height: '100%' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          transform: `translateY(${isRefreshing ? 8 : pullDistance - 40}px)`,
          transition: isRefreshing ? 'none' : pullDistance === 0 ? 'transform 0.2s ease' : 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: '#EE5E29',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(238,94,41,0.35)',
          }}
        >
          {isRefreshing ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: 'spin 0.7s linear infinite' }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: `rotate(${(pullDistance / PULL_THRESHOLD) * 180}deg)`,
                transition: 'transform 0.1s ease',
              }}
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          )}
        </div>
      </div>
      {console.log('rendering stations:', stations)}
      {/* Active Order Banner */}
      {activeOrder && (() => {
        const isReady = activeOrder.status === 'ready';
        const stationName = (activeOrder.stations as any)?.name ?? '';
        const filledDots = { pending: 1, confirmed: 2, preparing: 3, ready: 4 }[activeOrder.status as string] ?? 1;
        const statusLabel = {
          pending: t('home:status.received'),
          confirmed: t('home:status.confirmed'),
          preparing: t('home:status.preparing'),
          ready: t('home:status.ready'),
        }[activeOrder.status as string] ?? activeOrder.status;
        return (
          <button
            onClick={() => setShowOrderModal(true)}
            className={`w-full mx-0 px-5 lg:px-0 mt-4 mb-4 text-left`}
          >
            <div className={`rounded-2xl card-shadow flex items-center gap-3 px-4 py-3 border-l-4 ${isReady ? 'bg-green-50 border-green-500' : 'bg-white border-[var(--color-orange)]'}`}>
              {/* Left: order number + station */}
              <div className="min-w-0 shrink-0">
                <p className={`text-sm font-bold leading-tight ${isReady ? 'text-green-700' : 'text-[var(--color-navy)]'}`}>
                  {activeOrder.order_number}
                </p>
                <p className={`text-xs mt-0.5 truncate max-w-[80px] ${isReady ? 'text-green-600' : 'text-gray-400'}`}>
                  {stationName}
                </p>
              </div>
              {/* Middle: dots + label */}
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className={`flex gap-1.5 ${isReady ? 'animate-pulse' : ''}`}>
                  {[1, 2, 3, 4].map(i => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full ${i <= filledDots ? (isReady ? 'bg-green-500' : 'bg-[var(--color-orange)]') : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-semibold ${isReady ? 'text-green-600' : 'text-[var(--color-orange)]'}`}>
                  {statusLabel}
                </p>
              </div>
              {/* Right: chevron */}
              <ChevronRight size={18} className={isReady ? 'text-green-500' : 'text-gray-400'} />
            </div>
          </button>
        );
      })()}

      {/* Order Detail Modal */}
      {showOrderModal && activeOrder && (() => {
        const isReady = activeOrder.status === 'ready';
        const stationName = (activeOrder.stations as any)?.name ?? '';
        const filledDots = { pending: 1, confirmed: 2, preparing: 3, ready: 4 }[activeOrder.status as string] ?? 1;
        const statusLabel = {
          pending: t('home:status.received'),
          confirmed: t('home:status.confirmed'),
          preparing: t('home:status.preparing'),
          ready: t('home:status.ready'),
        }[activeOrder.status as string] ?? activeOrder.status;
        return (
          <div className="fixed inset-0 z-[90] flex items-end justify-center" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowOrderModal(false)}
            />
            <div className="relative w-full max-w-[430px] bg-[#FFFDF9] rounded-t-[20px] shadow-2xl pb-10 pt-4 px-6 sheet-enter" style={{ marginBottom: 'calc(49px + env(safe-area-inset-bottom))' }}>
              {/* Drag handle */}
              <div className="mx-auto w-10 h-1 rounded-full bg-gray-300 mb-5" />

              {/* Order number */}
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">{t('home:yourOrder')}</p>
              <h2 className="text-3xl font-bold text-[var(--color-navy)] mb-1" style={{ fontFamily: 'Josefin Sans, sans-serif' }}>
                {activeOrder.order_number}
              </h2>
              {stationName ? (
                <p className="text-sm text-gray-500 mb-6">{stationName}</p>
              ) : (
                <div className="mb-6" />
              )}

              {/* Progress dots */}
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4].map(i => (
                  <span
                    key={i}
                    className={`h-2.5 rounded-full transition-all ${i <= filledDots ? (isReady ? 'bg-green-500 w-8' : 'bg-[#EE5E29] w-8') : 'bg-gray-200 w-2.5'}`}
                  />
                ))}
              </div>
              <p className={`text-sm font-semibold mb-8 ${isReady ? 'text-green-600' : 'text-[#EE5E29]'}`}>
                {statusLabel}
              </p>

              {/* Dismiss button */}
              <button
                onClick={() => setShowOrderModal(false)}
                className="w-full h-12 rounded-2xl font-bold text-white text-base active:scale-[0.98] transition-transform"
                style={{ background: '#EE5E29', fontFamily: 'Josefin Sans, sans-serif' }}
              >
                {t('home:ok')}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Greeting */}
      <div className="px-5 lg:px-0 pt-4 mb-4">
        <h2 className="text-2xl font-bold text-[var(--color-navy)]">{t(getGreetingKey(user?.name), { name: user?.name })}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('home:subtitle')}</p>
      </div>

      {/* 3-stat row (Meal Swipes / Dining $ / Points) */}
      {loadingUser ? (
        <div
          className="flex gap-3 overflow-x-auto px-5 lg:px-0 mb-6"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-32 h-16 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 px-5 lg:px-0 mb-6">
          <div
            className="rounded-[12px] p-3 overflow-hidden relative"
            style={{
              backgroundImage: 'url(/arcs.png)',
              backgroundSize: '300%',
              backgroundPosition: 'center center',
            }}
          >
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.18)' }} />
            <div className="relative">
              <p
                className="text-white mb-0.5"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                }}
              >
                {t('home:mealSwipes')}
              </p>
              <p
                className="text-white leading-tight"
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                }}
              >
                {user?.meals_count ?? 0}
              </p>
            </div>
          </div>
          <div
            className="rounded-[12px] p-3 overflow-hidden relative"
            style={{
              backgroundImage: 'url(/assets/yellow.png)',
              backgroundSize: '300%',
              backgroundPosition: 'center center',
            }}
          >
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.18)' }} />
            <div className="relative">
              <p
                className="text-white mb-0.5"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                }}
              >
                {t('home:diningDollars')}
              </p>
              <p
                className="text-white leading-tight"
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                }}
              >
                ${(user?.flex_dollars ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={() => onTabChange('rewards')}
            className="rounded-[12px] p-3 overflow-hidden relative text-left active:scale-[0.97] transition-transform"
            style={{
              backgroundImage: 'url(/assets/oranges.png)',
              backgroundSize: '300%',
              backgroundPosition: 'center center',
            }}
          >
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.18)' }} />
            <div className="relative">
              <p
                className="text-white mb-0.5"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                }}
              >
                {t('home:points')}
              </p>
              <p
                className="text-white leading-tight"
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                }}
              >
                {loyaltyBalance.toLocaleString()}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Coffee milestone strip */}
      <div className="px-5 lg:px-0 mb-5">
        <button
          onClick={() => onTabChange('rewards')}
          className="w-full bg-white rounded-[12px] px-4 py-3 card-shadow flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">☕</span>
            <span className="text-sm font-bold text-[var(--color-navy)]">{coffeeCount}/10</span>
            <span className="text-xs text-gray-500">{t('home:drinksAtPerch')}</span>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <Coffee
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < coffeeCount
                    ? 'text-[var(--color-orange)] fill-[var(--color-orange)]'
                    : 'text-gray-200'
                }`}
                strokeWidth={i < coffeeCount ? 2 : 1.5}
              />
            ))}
          </div>
        </button>
        {coffeeCount < 10 && (
          <p className="text-xs text-gray-400 mt-1 ml-1">{t('home:moreForFreeDrink', { count: 10 - coffeeCount })}</p>
        )}

        {/* Active promotion banner */}
        {activePromos
          .filter(p => !dismissedPromos.has(p.id))
          .map(promo => {
            const endsDate = new Date(promo.ends_at);
            const endDay = endsDate.toLocaleDateString('en-US', { weekday: 'short' });
            return (
              <div
                key={promo.id}
                className="mt-2 bg-amber-50 border border-amber-200 rounded-[12px] px-4 py-2.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => console.log('Promo tapped:', promo.id)}
              >
                <span className="text-base">🎁</span>
                <p className="flex-1 text-sm text-amber-900 font-medium">
                  {promo.name} — <span className="text-amber-700">{t('home:ends')} {endDay}</span>
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDismissedPromos(prev => new Set([...prev, promo.id]));
                  }}
                  className="text-amber-400 hover:text-amber-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
      </div>

      {/* Falcon Founder Welcome Week Challenge */}
      {SHOW_WELCOME_CHALLENGE && !welcomeCardDismissed && (
        <div className="px-5 lg:px-0 mb-5">
          <WelcomeWeekCard
            foundingFalconBadge={foundingFalconBadge}
            welcomeStationsVisited={welcomeStationsVisited}
            challengeStations={challengeStations}
            showDismiss
            onDismiss={() => {
              setWelcomeCardDismissed(true);
              supabase.from('loyalty_accounts').update({ welcome_week_card_dismissed_at: new Date().toISOString() }).eq('user_id', userId).then(() => {});
            }}
          />
        </div>
      )}

      {/* Meal Plan Recommendation Card */}
      {(() => {
        const hasNoPlan = !userMealPlanType || userMealPlanType === 'none' || userMealPlanType === '';
        const orderThreshold = SHOW_WELCOME_CHALLENGE ? 3 : 8;
        const meetsThreshold = planCardData && (planCardData.orderCount >= orderThreshold || planCardData.totalSpend >= 50);
        const showCard = SHOW_PLAN_CARD || (hasNoPlan && meetsThreshold && !planCardDismissed);

        if (!showCard || !planCardData || planCardDismissed) return null;

        return (
          <div className="px-5 lg:px-0 mb-5">
            <PlanRecommendationCard
              userId={userId}
              planCardData={planCardData}
              dismissed={planCardDismissed}
              onDismiss={() => setPlanCardDismissed(true)}
            />
          </div>
        );
      })()}

      {/* Order Again */}
      {!loadingRecentOrders && recentOrderItems.length > 0 && (
        <div className="px-5 lg:px-0 mb-6">
          <h3 className="text-xl font-bold text-[var(--color-navy)]">{t('home:orderAgain')}</h3>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">{t('home:orderAgainSubtitle')}</p>
          <div
            className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {recentOrderItems.map((item) => (
              <div key={item.id} className="flex-shrink-0 w-40 bg-white rounded-2xl card-shadow overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" onClick={() => { onStationRequest(item.station_id, item.id); }}>
                <img
                  src={item.image_url ?? ''}
                  alt={item.name}
                  className="w-full h-[100px] object-cover rounded-xl"
                />
                <div className="p-2">
                  <p className="text-sm font-bold text-[var(--color-navy)] truncate">{item.name}</p>
                  <p className="text-xs text-[var(--color-orange)] mt-0.5 truncate">{item.station_name}</p>
                  <button
                    onClick={() => { onStationRequest(item.station_id, item.id); }}
                    className="w-full mt-2 bg-[var(--color-orange)] text-white text-xs font-semibold py-1.5 rounded-full hover:bg-orange-600 active:scale-95 transition-all"
                  >
                    {t('common:order')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What's Open Now */}
      <div className="px-5 lg:px-0 mb-8">
        <h3 className="text-xl font-bold text-[var(--color-navy)] mb-3">{t('home:whatsOpenNow')}</h3>
        {loadingStations ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[14px] p-4 card-shadow flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[...stations]
              .map((station) => ({ station, ...computeStationStatus(station) }))
              .sort((a, b) => {
                if (a.isOpen === b.isOpen) return 0;
                return a.isOpen ? -1 : 1;
              })
              .map(({ station, isOpen, timeContextData }) => {
                const timeContextStr = timeContextData.type === 'closes'
                  ? t('home:closes', { time: timeContextData.time })
                  : timeContextData.type === 'opensTomorrow'
                  ? t('home:opensTomorrow', { time: timeContextData.time })
                  : timeContextData.type === 'opens'
                  ? t('home:opens', { time: timeContextData.time, day: timeContextData.day })
                  : t('home:noUpcomingHours');
                const isBuffet = station.name === 'Falcon Cafe';
                const inner = (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {station.logo_url ? (
                        <img
                          src={station.logo_url}
                          alt={station.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            img.style.display = 'none';
                            const fallback = img.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span
                        className="text-xl"
                        style={{ display: station.logo_url ? 'none' : 'block' }}
                      >
                        {station.icon ?? '🍽️'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--color-navy)] text-sm leading-tight truncate">
                        {station.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isOpen ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            isOpen ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {isOpen ? t('common:open') : t('common:closed')}
                        </span>
                        <span className="text-gray-300 text-xs">·</span>
                        <span className="text-xs text-gray-400 truncate">{timeContextStr}</span>
                      </div>
                    </div>

                    {isBuffet ? (
                      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-orange-50 text-[var(--color-orange,#FF6B35)] border border-orange-100">
                        {t('home:buffet')}
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                  </>
                );
                return isBuffet ? (
                  <div
                    key={station.id}
                    className="w-full bg-white rounded-[14px] card-shadow px-4 py-3 flex items-center gap-3 text-left"
                  >
                    {inner}
                  </div>
                ) : (
                  <button
                    key={station.id}
                    onClick={() => {
                      onStationSelect(station.id);
                      onTabChange('order');
                    }}
                    className="w-full bg-white rounded-[14px] card-shadow px-4 py-3 flex items-center gap-3 text-left hover:shadow-md transition-shadow active:scale-[0.99] transition-transform cursor-pointer"
                  >
                    {inner}
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* Today's Special */}
      <div className="px-5 lg:px-0 mb-8">
        <h3 className="text-xl font-bold text-[var(--color-navy)] mb-3">{t('home:todaysSpecial')}</h3>
        {loadingFeatured ? (
          <div className="w-full h-[200px] rounded-[18px] bg-gray-200 animate-pulse" />
        ) : featuredItems.length > 0 ? (
          <>
            <div
              className="relative w-full overflow-hidden rounded-[18px] card-shadow"
              onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
              onTouchEnd={e => {
                const delta = e.changedTouches[0].clientX - touchStartX;
                if (delta > 50) setActiveSlide(prev => Math.max(0, prev - 1));
                else if (delta < -50) setActiveSlide(prev => Math.min(featuredItems.length - 1, prev + 1));
              }}
            >
              <div
                className="flex transition-transform duration-300"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {featuredItems.map(item => (
                  <div key={item.id} className="relative w-full flex-shrink-0 h-[200px] cursor-pointer active:scale-[0.98] transition-transform" onClick={() => { if (item.station_id) onStationRequest(item.station_id, item.id); }}>
                    <img
                      src={item.image_url ?? ''}
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-white text-xl font-bold leading-tight truncate">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            {item.calories && (
                              <span className="bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                                {item.calories} cal
                              </span>
                            )}
                            {item.price != null && (
                              <span className="bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                                ${Number(item.price).toFixed(2)}
                              </span>
                            )}
                            {Array.isArray(item.tags) && (item.tags as string[]).filter(t => !SUPPRESSED_TAGS.includes(t)).length > 0 && (
                              <span className="bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize">
                                {(item.tags as string[]).filter(t => !SUPPRESSED_TAGS.includes(t))[0]}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (item.station_id) onStationRequest(item.station_id, item.id);
                          }}
                          className="flex-shrink-0 bg-[var(--color-orange)] hover:bg-orange-600 active:scale-95 transition-all text-white text-sm font-bold px-4 py-2 rounded-full whitespace-nowrap shadow-lg"
                        >
                          {t('home:orderNow')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {featuredItems.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {featuredItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === activeSlide ? 'bg-[var(--color-orange)]' : 'bg-gray-200'}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Coming Up */}
      {upcomingEvents.length > 0 && (
        <div className="px-5 lg:px-0 mb-8">
          <h3 className="text-xl font-bold text-[var(--color-navy)] mb-3">{t('home:comingUp')}</h3>
          <div className="space-y-2">
            {upcomingEvents.map((event, index) => (
              <div
                key={index}
                onClick={() => setSelectedEvent(event)}
                className="bg-white rounded-[14px] card-shadow px-4 py-3 flex items-center gap-3 cursor-pointer"
              >
                <span className="text-xl flex-shrink-0">📅</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--color-navy)] text-sm leading-tight truncate">
                    {event.name}
                  </p>
                  {event.location && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{event.location}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-semibold text-gray-600">{formatEventDate(event.event_date, t('home:today'))}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatEventDateTime(event.event_date).time}</p>
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                if (!showAllEvents) fetchAllEvents();
                setShowAllEvents(prev => !prev);
              }}
              className="w-full mt-2 py-2 text-sm font-semibold text-[var(--color-orange)] hover:underline"
            >
              {showAllEvents ? `${t('home:showLess')} ↑` : `${t('home:viewAllEvents')} →`}
            </button>
            {showAllEvents && (
              <div className="mt-2 space-y-2">
                {allEvents.map((event, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedEvent(event)}
                    className="bg-white rounded-[14px] card-shadow px-4 py-3 flex items-center gap-3 cursor-pointer"
                  >
                    <span className="text-xl flex-shrink-0">📅</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--color-navy)] text-sm leading-tight truncate">
                        {event.name}
                      </p>
                      {event.location && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{event.location}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs font-semibold text-gray-600">{formatEventDate(event.event_date, t('home:today'))}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatEventDateTime(event.event_date).time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popular Today */}
      <div className="px-5 lg:px-0 pr-4 mb-8 lg:max-w-md lg:mx-auto">
        <h3 className="text-xl font-bold text-[var(--color-navy)] mb-4">{t('home:popularToday')}</h3>
        {topSellers.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[14px] p-4 card-shadow flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 rounded-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3">
            {topSellers.slice(0, 6).map((item, index) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.station_id) onStationRequest(item.station_id, item.id);
                }}
                className="bg-white rounded-[14px] p-4 card-shadow w-full cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-white flex-shrink-0 ${
                      index === 0
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                        : index === 1
                        ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                        : index === 2
                        ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                        : 'bg-gradient-to-br from-[var(--color-teal)] to-teal-700'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[var(--color-navy)] truncate">{item.name}</h4>
                    {item.price != null && (
                      <p className="text-xs text-gray-500 mt-0.5">${Number(item.price).toFixed(2)}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.station_id) onStationRequest(item.station_id, item.id);
                    }}
                    className="flex-shrink-0 self-center text-xs font-semibold text-[var(--color-orange)] border border-[var(--color-orange)] px-3 py-1 rounded-full whitespace-nowrap ml-auto hover:bg-orange-50 transition-colors"
                  >
                    {t('common:order')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-[14px] w-full max-w-md card-shadow-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedEvent.image_url && (
                <img
                  src={selectedEvent.image_url}
                  alt={selectedEvent.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-[var(--color-navy)] flex-1 pr-4">
                    {selectedEvent.name}
                  </h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-[var(--color-orange)]" />
                    {new Date(selectedEvent.event_date).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-[var(--color-orange)]" />
                    {formatEventDateTime(selectedEvent.event_date).time}
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-[var(--color-orange)]" />
                      {selectedEvent.location}
                    </div>
                  )}
                </div>

                {selectedEvent.description && (
                  <p className="text-sm text-gray-600 mb-6">{selectedEvent.description}</p>
                )}

                <button
                  onClick={() => { addToCalendar(selectedEvent); setSelectedEvent(null); }}
                  className="w-full py-3 bg-[var(--color-orange)] text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  {t('home:addToCalendar')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>

    </>
  );
}


