import { Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  tagline: string;
  activeTab: string;
  onNotificationClick: () => void;
  hasUnreadNotifications: boolean;
  avatarUrl?: string | null;
  userName?: string | null;
  onAvatarClick?: () => void;
}

export function Header({ title, tagline, activeTab, onNotificationClick, hasUnreadNotifications, avatarUrl, userName, onAvatarClick }: HeaderProps) {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 'calc(50px + env(safe-area-inset-top))',
        backgroundColor: '#164A31',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/assets/top_bar_background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1,
        }}
      />
      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(22, 74, 49, 0.25)',
          zIndex: 2,
        }}
      />
      {/* Content */}
      <div
        className="relative max-w-[430px] lg:max-w-7xl mx-auto px-5 lg:px-8 h-full flex items-end"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: '8px', zIndex: 3 }}
      >
        <div className="flex items-center justify-between w-full">
          <div>
            <h1
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 700,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontSize: '14px',
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 400,
                color: '#F88D66',
                fontSize: '11px',
                marginTop: '2px',
              }}
            >
              {tagline}
            </p>
          </div>

          {activeTab !== 'profile' && (
            <div className="flex items-center gap-3">
              <button
                onClick={onAvatarClick}
                className="w-9 h-9 rounded-full ring-2 ring-white/30 overflow-hidden flex items-center justify-center flex-shrink-0"
                aria-label="Profile"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName || 'Profile'} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">{userName?.[0]?.toUpperCase() || ''}</span>
                  </div>
                )}
              </button>
              <button
                onClick={onNotificationClick}
                className="relative p-2 rounded-full transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: 'rgba(255,255,255,0.9)' }} />
                {hasUnreadNotifications && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse-slow" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
