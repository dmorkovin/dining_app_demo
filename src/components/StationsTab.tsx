import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isStationOpen } from '../lib/stationHours';
import type { Database } from '../lib/database.types';

type Station = Database['public']['Tables']['stations']['Row'];

export function StationsTab() {
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    const { data } = await supabase
      .from('stations')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (data) setStations(data);
  };

  return (
    <div className="pb-20 px-5 lg:px-6 pt-6">
      <h2 className="text-2xl lg:text-3xl font-bold text-[var(--color-navy)] mb-1">Dining Stations</h2>
      <p className="text-sm lg:text-base text-gray-600 mb-6">
        Stations designed to reflect campus culture, build community, and bring the dining experience to life
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-6">
        {stations.map((station) => {
          const { isOpen, todayHours } = isStationOpen(station.hours as Parameters<typeof isStationOpen>[0]);
          return (
            <div
              key={station.id}
              className="bg-white rounded-[14px] p-5 card-shadow hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">
                {station.logo_url ? (
                  <img
                    src={station.logo_url}
                    alt={station.name}
                    className="h-16 w-auto"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                ) : null}
                <div className="text-4xl" style={{ display: station.logo_url ? 'none' : 'block' }}>{station.icon}</div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isOpen
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {isOpen ? 'Open Now' : 'Closed'}
                </span>
                <span className="text-xs text-gray-500">{todayHours}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {station.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
