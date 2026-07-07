import { Home as House, UtensilsCrossed, Star, Sparkles, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { haptic } from '../utils/haptics';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabIcons = {
  home: House,
  order: UtensilsCrossed,
  rewards: Star,
  discover: Sparkles,
  profile: User,
} as const;

const tabIds = ['home', 'order', 'rewards', 'discover', 'profile'] as const;

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useTranslation('common');

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[100]"
      style={{
        background: '#F9F2E7',
        borderTop: '1px solid #e8e2d8',
        display: 'flex',
        alignItems: 'flex-start',
        height: 'calc(49px + env(safe-area-inset-bottom))',
      }}
    >
      <div
        className="max-w-[430px] mx-auto flex items-start justify-around w-full"
        style={{ height: '49px' }}
      >
        {tabIds.map((id) => {
          const Icon = tabIcons[id];
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              data-tab={id}
              onClick={() => { haptic.selection(); onTabChange(id); }}
              className="rounded-lg text-gray-500"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: '6px',
                height: '49px',
                color: isActive ? '#EE5E29' : undefined,
              }}
            >
              <Icon className="w-7 h-7" />
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'Josefin Sans, sans-serif',
                marginTop: '2px',
              }}>
                {t(`nav.${id}`)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
