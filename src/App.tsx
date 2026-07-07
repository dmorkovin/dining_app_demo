import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { haptic } from './utils/haptics';
import { Home as House, UtensilsCrossed, Star, Sparkles, User, AlertTriangle } from 'lucide-react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { VoteTab } from './components/VoteTab';
import { RewardsTab } from './components/RewardsTab';
import { MoreTab } from './components/MoreTab';
import { OrderTab, type CartItem } from './components/OrderTab';
import { ProfileDrawer } from './components/ProfileDrawer';
import { NotificationPanel } from './components/NotificationPanel';
import { SendSmileModal } from './components/SendSmileModal';
import { ChatAssistant } from './components/ChatAssistant';
import { RightSidebar } from './components/RightSidebar';
import { supabase } from './lib/supabase';
import { getAvatarUrl } from './lib/avatarUrl';
import { ensureLoyaltyAccount } from './lib/ensureLoyaltyAccount';
import { AuthProvider, useAuth } from './lib/AuthContext';
import AuthScreen from './components/auth/AuthScreen';
import ResetPasswordScreen from './components/auth/ResetPasswordScreen';
import OnboardingFlow from './components/auth/OnboardingFlow';
import { LanguageOnboarding } from './components/LanguageOnboarding';
import { DEMO_MODE, DEMO_USER_ID } from './lib/demoMode';
import type { Database } from './lib/database.types';

type Staff = Database['public']['Tables']['staff']['Row'];
type Station = Database['public']['Tables']['stations']['Row'];

const sidebarTabDefs = [
  { id: 'home', key: 'nav.home', Icon: House },
  { id: 'order', key: 'nav.order', Icon: UtensilsCrossed },
  { id: 'rewards', key: 'nav.rewards', Icon: Star },
  { id: 'discover', key: 'nav.discover', Icon: Sparkles },
  { id: 'profile', key: 'nav.profile', Icon: User },
];

