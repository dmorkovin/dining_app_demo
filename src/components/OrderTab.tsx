import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { haptic } from '../utils/haptics';
import { OrderFeedbackModal } from './OrderFeedbackModal';
import {
  Plus,
  Minus,
  ShoppingBag,
  Utensils,
  X,
  Check,
  Loader2,
  Store,
  MapPin,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ensureLoyaltyAccount } from '../lib/ensureLoyaltyAccount';
import { isStationOpen } from '../lib/stationHours';
import { normalizeAllergen, formatAllergenDisplay, SUPPRESSED_TAGS } from '../lib/allergens';
import type { Database } from '../lib/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  station_id?: number | null;
};
type Station = Database['public']['Tables']['stations']['Row'];

export type CartItem = {
  menuItem: MenuItem;
  quantity: number;
};

interface OrderTabProps {
  userId: string;
  onTabChange: (tab: string) => void;
  initialStationId?: number | null;
  initialItemId?: string | null;
  onItemDetailOpened?: () => void;
  onStationSelect?: (id: number | null) => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onCartChange?: (cart: {menuItem: any, quantity: number}[]) => void;
  externalCartOpen?: boolean;
  onCartOpenChange?: (open: boolean) => void;
}

const TAG_COLORS: Record<string, string> = {
  V: 'bg-green-100 text-green-700',
  VG: 'bg-emerald-100 text-emerald-700',
};

