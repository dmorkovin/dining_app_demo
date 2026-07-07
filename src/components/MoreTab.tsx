import { useState, useEffect } from 'react';
import { User, LogOut, Check, ChevronRight, Camera, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { getAvatarUrl } from '../lib/avatarUrl';
import { useAuth } from '../lib/AuthContext';
import { haptic } from '../utils/haptics';
import { FDA_ALLERGENS, LIFESTYLE_PREFERENCES, getAllergenI18nKey } from '../lib/allergens';
import { GeneralFeedbackModal } from './GeneralFeedbackModal';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  student_id: string;
  points: number;
  tier: string;
  meals_count: number;
  meal_plan_type: string;
  guest_swipes: number;
  flex_dollars: number;
  dietary_alerts: string[];
  dietary_preference: string;
  profile_image_url: string;
}

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  stations: { name: string } | null;
}

const STATUS_STYLES: Record<string, { key: string; className: string }> = {
  pending: { key: 'pending', className: 'bg-gray-100 text-gray-700' },
  confirmed: { key: 'confirmed', className: 'bg-blue-100 text-blue-700' },
  preparing: { key: 'preparing', className: 'bg-orange-100 text-orange-700' },
  ready: { key: 'ready', className: 'bg-green-100 text-green-700' },
  picked_up: { key: 'picked_up', className: 'bg-gray-100 text-gray-600' },
  cancelled: { key: 'cancelled', className: 'bg-red-100 text-red-700' },
};

function formatOrderDate(iso: string, todayLabel: string, locale: string) {
  const date = new Date(iso);
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  if (isToday) return todayLabel;
  return date.toLocaleDateString(locale === 'es' ? 'es-US' : 'en-US', { month: 'short', day: 'numeric' });
}

interface MoreTabProps {
  userId: string;
  onSendSmile?: (staff: any) => void;
}

export const MoreTab = ({ userId }: MoreTabProps) => <ProfileTab userId={userId} />;

interface ProfileTabProps {
  userId: string;
}

