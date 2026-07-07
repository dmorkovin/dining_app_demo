import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type LimitedTimeOffer = Database['public']['Tables']['limited_time_offers']['Row'] & {
  menu_item: MenuItem;
};
type Event = Database['public']['Tables']['events']['Row'];

interface RightSidebarProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
}

export function RightSidebar({ activeTab, onTabChange }: RightSidebarProps) {
  const { t, i18n } = useTranslation('sidebar');
  const [limitedOffers, setLimitedOffers] = useState<LimitedTimeOffer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchLimitedOffers();
    fetchEvents();
  }, []);

  const fetchLimitedOffers = async () => {
    const { data, error } = await supabase
      .from('limited_time_offers')
      .select('*, menu_item:menu_items(*)');
    if (error) console.error('Error fetching limited offers:', error);
    if (data) {
      const offers = data.map((offer) => ({
        ...offer,
        menu_item: Array.isArray(offer.menu_item) ? offer.menu_item[0] : offer.menu_item,
      })) as LimitedTimeOffer[];
      setLimitedOffers(offers);
    }
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    if (error) console.error('Error fetching events:', error);
    if (data) setEvents(data);
  };

  return (
    <div className="px-4 space-y-4">
      {/* Your Points */}
      <div className="bg-gradient-to-br from-[var(--color-navy)] to-gray-800 rounded-[14px] p-4 text-white">
        <h3 className="font-bold mb-2 text-sm">{t('yourPoints')}</h3>
        <div className="text-3xl font-serif font-bold mb-1">2,450</div>
        <p className="text-xs text-white/70">{t('pointsToTier', { count: 250 })}</p>
      </div>

      {/* Events */}
      <div className="bg-white rounded-[14px] p-4 border border-gray-200">
        <h3 className="font-bold text-[var(--color-navy)] mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--color-orange)]" />
          {t('upcomingEvents')}
        </h3>
        <div className="space-y-2">
          {events.slice(0, 4).map((event) => (
            <button
              key={event.id}
              onClick={() => {
                if (onTabChange) {
                  onTabChange('more');
                } else {
                  const moreTab = document.querySelector('[data-tab="more"]') as HTMLButtonElement;
                  if (moreTab) moreTab.click();
                }
              }}
              className="w-full text-left border-l-4 border-[var(--color-orange)] pl-3 hover:bg-gray-50 transition-colors py-2 rounded-r cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Calendar className="w-3 h-3" />
                {new Date(event.event_date).toLocaleDateString(i18n.language === 'es' ? 'es-US' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <h4 className="text-sm font-semibold text-[var(--color-navy)]">{event.name}</h4>
            </button>
          ))}
        </div>
      </div>

      {/* Limited Time Offers */}
      <div className="bg-white rounded-[14px] p-4 border border-gray-200">
        <h3 className="font-bold text-[var(--color-navy)] mb-4">{t('limitedTime')}</h3>
        <div className="space-y-3">
          {limitedOffers.slice(0, 2).map((offer) => (
            <div key={offer.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative">
                <img
                  src={offer.menu_item.image_url}
                  alt={offer.menu_item.name}
                  className="w-full h-24 object-cover"
                />
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  {offer.days_remaining}d
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-sm font-bold text-[var(--color-navy)] line-clamp-1">{offer.menu_item.name}</h4>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{offer.menu_item.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-500">{offer.vote_count} {t('votes')}</div>
                  <div className="text-xs font-semibold text-[var(--color-orange)]">
                    {offer.menu_item.calories} {t('cal')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