export function OrderTab({ userId, onTabChange, initialStationId, initialItemId, onItemDetailOpened, cart, setCart, onCartChange, externalCartOpen, onCartOpenChange }: OrderTabProps) {
  const { t } = useTranslation('order');
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [navDirection, setNavDirection] = useState<'forward' | 'back'>('forward');

  useEffect(() => {
    if (initialStationId) {
      setSelectedStation(initialStationId);
    }
  }, [initialStationId]);

  useEffect(() => {
    if (onCartChange) {
      onCartChange(cart);
    }
  }, [cart]);
  const [stations, setStations] = useState<Station[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loadingMenuItems, setLoadingMenuItems] = useState(true);
  const [showChangeConfirm, setShowChangeConfirm] = useState(false);
  const [pendingStationSwitch, setPendingStationSwitch] = useState<number | null>(null);

  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [confirmedStationName, setConfirmedStationName] = useState('');
  const [confirmedItems, setConfirmedItems] = useState<CartItem[]>([]);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [, setNowTick] = useState(0);
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [hideAllergenItems, setHideAllergenItems] = useState(false);
  const [openAllergenTooltipId, setOpenAllergenTooltipId] = useState<string | null>(null);
  const [cartExpired, setCartExpired] = useState(false);
  const [cartTimestamp, setCartTimestamp] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isItemDetailOpen, setIsItemDetailOpen] = useState(false);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [earnResult, setEarnResult] = useState<{
    pointsEarned: number;
    newBalance: number;
    multiplier: number;
    isFirstOrder: boolean;
  } | null>(null);
  const [earnError, setEarnError] = useState(false);
  const [coffeeResult, setCoffeeResult] = useState<{
    freeDrinkEarned: boolean;
    coffeeCount: number;
  } | null>(null);
  const [falconResult, setFalconResult] = useState<{
    badgeAwarded: boolean;
  } | null>(null);

  useEffect(() => {
    if (!initialItemId) { return; }
    if (!selectedStation) { return; }
    if (!menuItems || menuItems.length === 0) { return; }

    const item = menuItems.find(i => i.id === initialItemId);
    if (item) {
      setSelectedItem(item);
      setDetailQuantity(1);
      setIsItemDetailOpen(true);
      document.body.style.overflow = 'hidden';
      onItemDetailOpened?.();
    } else {
      onItemDetailOpened?.();
    }
  }, [initialItemId, selectedStation, menuItems]);

  useEffect(() => {
    if (externalCartOpen) {
      setIsCartOpen(true);
      if (onCartOpenChange) onCartOpenChange(false);
    }
  }, [externalCartOpen]);

  useEffect(() => {
    if (openAllergenTooltipId === null) return;
    const timer = setTimeout(() => setOpenAllergenTooltipId(null), 2500);
    return () => clearTimeout(timer);
  }, [openAllergenTooltipId]);

  useEffect(() => {
    const interval = setInterval(() => setNowTick((n) => n + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (cart.length === 0) return;
      if (!selectedStation) return;

      const station = stations.find((s) => s.id === selectedStation);
      if (!station) return;

      const available = isOrderingAvailable(station);

      if (!available) {
        setCartExpired(true);
      }

      if (cartTimestamp) {
        const hoursSinceAdded = (Date.now() - cartTimestamp) / (1000 * 60 * 60);
        if (hoursSinceAdded > 12) {
          setCart([]);
          setCartTimestamp(null);
          setSelectedStation(null);
          setCartExpired(false);
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [cart, selectedStation, stations, cartTimestamp]);

  useEffect(() => {
    if (cart.length === 0) return;
    if (!selectedStation) return;
    const station = stations.find((s) => s.id === selectedStation);
    if (!station) return;
    if (!isOrderingAvailable(station)) {
      setCartExpired(true);
    }
  }, []);

  const isBuffetStation = (station: Station): boolean => {
    return (station as unknown as { ordering_available?: boolean }).ordering_available === false;
  };

  const isOrderingAvailable = (station: Station): boolean => {
    const anyStation = station as unknown as {
      ordering_available?: boolean;
      hours?: Record<string, { closed?: boolean; close?: string }>;
    };
    if (anyStation.ordering_available === false) return false;
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[now.getDay()];
    const todayHours = anyStation.hours?.[dayName];
    if (!todayHours || todayHours.closed) return false;
    if (!todayHours.close) return false;
    const closeMatch = todayHours.close.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!closeMatch) return false;
    let closeHour = parseInt(closeMatch[1]);
    const closeMin = parseInt(closeMatch[2]);
    const meridiem = closeMatch[3].toUpperCase();
    if (meridiem === 'PM' && closeHour !== 12) closeHour += 12;
    if (meridiem === 'AM' && closeHour === 12) closeHour = 0;
    const closeMinutes = closeHour * 60 + closeMin;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const cutoffMinutes = closeMinutes - 30;
    return nowMinutes < cutoffMinutes;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoadingMenuItems(true);

      const stationsResult = await supabase
        .from('stations')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (stationsResult.data) {
        setStations(stationsResult.data as Station[]);
      }

      const menuResult = await supabase
        .from('menu_items')
        .select('*')
        .order('sold_count', { ascending: false });

      if (menuResult.data) {
        setMenuItems(menuResult.data as MenuItem[]);
      }

      const userResult = await supabase
        .from('users')
        .select('dietary_alerts, hide_allergen_items')
        .eq('id', userId)
        .maybeSingle();

      const userData = userResult.data as {
        dietary_alerts?: string[];
        hide_allergen_items?: boolean;
      } | null;
      const alerts = userData?.dietary_alerts;
      if (Array.isArray(alerts) && alerts.length > 0) {
        setUserAllergens(alerts);
      }
      setHideAllergenItems(userData?.hide_allergen_items || false);

      setLoadingMenuItems(false);
    };

    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedStation === null) return [];
    let items = menuItems.filter((item) => item.station_id === selectedStation);

    if (hideAllergenItems && userAllergens.length > 0) {
      const normalizedUserAllergens = userAllergens.map((u) => normalizeAllergen(u).toLowerCase());
      items = items.filter((item) => {
        const itemAllergens = (item as unknown as { allergens?: string[] | null }).allergens;
        if (!Array.isArray(itemAllergens)) return true;
        return !itemAllergens.some((a) => normalizedUserAllergens.includes(normalizeAllergen(a).toLowerCase()));
      });
    }

    return items;
  }, [menuItems, selectedStation, hideAllergenItems, userAllergens]);

  const getMatchingAllergens = (item: MenuItem): string[] => {
    const itemAllergens = (item as unknown as { allergens?: string[] | null }).allergens;
    if (!Array.isArray(itemAllergens) || userAllergens.length === 0) return [];
    const normalizedUserAllergens = userAllergens.map((u) => normalizeAllergen(u).toLowerCase());
    return itemAllergens.filter((a) => normalizedUserAllergens.includes(normalizeAllergen(a).toLowerCase()));
  };

  const totalCartCount = useMemo(
    () => cart.reduce((sum, c) => sum + c.quantity, 0),
    [cart]
  );

  const selectedStationData = useMemo(
    () => stations.find((s) => s.id === selectedStation) || null,
    [stations, selectedStation]
  );

  const isBuffetSelected = selectedStationData ? isBuffetStation(selectedStationData) : false;
  const canOrder = selectedStationData ? isOrderingAvailable(selectedStationData) : true;
  const isWithinCutoffWindow = !!(
    selectedStationData &&
    !isBuffetSelected &&
    isStationOpen(selectedStationData.hours).isOpen &&
    !canOrder
  );

  useEffect(() => {
    if (isBuffetSelected && cart.length > 0) {
      setCart([]);
    }
  }, [isBuffetSelected]);

  const getCartQuantity = (itemId: string): number => {
    const entry = cart.find((c) => c.menuItem.id === itemId);
    return entry ? entry.quantity : 0;
  };

  const updateCartQuantity = (menuItem: MenuItem, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === menuItem.id);
      if (!existing) {
        if (delta <= 0) return prev;
        if (prev.length === 0) {
          setCartTimestamp(Date.now());
        }
        return [...prev, { menuItem, quantity: delta }];
      }
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const next = prev.filter((c) => c.menuItem.id !== menuItem.id);
        if (next.length === 0) {
          setCartTimestamp(null);
        }
        return next;
      }
      return prev.map((c) =>
        c.menuItem.id === menuItem.id ? { ...c, quantity: newQty } : c
      );
    });
  };

  const addToCart = (item: MenuItem) => updateCartQuantity(item, 1);
  const decrementCart = (item: MenuItem) => updateCartQuantity(item, -1);

  const handleTabSwitch = (stationId: number) => {
    if (stationId === selectedStation) return;
    if (cart.length === 0) {
      setNavDirection('forward');
      setSelectedStation(stationId);
      return;
    }
    setPendingStationSwitch(stationId);
    setShowChangeConfirm(true);
  };

  const confirmChangeStation = () => {
    haptic.medium();
    setCart([]);
    setCartTimestamp(null);
    setNavDirection('forward');
    setSelectedStation(pendingStationSwitch);
    setPendingStationSwitch(null);
    setShowChangeConfirm(false);
  };

  const placeOrder = async () => {
    haptic.medium();
    if (!selectedStation || cart.length === 0 || isPlacingOrder) return;
    if (!canOrder) return;
    setIsPlacingOrder(true);
    const station = stations.find((s) => s.id === selectedStation);
    if (!station || !isOrderingAvailable(station)) {
      setCartExpired(true);
      setIsPlacingOrder(false);
      return;
    }
    try {
      const orderNumber =
        'GD-' +
        Math.floor(Math.random() * 999 + 1)
          .toString()
          .padStart(3, '0');

      const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          station_id: selectedStation,
          order_number: orderNumber,
          status: 'pending',
          total_items: totalItems,
        })
        .select()
        .maybeSingle();

      if (orderError || !orderData) {
        throw orderError || new Error('Failed to create order');
      }

      const newOrderId = (orderData as { id: string | number }).id;

      const { error: itemsError } = await supabase.from('order_items').insert(
        cart.map((item) => ({
          order_id: newOrderId,
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
        }))
      );

      if (itemsError) {
        throw itemsError;
      }

      // Loyalty points earn (non-blocking)
      try {
        await ensureLoyaltyAccount(userId);
        const cartTotal = totalItems * 8.5;
        const { count: existingEarnCount } = await supabase
          .from('loyalty_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('transaction_type', 'earn_order');
        const isFirstOrder = (existingEarnCount ?? 0) === 0;

        const { data: earnData, error: earnErr } = await supabase.rpc('earn_points', {
          p_user_id: userId,
          p_order_id: newOrderId,
          p_amount: cartTotal,
          p_payment_method: 'card',
          p_station_id: selectedStation,
          p_promo_id: null,
        });

        if (earnErr) throw earnErr;
        const result = earnData as { status: string; points_earned?: number; new_balance?: number; multiplier?: number };

        if (result.status === 'ok') {
          let finalBalance = result.new_balance ?? 0;
          let firstOrderAwarded = false;

          if (isFirstOrder) {
            const { data: bonusData } = await supabase.rpc('award_bonus', {
              p_user_id: userId,
              p_points: 50,
              p_source_rule: 'first_order',
              p_reason: 'First order bonus',
            });
            const bonusResult = bonusData as { status: string; new_balance?: number } | null;
            if (bonusResult?.status === 'ok') {
              finalBalance = bonusResult.new_balance ?? finalBalance;
              firstOrderAwarded = true;
            }
          }

          setEarnResult({
            pointsEarned: result.points_earned ?? 0,
            newBalance: finalBalance,
            multiplier: result.multiplier ?? 1,
            isFirstOrder: firstOrderAwarded,
          });
        }
      } catch (loyaltyErr) {
        console.error('Loyalty points earn failed:', loyaltyErr);
        setEarnError(true);
      }

      // Coffee milestone tracking (The Perch orders)
      try {
        const stationName = selectedStationData?.name || '';
        if (stationName.toLowerCase().includes('perch')) {
          const totalDrinks = cart.reduce((sum, i) => sum + i.quantity, 0);
          const { data: coffeeData, error: coffeeErr } = await supabase.rpc('increment_coffee_counter', {
            p_user_id: userId,
            p_drinks: totalDrinks,
          });
          if (coffeeErr) throw coffeeErr;
          const coffeeRes = coffeeData as { status: string; coffee_count?: number; coffee_lifetime?: number; free_drink_earned?: boolean } | null;
          if (coffeeRes?.status === 'ok' && coffeeRes.free_drink_earned) {
            setCoffeeResult({ freeDrinkEarned: true, coffeeCount: coffeeRes.coffee_count ?? 0 });
          }
        }
      } catch (coffeeErr) {
        console.error('Coffee milestone tracking failed:', coffeeErr);
      }

      // Welcome Week station tracking
      try {
        const SHOW_WELCOME_CHALLENGE = true;
        if (SHOW_WELCOME_CHALLENGE && selectedStation) {
          const { data: loyaltyRow } = await supabase
            .from('loyalty_accounts')
            .select('welcome_week_stations_visited, founding_falcon_badge')
            .eq('user_id', userId)
            .maybeSingle();

          const visited: number[] = loyaltyRow?.welcome_week_stations_visited ?? [];
          const alreadyHasBadge = loyaltyRow?.founding_falcon_badge ?? false;

          if (!visited.includes(selectedStation)) {
            const newVisited = [...visited, selectedStation];
            await supabase
              .from('loyalty_accounts')
              .update({ welcome_week_stations_visited: newVisited })
              .eq('user_id', userId);

            if (newVisited.length >= 4 && !alreadyHasBadge) {
              const { data: badgeData } = await supabase.rpc('award_bonus', {
                p_user_id: userId,
                p_points: 500,
                p_source_rule: 'welcome_week_challenge',
                p_reason: 'Falcon Founder challenge completed',
              });
              const badgeRes = badgeData as { status: string; new_balance?: number } | null;
              if (badgeRes?.status === 'ok') {
                await supabase
                  .from('loyalty_accounts')
                  .update({ founding_falcon_badge: true })
                  .eq('user_id', userId);
                setFalconResult({ badgeAwarded: true });
              }
            }
          }
        }
      } catch (welcomeErr) {
        console.error('Welcome Week station tracking failed:', welcomeErr);
      }

      setConfirmedStationName(selectedStationData?.name || '');
      setConfirmedItems(cart);
      setConfirmedOrderNumber(orderNumber);
      setConfirmedOrderId(String(newOrderId));
      haptic.success();
      setOrderConfirmed(true);
      setCart([]);
      setCartTimestamp(null);
      setIsCartOpen(false);
    } catch (err) {
      console.error('Failed to place order', err);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const resetConfirmation = () => {
    setOrderConfirmed(false);
    setConfirmedOrderNumber('');
    setConfirmedStationName('');
    setConfirmedItems([]);
    setConfirmedOrderId('');
    setShowFeedback(false);
    setEarnResult(null);
    setEarnError(false);
    setCoffeeResult(null);
    setFalconResult(null);
  };

  const renderStationPills = () => (
    <div className="flex gap-2 overflow-x-auto pb-3 -mx-5 px-5 scrollbar-hide justify-center flex-wrap">
      {stations.map((station) => {
        const open = isStationOpen(station.hours).isOpen;
        const active = selectedStation === station.id;
        const isBuffet = isBuffetStation(station);
        return (
          <button
            key={station.id}
            onClick={() => { setNavDirection('forward'); setSelectedStation(station.id); }}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border ${
              active
                ? 'bg-[var(--color-orange,#FF6B35)] text-white border-[var(--color-orange,#FF6B35)] shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {isBuffet ? (
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {t('buffet')}
              </span>
            ) : (
              <span
                className={`w-2 h-2 rounded-full ${
                  open ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            )}
            <span>{station.name}</span>
            {!isBuffet && !open && (
              <span className="text-xs text-red-500">· {t('closed')}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ position: 'relative', overflowY: 'auto', overscrollBehavior: 'contain', height: '100%' }}>
      {selectedStation === null ? (
        <div key="station-list">
          <div className="px-5 pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-5">
                <Store
                  className="w-10 h-10 text-[var(--color-orange,#FF6B35)]"
                  strokeWidth={1.8}
                />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('whereOrdering')}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {t('selectStation')}
              </p>
            </div>
            <div className="mt-8 px-5">{renderStationPills()}</div>
          </div>
        </div>
      ) : (
        <div key={`menu-${selectedStation}`} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px - env(safe-area-inset-top) - 60px - env(safe-area-inset-bottom))', overflow: 'hidden' }}>
          <>
            <div className="px-5 pb-3" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', paddingBottom: '8px', marginTop: '8px', marginBottom: '8px' }}>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {stations.map((station) => {
                  const active = selectedStation === station.id;
                  return (
                    <button
                      key={station.id}
                      ref={(el) => { if (active && el) el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' }); }}
                      onClick={() => handleTabSwitch(station.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border ${
                        active
                          ? 'bg-[var(--color-orange,#FF6B35)] text-white border-[var(--color-orange,#FF6B35)] shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {station.name}
                    </button>
                  );
                })}
              </div>
              {isBuffetSelected && (
                <div className="mt-3 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Utensils className="w-5 h-5 text-blue-600" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-blue-900">{t('buffetStation')}</p>
                    <p className="text-xs text-blue-800 leading-snug mt-0.5">
                      {t('buffetDescription')}
                    </p>
                  </div>
                </div>
              )}
              {isWithinCutoffWindow && (
                <div className="mt-3 flex items-start gap-3 bg-yellow-50 border border-yellow-300 rounded-2xl px-4 py-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" strokeWidth={2.2} />
                  <p className="text-sm text-yellow-900 leading-snug">
                    <span className="font-semibold">{t('kitchenClosing')}</span>{' '}
                    {t('kitchenClosingDescription')}
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 pt-2" style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
              {loadingMenuItems ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-100"
                    >
                      <div className="aspect-square bg-gray-200 animate-pulse" />
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                        <div className="flex justify-between items-center pt-1">
                          <div className="h-5 w-10 bg-gray-200 rounded-full animate-pulse" />
                          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Utensils className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">
                    {t('noItems')}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {t('noItemsDescription')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4" style={{ pointerEvents: isItemDetailOpen ? 'none' : undefined }}>
                  {filteredItems.map((item) => {
                    const quantity = getCartQuantity(item.id);
                    const firstTag =
                      item.tags && item.tags.length > 0
                        ? item.tags.find((t: string) => !SUPPRESSED_TAGS.includes(t)) || null
                        : null;
                    const tagClass = firstTag
                      ? TAG_COLORS[firstTag] || 'bg-gray-100 text-gray-600'
                      : '';
                    const matchingAllergens = getMatchingAllergens(item);
                    const showAllergenBadge = matchingAllergens.length > 0;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedItem(item);
                          setDetailQuantity(1);
                          setIsItemDetailOpen(true);
                          document.body.style.overflow = 'hidden';
                          document.body.style.touchAction = 'none';
                        }}
                        className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all flex flex-col cursor-pointer"
                      >
                        <div className="relative aspect-square bg-gray-100 overflow-hidden">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <Utensils className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                          {showAllergenBadge && (
                            <div className="absolute top-2 right-2 z-10">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenAllergenTooltipId(
                                    openAllergenTooltipId === item.id ? null : item.id
                                  );
                                }}
                                aria-label={`Contains ${matchingAllergens.map(a => normalizeAllergen(a)).join(', ')}`}
                                className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md ring-2 ring-white active:scale-95 transition-transform"
                              >
                                <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />
                              </button>
                              {openAllergenTooltipId === item.id && (
                                <div className="absolute right-0 top-full mt-1.5 z-20 w-44 rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg leading-snug">
                                  {matchingAllergens.map(a => formatAllergenDisplay(a)).join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="p-3 flex flex-col flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.calories} cal{item.price != null ? ` · $${Number(item.price).toFixed(2)}` : ''}
                          </p>
                          <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                            {firstTag ? (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagClass}`}
                              >
                                {firstTag}
                              </span>
                            ) : (
                              <span />
                            )}

                            {isBuffetSelected ? (
                              <span />
                            ) : quantity === 0 ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(item);
                                }}
                                aria-label={`Add ${item.name} to cart`}
                                className="w-9 h-9 rounded-full bg-[var(--color-orange,#FF6B35)] text-white flex items-center justify-center shadow-sm hover:shadow-md active:scale-95 transition-all"
                              >
                                <Plus className="w-5 h-5" strokeWidth={2.5} />
                              </button>
                            ) : (
                              <div
                                className="flex items-center gap-1.5 bg-[var(--color-orange,#FF6B35)] rounded-full px-1.5 py-1 text-white"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    decrementCart(item);
                                  }}
                                  aria-label={`Remove one ${item.name}`}
                                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
                                >
                                  <Minus className="w-4 h-4" strokeWidth={2.5} />
                                </button>
                                <span className="text-xs font-bold min-w-[14px] text-center">
                                  {quantity}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item);
                                  }}
                                  aria-label={`Add one ${item.name}`}
                                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
                                >
                                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        </div>
      )}

      {showChangeConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-5"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
            onClick={() => { setShowChangeConfirm(false); setPendingStationSwitch(null); }}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-scaleIn">
            <h3 className="text-lg font-bold text-gray-900">{t('changeStation')}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {t('changeStationMessage')}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setShowChangeConfirm(false); setPendingStationSwitch(null); }}
                className="flex-1 h-11 rounded-xl font-semibold text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 active:scale-[0.98] transition-all"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmChangeStation}
                className="flex-1 h-11 rounded-xl font-semibold text-sm bg-[var(--color-orange,#FF6B35)] text-white hover:brightness-110 active:scale-[0.98] transition-all"
              >
                {t('continue')}
              </button>
            </div>
          </div>
        </div>
      )}

      {cartExpired && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center px-5"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-scaleIn text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <Clock className="w-7 h-7 text-[var(--color-orange,#FF6B35)]" strokeWidth={2.2} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{t('orderExpired')}</h3>
            <p className="mt-2 text-sm text-gray-600 leading-snug">
              {t('orderExpiredMessage')}
            </p>
            <button
              onClick={() => {
                setCart([]);
                setCartExpired(false);
                setCartTimestamp(null);
                setNavDirection('back');
                setSelectedStation(null);
              }}
              className="mt-5 w-full h-11 rounded-xl font-semibold text-sm bg-[var(--color-orange,#FF6B35)] text-white hover:brightness-110 active:scale-[0.98] transition-all"
            >
              {t('ok')}
            </button>
          </div>
        </div>
      )}

      {isItemDetailOpen && selectedItem && (() => {
        const item = selectedItem;
        const itemStation = stations.find(
          (s) => s.id === (item.station_id ?? selectedStation)
        );
        const stationName = itemStation?.name || selectedStationData?.name || '';
        const matching = getMatchingAllergens(item);
        const hasUserAllergen = matching.length > 0;
        const TAG_LABELS: Record<string, string> = {
          V: 'Vegetarian',
          VG: 'Vegan',
        };
        const closeSheet = () => {
          setIsItemDetailOpen(false);
          setSelectedItem(null);
          setDetailQuantity(1);
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
        };
        const handleAddToOrder = () => {
          haptic.medium();
          if (detailQuantity > 0) {
            updateCartQuantity(item, detailQuantity);
          }
          closeSheet();
        };
        return (
          <>
          <div
            className="fixed z-[75] flex items-end justify-center"
            style={{ top: 'calc(50px + env(safe-area-inset-top))', left: 0, right: 0, bottom: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeSheet}
              style={{ touchAction: 'none' }}
            />
            <div
              className="sheet-enter"
              style={{
                position: 'fixed',
                bottom: 'calc(60px + env(safe-area-inset-bottom) + 72px)',
                left: 0,
                right: 0,
                maxHeight: 'calc(100vh - env(safe-area-inset-top) - 80px - 60px - env(safe-area-inset-bottom) - 72px)',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '20px 20px 0 0',
                background: 'white',
                overflow: 'hidden',
                zIndex: 75,
              }}
            >
              <div className="pt-2 pb-1 flex justify-center flex-shrink-0">
                <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
              </div>
              <button
                onClick={closeSheet}
                aria-label="Close details"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-gray-700 flex items-center justify-center shadow-md hover:bg-white active:scale-95 transition-all z-10"
              >
                <X className="w-5 h-5" strokeWidth={2.2} />
              </button>
              <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                <div className="relative w-full bg-gray-100" style={{ height: '200px' }}>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Utensils className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="px-5 pt-4 pb-6">
                  {item.category && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-100 text-[var(--color-orange,#FF6B35)]">
                      {item.category}
                    </span>
                  )}
                  <h2 className="mt-2 text-2xl font-bold text-gray-900 leading-tight">
                    {item.name}
                  </h2>
                  {stationName && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" strokeWidth={2} />
                      <span>{stationName}</span>
                    </div>
                  )}
                  {item.description && (
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      { label: t('calories'), value: item.calories },
                      { label: t('protein'), value: item.protein != null ? `${item.protein}g` : null },
                      { label: t('carbs'), value: item.carbs != null ? `${item.carbs}g` : null },
                      { label: t('fat'), value: item.fat != null ? `${item.fat}g` : null },
                    ].map((n) => (
                      <div
                        key={n.label}
                        className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          {n.label}
                        </p>
                        <p className="mt-0.5 text-lg font-bold text-[#0B1F3F]">
                          {n.value ?? '—'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {item.allergens && item.allergens.length > 0 && (
                    <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                      {hasUserAllergen && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-red-600 mb-2">
                          <AlertTriangle className="w-4 h-4" strokeWidth={2.4} />
                          <span>{t('containsAllergens')}</span>
                        </div>
                      )}
                      <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">
                        {t('contains')}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.allergens.map((a) => (
                          <span
                            key={a}
                            className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-200 text-orange-900"
                          >
                            {formatAllergenDisplay(a)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.tags.filter((tag) => !SUPPRESSED_TAGS.includes(tag)).map((tag) => {
                        const cls = TAG_COLORS[tag] || 'bg-gray-100 text-gray-700';
                        return (
                          <span
                            key={tag}
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${cls}`}
                          >
                            {TAG_LABELS[tag] || tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
          {!isBuffetSelected && (
            <div
              style={{
                position: 'fixed',
                bottom: 'calc(60px + env(safe-area-inset-bottom))',
                left: 0,
                right: 0,
                zIndex: 200,
                background: 'white',
                padding: '12px 20px',
                borderTop: '1px solid #e8e2d8',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <button
                  onClick={() => setDetailQuantity((q) => Math.max(1, q - 1))}
                  disabled={detailQuantity <= 1}
                  aria-label="Decrease quantity"
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  <Minus className="w-5 h-5" strokeWidth={2.5} />
                </button>
                <span className="text-2xl font-bold text-gray-900 min-w-[32px] text-center">
                  {detailQuantity}
                </span>
                <button
                  onClick={() => setDetailQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center active:scale-95 transition-all"
                >
                  <Plus className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>
              <button
                onClick={handleAddToOrder}
                style={{ flex: 1, height: '48px', borderRadius: '12px', background: '#EE5E29', color: 'white', fontFamily: 'Josefin Sans, sans-serif', fontWeight: 600, fontSize: '15px' }}
                className="active:scale-[0.98] transition-all hover:brightness-110"
              >
                {t('addToOrder')}
              </button>
            </div>
          )}
          </>
        );
      })()}

      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          <div
            className="relative w-full max-w-[430px] bg-white rounded-t-3xl shadow-2xl flex flex-col sheet-enter"
            style={{ height: 'calc(70vh - 49px - env(safe-area-inset-bottom))', marginBottom: 'calc(49px + env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{t('yourOrder')}</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                aria-label="Close cart"
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {selectedStationData && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                  <MapPin className="w-4 h-4 text-[var(--color-orange,#FF6B35)] flex-shrink-0" />
                  <p className="text-sm font-medium text-gray-800">
                    {t('pickupAt', { name: selectedStationData.name })}
                  </p>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <ShoppingBag className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">
                    {t('cartEmpty')}
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {cart.map((ci) => (
                    <li
                      key={ci.menuItem.id}
                      className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2.5"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                        {ci.menuItem.image_url ? (
                          <img
                            src={ci.menuItem.image_url}
                            alt={ci.menuItem.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Utensils className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {ci.menuItem.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {ci.menuItem.calories} cal
                          {ci.menuItem.price != null ? ` · $${(Number(ci.menuItem.price) * ci.quantity).toFixed(2)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-1.5 py-1">
                        <button
                          onClick={() => updateCartQuantity(ci.menuItem, -1)}
                          aria-label={`Remove one ${ci.menuItem.name}`}
                          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all text-gray-700"
                        >
                          <Minus className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                        <span className="text-sm font-bold min-w-[18px] text-center text-gray-900">
                          {ci.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(ci.menuItem, 1)}
                          aria-label={`Add one ${ci.menuItem.name}`}
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--color-orange,#FF6B35)] text-white hover:brightness-110 active:scale-95 transition-all"
                        >
                          <Plus className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-5 pt-4 border-t border-gray-100 bg-white" style={{ paddingBottom: '16px' }}>
              {cart.length > 0 && cart.some(ci => ci.menuItem.price != null) && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span className="text-sm font-bold text-gray-900">
                    ${cart.reduce((sum, ci) => sum + (Number(ci.menuItem.price ?? 0) * ci.quantity), 0).toFixed(2)}
                  </span>
                </div>
              )}
              <button
                onClick={placeOrder}
                disabled={
                  selectedStation === null ||
                  cart.length === 0 ||
                  isPlacingOrder ||
                  !canOrder
                }
                className={`w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all ${
                  selectedStation === null ||
                  cart.length === 0 ||
                  isPlacingOrder ||
                  !canOrder
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[var(--color-orange,#FF6B35)] text-white shadow-md hover:shadow-lg active:scale-[0.98]'
                }`}
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('placingOrder')}</span>
                  </>
                ) : !canOrder && selectedStation !== null ? (
                  <span>{t('orderingUnavailable')}</span>
                ) : (
                  <span>
                    {t('placeOrder')} · {totalCartCount}{' '}
                    {totalCartCount === 1 ? t('item') : t('items')}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {orderConfirmed && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-fadeIn">
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center overflow-y-auto py-10">
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg mb-6 animate-scaleIn">
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              {t('orderPlaced')}
            </h2>
            <p className="mt-6 text-5xl font-extrabold text-[var(--color-orange,#FF6B35)] tracking-tight">
              {confirmedOrderNumber}
            </p>
            <p className="mt-3 text-sm text-gray-500">
              {t('showAtCounter')}
            </p>

            {confirmedStationName && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100">
                <Utensils className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">
                  {t('pickupAt', { name: confirmedStationName })}
                </span>
              </div>
            )}

            {confirmedItems.length > 0 && (
              <div className="mt-8 w-full max-w-sm bg-gray-50 rounded-2xl p-4 text-left">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {t('orderSummary')}
                </p>
                <ul className="space-y-2">
                  {confirmedItems.map((ci) => (
                    <li
                      key={ci.menuItem.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700 truncate pr-2">
                        {ci.menuItem.name}
                      </span>
                      <span className="font-semibold text-gray-900 flex-shrink-0">
                        {ci.menuItem.price != null
                          ? `$${(Number(ci.menuItem.price) * ci.quantity).toFixed(2)}`
                          : `x${ci.quantity}`}
                      </span>
                    </li>
                  ))}
                </ul>
                {confirmedItems.some(ci => ci.menuItem.price != null) && (
                  <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-200">
                    <span className="font-semibold text-gray-700">Total</span>
                    <span className="font-bold text-gray-900">
                      ${confirmedItems.reduce((sum, ci) => sum + (Number(ci.menuItem.price ?? 0) * ci.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {earnResult && (
              <div className="mt-5 w-full max-w-sm bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left animate-fadeIn">
                <p className="text-sm font-bold text-emerald-700">
                  {t('pointsEarned', { count: earnResult.pointsEarned })}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {t('balance', { count: earnResult.newBalance })}
                </p>
                {earnResult.isFirstOrder && (
                  <p className="text-xs font-semibold text-emerald-700 mt-1">{t('firstOrderBonus')}</p>
                )}
                {earnResult.multiplier > 1 && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {t('promoApplied', { multiplier: earnResult.multiplier })}
                  </p>
                )}
              </div>
            )}
            {earnError && (
              <p className="mt-4 text-xs text-gray-400">{t('pointsError')}</p>
            )}

            {coffeeResult?.freeDrinkEarned && (
              <div className="mt-4 w-full max-w-sm bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left animate-fadeIn">
                <p className="text-sm font-bold text-orange-700">
                  ☕ {t('freeDrinkEarned')}
                </p>
                <p className="text-xs text-orange-600 mt-0.5">{t('completedDrinks')}</p>
              </div>
            )}

            {falconResult?.badgeAwarded && (
              <div className="mt-4 w-full max-w-sm bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left animate-fadeIn">
                <p className="text-sm font-bold text-amber-700">
                  🏆 {t('youreAFalcon')}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">{t('bonusPoints')}</p>
              </div>
            )}

            <button
              onClick={() => setShowFeedback(true)}
              className="mt-6 w-full max-w-sm h-12 rounded-2xl font-semibold text-sm border-2 border-[var(--color-teal,#1A9B8F)] text-[var(--color-teal,#1A9B8F)] hover:bg-[var(--color-teal)]/5 active:scale-[0.98] transition-all"
            >
              {t('rateOrder', { ns: 'feedback' })}
            </button>
          </div>

          <div className="px-5 border-t border-gray-100 bg-white flex gap-3" style={{ paddingTop: '16px', paddingBottom: 'calc(16px + 49px + env(safe-area-inset-bottom))' }}>
            <button
              onClick={resetConfirmation}
              className="flex-1 h-14 rounded-2xl font-semibold text-base bg-[var(--color-orange,#FF6B35)] text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
            >
              {t('newOrder')}
            </button>
            <button
              onClick={() => {
                resetConfirmation();
                onTabChange('profile');
              }}
              className="flex-1 h-14 rounded-2xl font-semibold text-base bg-gray-100 text-gray-800 hover:bg-gray-200 active:scale-[0.98] transition-all"
            >
              {t('viewInProfile')}
            </button>
          </div>
        </div>
      )}

      {showFeedback && confirmedOrderId && (
        <OrderFeedbackModal
          orderId={confirmedOrderId}
          stationId={selectedStation || 0}
          stationName={confirmedStationName}
          items={confirmedItems.map((ci) => ({
            id: ci.menuItem.id,
            name: ci.menuItem.name,
          }))}
          userId={userId}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