function AppContent() {
  const { session, loading, needsPasswordReset } = useAuth();
  const { t } = useTranslation('common');
  const [languageSelected, setLanguageSelected] = useState(() => !!localStorage.getItem('app-language'));
  const [languageCheckDone, setLanguageCheckDone] = useState(() => !!localStorage.getItem('app-language'));

  const [activeTab, setActiveTab_] = useState('home');
  const prevTabRef = useRef('home');
  const setActiveTab = (tab: string) => {
    prevTabRef.current = activeTab;
    setActiveTab_(tab);
  };
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [sendSmileModalOpen, setSendSmileModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showStationLockWarning, setShowStationLockWarning] = useState(false);
  const [pendingStationId, setPendingStationId] = useState<number | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [cartItems, setCartItems] = useState<{menuItem: any, quantity: number}[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState<string | null>(null);
  const [headerUserName, setHeaderUserName] = useState<string | null>(null);

  useEffect(() => {
    if (languageCheckDone) return;
    if (DEMO_MODE) {
      localStorage.setItem('app-language', 'en');
      setLanguageSelected(true);
      setLanguageCheckDone(true);
      return;
    }
    if (loading) return;
    if (session?.user?.id) {
      localStorage.setItem('app-language', 'en');
      setLanguageSelected(true);
      setLanguageCheckDone(true);
    } else {
      setLanguageCheckDone(true);
    }
  }, [loading, session?.user?.id, languageCheckDone]);

  const effectiveUserId = (DEMO_MODE ? DEMO_USER_ID : session?.user?.id) ?? '';

  useEffect(() => {
    if (!effectiveUserId) return;
    const fetchAvatar = async () => {
      const { data } = await supabase
        .from('users')
        .select('name, profile_image_url')
        .eq('id', effectiveUserId)
        .maybeSingle();
      if (data) {
        setHeaderUserName(data.name);
        if (data.profile_image_url) {
          getAvatarUrl(data.profile_image_url).then(setHeaderAvatarUrl);
        } else {
          setHeaderAvatarUrl(null);
        }
      }
    };
    fetchAvatar();
  }, [effectiveUserId]);

  useEffect(() => {
    const loadStations = async () => {
      const { data } = await supabase
        .from('stations')
        .select('*')
        .eq('is_active', true);
      if (data) setStations(data as Station[]);
    };
    loadStations();
  }, []);

  const currentStationName =
    stations.find((s) => s.id === selectedStationId)?.name || 'another station';

  const handleStationSelectFromHome = (id: number, itemId?: string) => {
    if (cart.length > 0 && selectedStationId !== id) {
      setPendingStationId(id);
      if (itemId) setPendingItemId(itemId);
      setShowStationLockWarning(true);
      return;
    }
    setSelectedStationId(id);
    if (itemId) setPendingItemId(itemId);
    setActiveTab('order');
  };

  const handleClearCartAndSwitch = () => {
    setCart([]);
    if (pendingStationId !== null) {
      setSelectedStationId(pendingStationId);
    }
    setActiveTab('order');
    setPendingStationId(null);
    setShowStationLockWarning(false);
  };

  const handleKeepCart = () => {
    setPendingStationId(null);
    setPendingItemId(null);
    setShowStationLockWarning(false);
  };

  const checkUnreadNotifications = async () => {
    if (!effectiveUserId) return;
    const { data } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', effectiveUserId)
      .eq('unread', true)
      .limit(1);

    setHasUnreadNotifications(!!data && data.length > 0);
  };

  useEffect(() => {
    if (!effectiveUserId) return;
    checkUnreadNotifications();
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${effectiveUserId}`,
        },
        () => {
          checkUnreadNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [effectiveUserId]);

  useEffect(() => {
    if (!effectiveUserId || DEMO_MODE) return;
    supabase
      .from('users')
      .select('onboarding_completed, name')
      .eq('id', effectiveUserId)
      .single()
      .then(({ data }) => {
        setOnboardingComplete(data?.onboarding_completed ?? false);
      });
    ensureLoyaltyAccount(effectiveUserId);
  }, [session]);

  const handleSendSmile = (staff: Staff) => {
    setSelectedStaff(staff);
    setSendSmileModalOpen(true);
  };

  if (!languageCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="text-center">
          <img
            src="/assets/Frame_2087326403.png"
            alt="Genuine Dining"
            style={{ width: '96px', height: '96px', borderRadius: '22px', display: 'block', margin: '0 auto 16px' }}
          />
        </div>
      </div>
    );
  }

  if (!languageSelected) {
    return <LanguageOnboarding onComplete={() => setLanguageSelected(true)} />;
  }

  if (!DEMO_MODE && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="text-center">
          <img
            src="/assets/Frame_2087326403.png"
            alt="Genuine Dining"
            style={{ width: '96px', height: '96px', borderRadius: '22px', display: 'block', margin: '0 auto 16px' }}
          />
          <p className="text-gray-500 text-sm">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (needsPasswordReset) {
    return <ResetPasswordScreen />;
  }

  if (!DEMO_MODE && !session) {
    return <AuthScreen />;
  }

  if (!DEMO_MODE && session && onboardingComplete === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="text-gray-400 text-sm">
          {t('loading')}
        </div>
      </div>
    );
  }

  if (!DEMO_MODE && session && onboardingComplete === false) {
    return (
      <OnboardingFlow
        userId={session.user.id}
        userName={session.user.user_metadata?.name || ''}
        onComplete={() => setOnboardingComplete(true)}
      />
    );
  }

  return (
    <div className="bg-[#F7F8FA] overflow-hidden" style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', height: '100dvh', width: '100vw' }}>
      <div className="max-w-[430px] lg:max-w-none mx-auto bg-white lg:bg-transparent h-screen relative overflow-hidden" style={{ maxWidth: '100vw' }}>
        {(() => {
          const headerKeys: Record<string, { title: string; tagline: string }> = {
            home:     { title: t('header.homeTitle'), tagline: t('header.homeTagline') },
            order:    { title: t('header.orderTitle'), tagline: t('header.orderTagline') },
            rewards:  { title: t('header.rewardsTitle'), tagline: t('header.rewardsTagline') },
            discover: { title: t('header.discoverTitle'), tagline: t('header.discoverTagline') },
            profile:  { title: t('header.profileTitle'), tagline: t('header.profileTagline') },
          };
          const copy = headerKeys[activeTab] ?? headerKeys.home;
          return (
            <Header
              title={copy.title}
              tagline={copy.tagline}
              activeTab={activeTab}
              onNotificationClick={() => setIsNotificationOpen(true)}
              hasUnreadNotifications={hasUnreadNotifications}
              avatarUrl={headerAvatarUrl}
              userName={headerUserName}
              onAvatarClick={() => setActiveTab('profile')}
            />
          );
        })()}

        <main className="lg:pt-0 lg:flex lg:max-w-[1400px] lg:mx-auto lg:gap-6 lg:px-6 lg:pl-32">
          {/* Desktop Left Sidebar - Icon Only */}
          <aside className="hidden lg:flex lg:flex-col lg:items-center lg:w-20 lg:flex-shrink-0 lg:sticky lg:top-20 lg:self-start lg:pt-6">
            <div className="space-y-1">
              {sidebarTabDefs.map(({ id, key, Icon }) => (
                <button
                  key={id}
                  onClick={() => { haptic.selection(); setActiveTab(id); }}
                  title={t(key)}
                  className={`w-12 h-12 flex items-center justify-center rounded-[14px] transition-all ${
                    activeTab === id
                      ? 'bg-[var(--color-orange)] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 lg:min-h-screen lg:bg-white lg:rounded-[14px] lg:shadow-sm lg:max-w-2xl lg:px-6" style={{ position: 'relative', height: 'calc(100dvh - 50px - 49px - env(safe-area-inset-top) - env(safe-area-inset-bottom))', marginTop: 'calc(50px + env(safe-area-inset-top))', marginBottom: 'calc(49px + env(safe-area-inset-bottom))', overflow: 'hidden' }}>
            {activeTab === 'home' && (
              <HomeTab
                userId={effectiveUserId}
                onTabChange={setActiveTab}
                onStationSelect={handleStationSelectFromHome}
                onStationRequest={handleStationSelectFromHome}
              />
            )}
            {activeTab === 'order' && (
              <OrderTab
                userId={effectiveUserId}
                onTabChange={setActiveTab}
                initialStationId={selectedStationId}
                initialItemId={pendingItemId}
                onItemDetailOpened={() => setPendingItemId(null)}
                onStationSelect={setSelectedStationId}
                cart={cart}
                setCart={setCart}
                onCartChange={setCartItems}
                externalCartOpen={isCartOpen}
                onCartOpenChange={(open) => setIsCartOpen(open)}
              />
            )}
            {activeTab === 'rewards' && (
              <RewardsTab userId={effectiveUserId} />
            )}
            {activeTab === 'discover' && (
              <VoteTab userId={effectiveUserId} onSendSmile={handleSendSmile} />
            )}
            {activeTab === 'profile' && (
              <MoreTab userId={effectiveUserId} onSendSmile={handleSendSmile} />
            )}
          </div>

          {/* Desktop Right Sidebar */}
          <aside className="hidden lg:block lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-20 lg:self-start lg:pt-6">
            <RightSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          </aside>
        </main>

        {cartItems.length > 0 && (
          <button
            onClick={() => {
              setActiveTab('order');
              setIsCartOpen(true);
            }}
            style={{
              position: 'fixed',
              bottom: 'calc(49px + env(safe-area-inset-bottom) + 12px)',
              right: '20px',
              zIndex: 50
            }}
            className="cursor-pointer bg-[var(--color-orange)] text-white rounded-full shadow-lg flex items-center gap-2 px-4 py-3"
          >
            <span>🛒</span>
            <span className="font-bold text-sm">
              {cartItems.reduce((sum, i) => sum + i.quantity, 0)} {t('items')}
            </span>
          </button>
        )}

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        <ProfileDrawer
          userId={effectiveUserId}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />

        <NotificationPanel
          userId={effectiveUserId}
          isOpen={isNotificationOpen}
          onClose={() => {
            setIsNotificationOpen(false);
            checkUnreadNotifications();
          }}
        />

        <SendSmileModal
          userId={effectiveUserId}
          isOpen={sendSmileModalOpen}
          staff={selectedStaff}
          onClose={() => {
            setSendSmileModalOpen(false);
            setTimeout(() => setSelectedStaff(null), 2000);
          }}
        />

        {/* <ChatAssistant /> */}

        {showStationLockWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-[var(--color-orange,#FF6B35)]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                {t('cartWarning.title')}
              </h3>
              <p className="text-gray-600 text-center text-sm leading-relaxed mb-6">
                {t('cartWarning.message', { station: currentStationName })}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleClearCartAndSwitch}
                  className="w-full py-3 rounded-xl bg-[var(--color-orange,#FF6B35)] text-white font-semibold hover:opacity-90 transition"
                >
                  {t('cartWarning.clearAndSwitch')}
                </button>
                <button
                  onClick={handleKeepCart}
                  className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  {t('cartWarning.keepCart')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
