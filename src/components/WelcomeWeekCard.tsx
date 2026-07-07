import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';

interface WelcomeWeekCardProps {
  foundingFalconBadge: boolean;
  welcomeStationsVisited: number[];
  challengeStations: { id: number; name: string; icon: string }[];
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export function WelcomeWeekCard({ foundingFalconBadge, welcomeStationsVisited, challengeStations, onDismiss, showDismiss = false }: WelcomeWeekCardProps) {
  const { t } = useTranslation('home');
  const [modalOpen, setModalOpen] = useState(false);

  if (foundingFalconBadge) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 text-center shadow-sm">
        <div className="text-4xl mb-2">🏆</div>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">{t('foundingFalcon')}</p>
        <h3 className="text-lg font-bold text-gray-900">{t('youreAFalcon')}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {t('bonusPointsEarned')} · {t('badgeUnlocked')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl leading-none">🦅</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900">{t('becomeFalcon')}</h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t('falconSubtitle')}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {challengeStations.map((station) => {
            const visited = welcomeStationsVisited.includes(station.id);
            return (
              <div key={station.id} className="flex items-center gap-2.5">
                {visited ? (
                  <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                <span className={`text-sm ${visited ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                  {station.name}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span className="font-semibold text-gray-700">
            {welcomeStationsVisited.length} {t('locationsVisited')}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(welcomeStationsVisited.length / 4 * 100, 100)}%` }}
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="flex-1 h-10 rounded-xl bg-amber-500 text-white text-sm font-semibold shadow-sm hover:bg-amber-600 active:scale-[0.97] transition-all"
          >
            {t('imIn')}
          </button>
          {showDismiss && onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-1 h-10 rounded-xl bg-white text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-50 active:scale-[0.97] transition-all"
            >
              {t('notInterestedWelcome')}
            </button>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in fade-in zoom-in-95">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 pr-8 mb-3">{t('welcomeModalTitle')}</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">{t('welcomeModalDescription')}</p>

            <div className="space-y-2.5 mb-5">
              {challengeStations.map((station) => {
                const visited = welcomeStationsVisited.includes(station.id);
                return (
                  <div key={station.id} className="flex items-center gap-2.5">
                    {visited ? (
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${visited ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                      {station.name}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-semibold">💡 {t('tip')}</span> {t('welcomeModalTip')}
              </p>
            </div>

            <button
              onClick={() => setModalOpen(false)}
              className="w-full h-11 rounded-xl bg-amber-500 text-white text-sm font-semibold shadow-sm hover:bg-amber-600 active:scale-[0.97] transition-all"
            >
              {t('gotIt')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