export function ProfileTab({ userId }: ProfileTabProps) {
  const { signOut } = useAuth();
  const { t: tCommon, i18n } = useTranslation('common');
  const { t } = useTranslation('profile');
  const { t: tAllergens } = useTranslation('allergens');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [hideAllergenItems, setHideAllergenItems] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showGeneralFeedback, setShowGeneralFeedback] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchOrders();
  }, []);

  const fetchUser = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) console.error('Error fetching user:', error);
    if (data) {
      setUser(data as UserProfile);
      setAlerts(data.dietary_alerts || []);
      setHideAllergenItems((data as { hide_allergen_items?: boolean }).hide_allergen_items || false);
      setDietaryPreferences(
        data.dietary_preference
          ? data.dietary_preference.split(',').map((s: string) => s.trim()).filter(Boolean)
          : []
      );
      if (data.profile_image_url) {
        getAvatarUrl(data.profile_image_url).then(setAvatarUrl);
      } else {
        setAvatarUrl(null);
      }
    }
  };

  const togglePreference = async (pref: string) => {
    const updated = dietaryPreferences.includes(pref)
      ? dietaryPreferences.filter((p) => p !== pref)
      : [...dietaryPreferences, pref];
    const previous = dietaryPreferences;
    setDietaryPreferences(updated);
    const { error } = await supabase
      .from('users')
      .update({ dietary_preference: updated.join(', ') })
      .eq('id', userId);
    if (error) {
      console.error('Error updating dietary preference:', error);
      setDietaryPreferences(previous);
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, stations(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);
    if (error) console.error('Error fetching orders:', error);
    if (data) setOrders(data as unknown as OrderRow[]);
  };

  const toggleAllergen = async (allergen: string) => {
    const newAlerts = alerts.includes(allergen)
      ? alerts.filter((a) => a !== allergen)
      : [...alerts, allergen];
    setAlerts(newAlerts);
    const { error } = await supabase
      .from('users')
      .update({ dietary_alerts: newAlerts })
      .eq('id', userId);
    if (error) {
      console.error('Error updating dietary alerts:', error);
      setAlerts(alerts);
    }
  };

  const toggleHideAllergenItems = async () => {
    const previous = hideAllergenItems;
    const newValue = !previous;
    setHideAllergenItems(newValue);
    const { error } = await supabase
      .from('users')
      .update({ hide_allergen_items: newValue })
      .eq('id', userId);
    if (error) {
      console.error('Error updating hide_allergen_items:', error);
      setHideAllergenItems(previous);
    }
  };

  const handleDeleteAccount = async () => {
    haptic.error();
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? userId;

      const tables: Array<{ table: string; column: string }> = [
        { table: 'user_swipes', column: 'user_id' },
        { table: 'user_votes', column: 'user_id' },
        { table: 'theme_upvotes', column: 'user_id' },
        { table: 'theme_proposals', column: 'user_id' },
        { table: 'rewards_transactions', column: 'user_id' },
        { table: 'smiles_sent', column: 'user_id' },
        { table: 'event_rsvps', column: 'user_id' },
        { table: 'notifications', column: 'user_id' },
      ];

      for (const { table, column } of tables) {
        const { error } = await (supabase.from(table as any).delete().eq(column, uid));
        if (error) console.warn(`Delete from ${table} failed:`, error.message);
      }

      const { error: userError } = await supabase.from('users').delete().eq('id', uid);
      if (userError) throw userError;

      await signOut();
    } catch {
      setDeleteLoading(false);
      setDeleteError('deleteError');
    }
  };

  const handleAvatarUpload = () => {
    console.log('Profile photo upload — coming soon');
  };

  return (
    <div style={{ overflowY: 'auto', overscrollBehavior: 'contain', height: '100%' }}>
      <div className="px-5 lg:px-6 pt-6">
        {/* SECTION 1 — Profile Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <button onClick={handleAvatarUpload} className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name}
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-[var(--color-orange)] flex items-center justify-center shadow-md">
                <User className="w-14 h-14 text-white" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
              <Camera className="w-4 h-4 text-[var(--color-navy)]" />
            </span>
          </button>
          <h3 className="mt-4 text-2xl font-bold text-[var(--color-navy)]">
            {user?.name || t('loading')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          {user?.student_id && (
            <p className="text-xs text-gray-400 mt-1">{t('studentId', { id: user.student_id })}</p>
          )}
        </div>

        {/* SECTION 2 — Meal Plan Card */}
        <div className="mb-8">
          <div
            className="overflow-hidden shadow-lg"
            style={{
              background: "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url('/assets/tubes.png')",
              backgroundSize: '250%',
              backgroundPosition: 'center center',
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1.5 h-6 bg-[var(--color-orange)] rounded-full" />
              <h3
                className="text-white"
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                }}
              >
                {t('myMealPlan')}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: t('mealSwipes'), value: user?.meals_count ?? 0 },
                { label: t('diningDollars'), value: `$${user?.flex_dollars ?? 0}` },
                { label: t('planType'), value: user?.meal_plan_type || '—' },
                { label: t('guestSwipes'), value: user?.guest_swipes ?? 0 },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 10,
                    padding: '12px 14px',
                  }}
                >
                  <p
                    className="text-white mb-1"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-white leading-tight truncate"
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3 — Recent Orders */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-[var(--color-navy)] mb-4">{t('recentOrders')}</h3>
          {orders.length === 0 ? (
            <div className="bg-white rounded-[14px] p-6 card-shadow text-center">
              <p className="text-sm text-gray-500">
                {t('noOrdersYet')}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {orders.map((order) => {
                const status = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
                return (
                  <div key={order.id} className="bg-white rounded-[14px] p-4 card-shadow">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[var(--color-navy)]">
                          {order.order_number}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5 truncate">
                          {order.stations?.name || t('unknownStation')}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatOrderDate(order.created_at, t('today'), i18n.language)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}
                      >
                        {t(`status.${status.key}`)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 4 — Dietary Settings */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-[var(--color-navy)] mb-4">{t('dietarySettings')}</h3>

          {/* Allergens (FDA Top 9) */}
          <div className="bg-white rounded-[14px] p-4 card-shadow mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">{tAllergens('sectionTitle')}</p>
            <div className="grid grid-cols-2 gap-2">
              {FDA_ALLERGENS.map((allergen) => {
                const active = alerts.includes(allergen);
                return (
                  <button
                    key={allergen}
                    onClick={() => toggleAllergen(allergen)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${
                      active
                        ? 'border-[var(--color-orange)] bg-orange-50 text-[var(--color-orange)]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{tAllergens(getAllergenI18nKey(allergen))}</span>
                    <div
                      className={`w-9 h-5 rounded-full relative transition-all ${
                        active ? 'bg-[var(--color-orange)]' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                          active ? 'left-4' : 'left-0.5'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">
                  {tAllergens('hideToggle')}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                  {tAllergens('hideToggleDescription')}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleHideAllergenItems}
                role="switch"
                aria-checked={hideAllergenItems}
                aria-label={tAllergens('hideToggle')}
                className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-all ${
                  hideAllergenItems ? 'bg-[var(--color-orange)]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                    hideAllergenItems ? 'left-4' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Lifestyle Preferences */}
          <div className="bg-white rounded-[14px] p-4 card-shadow">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">{tAllergens('lifestyleTitle')}</p>
            <div className="grid grid-cols-2 gap-2">
              {LIFESTYLE_PREFERENCES.map((preference) => {
                const active = dietaryPreferences.includes(preference);
                return (
                  <button
                    key={preference}
                    onClick={() => togglePreference(preference)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-left ${
                      active
                        ? 'border-[var(--color-orange)] bg-orange-50 text-[var(--color-orange)]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{tAllergens(getAllergenI18nKey(preference))}</span>
                    {active && <Check className="w-4 h-4 text-[var(--color-orange)]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 5 — Language */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-[var(--color-navy)] mb-4">{tCommon('language')}</h3>
          <div className="bg-white rounded-[14px] card-shadow divide-y divide-gray-100">
            <button
              onClick={() => { i18n.changeLanguage('en'); localStorage.setItem('app-language', 'en'); }}
              className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-[var(--color-navy)] hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">English</span>
              {i18n.language === 'en' && <Check className="w-4 h-4 text-[var(--color-orange)]" />}
            </button>
            <button
              onClick={() => { i18n.changeLanguage('es'); localStorage.setItem('app-language', 'es'); }}
              className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-[var(--color-navy)] hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">Espa&ntilde;ol</span>
              {i18n.language === 'es' && <Check className="w-4 h-4 text-[var(--color-orange)]" />}
            </button>
          </div>
        </div>

        {/* SECTION 6 — App Info */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-[var(--color-navy)] mb-4">{t('about')}</h3>
          <div className="bg-white rounded-[14px] card-shadow divide-y divide-gray-100">
            <button
              onClick={() => setShowGeneralFeedback(true)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-[var(--color-navy)] hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--color-teal)]" />
                {t('sendFeedback')}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => window.open('https://diningapp.netlify.app/privacy-policy.html', '_blank')}
              className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-[var(--color-navy)] hover:bg-gray-50 transition-colors"
            >
              <span>{t('privacyPolicy')}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => window.open('https://diningapp.netlify.app/terms-of-use.html', '_blank')}
              className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-[var(--color-navy)] hover:bg-gray-50 transition-colors"
            >
              <span>{t('termsOfUse')}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex items-center justify-between px-4 py-3.5 text-sm text-gray-500">
              <span>{t('appVersion')}</span>
              <span className="font-mono">1.0.0</span>
            </div>
          </div>

          <button onClick={async () => { await signOut() }} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-500 text-red-500 rounded-[14px] font-semibold hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" />
            {t('signOut')}
          </button>

          <button
            onClick={() => { setShowDeleteModal(true); setDeleteError(null); }}
            style={{
              fontFamily: "'Josefin Sans', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              color: '#EE5E29',
              background: 'none',
              border: 'none',
              padding: '12px 0 0',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'center',
            }}
          >
            {t('deleteAccount')}
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 360,
            }}
          >
            <h2
              style={{
                fontFamily: "'Josefin Sans', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: 20,
                color: '#1B2838',
                marginBottom: 12,
              }}
            >
              {t('deleteAccountTitle')}
            </h2>
            <p
              style={{
                fontFamily: "'Josefin Sans', system-ui, sans-serif",
                fontSize: 14,
                color: '#6B7280',
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              {t('deleteAccountMessage')}
            </p>

            {deleteError && (
              <p
                style={{
                  fontFamily: "'Josefin Sans', system-ui, sans-serif",
                  fontSize: 13,
                  color: '#EE5E29',
                  marginBottom: 16,
                  textAlign: 'center',
                }}
              >
                {t(deleteError)}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteError(null); }}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 10,
                  border: '1.5px solid #D1D5DB',
                  background: 'white',
                  fontFamily: "'Josefin Sans', system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#374151',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  opacity: deleteLoading ? 0.5 : 1,
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 10,
                  border: 'none',
                  background: '#EE5E29',
                  fontFamily: "'Josefin Sans', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: 'white',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  opacity: deleteLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {deleteLoading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    {t('deleting')}
                  </>
                ) : (
                  t('deleteAccount')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGeneralFeedback && (
        <GeneralFeedbackModal
          userId={userId}
          onClose={() => setShowGeneralFeedback(false)}
        />
      )}
    </div>
  );
}
