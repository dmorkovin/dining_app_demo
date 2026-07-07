import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

interface ProfileDrawerProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileDrawer({ userId, isOpen, onClose }: ProfileDrawerProps) {
  const { t } = useTranslation('profileDrawer');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUser();
    }
  }, [isOpen]);

  const fetchUser = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) setUser(data);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 w-[300px] bg-white z-50 shadow-2xl transition-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <div className="h-full flex flex-col">
          <div className="bg-[var(--color-navy)] p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={user?.profile_image_url || 'https://via.placeholder.com/72'}
              alt="Profile"
              className="w-[72px] h-[72px] rounded-full object-cover mb-4 ring-4 ring-white/20"
            />

            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-sm text-white/70 mt-1">
              Computer Science · Class of 2027
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-serif font-bold text-[var(--color-orange)]">
                    {user?.points.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{t('points')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-serif font-bold text-[var(--color-orange)]">
                    {user?.tier}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{t('tier')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-serif font-bold text-[var(--color-orange)]">
                    {user?.meals_count}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{t('meals')}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {t('mealPlan')}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">{t('planType')}</span>
                      <span className="text-sm font-semibold text-[var(--color-navy)]">
                        {user?.meal_plan_type}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">{t('guestSwipes')}</span>
                      <span className="text-sm font-semibold text-[var(--color-navy)]">
                        {t('remaining', { count: user?.guest_swipes })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('flexDollars')}</span>
                      <span className="text-sm font-semibold text-[var(--color-navy)]">
                        ${user?.flex_dollars.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {t('dietaryPreferences')}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">{t('alerts')}</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {user?.dietary_alerts && user.dietary_alerts.length > 0 ? (
                          user.dietary_alerts.map((alert) => (
                            <span
                              key={alert}
                              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                            >
                              {alert}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">{t('none')}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">{t('preference')}</span>
                      <div className="mt-1">
                        <span className="text-sm font-semibold text-[var(--color-navy)]">
                          {user?.dietary_preference || t('notSet')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {t('accountInfo')}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">{t('email')}</span>
                      <div className="mt-1 text-sm font-semibold text-[var(--color-navy)]">
                        {user?.email}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">{t('studentId')}</span>
                      <div className="mt-1 text-sm font-semibold text-[var(--color-navy)]">
                        {user?.student_id}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
