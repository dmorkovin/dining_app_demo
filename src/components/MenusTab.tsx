import { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type WeeklyMenu = Database['public']['Tables']['weekly_menus']['Row'];
type User = Database['public']['Tables']['users']['Row'];

interface MenusTabProps {
  userId: string;
}

export function MenusTab({ userId }: MenusTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('calendar');
  const [weeklyMenus, setWeeklyMenus] = useState<WeeklyMenu[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [allergenToggles, setAllergenToggles] = useState({
    nuts: false,
    dairy: false,
    gluten: false,
    soy: false,
    fish: false,
    shellfish: false,
  });

  useEffect(() => {
    if (activeSubTab === 'calendar') {
      fetchWeeklyMenus();
    } else if (activeSubTab === 'allergens') {
      fetchUserAllergens();
    }
  }, [activeSubTab]);

  const fetchWeeklyMenus = async () => {
    const { data } = await supabase
      .from('weekly_menus')
      .select('*')
      .order('day_number', { ascending: true });

    if (data) setWeeklyMenus(data);
  };

  const fetchUserAllergens = async () => {
    const { data } = await supabase
      .from('users')
      .select('dietary_alerts')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      const alerts = data.dietary_alerts || [];
      setAllergenToggles({
        nuts: alerts.includes('Nuts'),
        dairy: alerts.includes('Dairy'),
        gluten: alerts.includes('Gluten'),
        soy: alerts.includes('Soy'),
        fish: alerts.includes('Fish'),
        shellfish: alerts.includes('Shellfish'),
      });
    }
  };

  const handleAllergenToggle = async (allergen: keyof typeof allergenToggles) => {
    const newToggles = { ...allergenToggles, [allergen]: !allergenToggles[allergen] };
    setAllergenToggles(newToggles);

    const alerts = Object.entries(newToggles)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));

    await supabase
      .from('users')
      .update({ dietary_alerts: alerts })
      .eq('id', userId);
  };

  return (
    <div className="pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex">
          {['calendar', 'allergens'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold capitalize relative transition-colors ${
                activeSubTab === tab
                  ? 'text-[var(--color-orange)]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {activeSubTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-orange)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 lg:px-6 pt-4">
        {activeSubTab === 'calendar' && (
          <>
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-1">This Week</h2>
            <p className="text-sm text-gray-600 mb-6 pb-4 border-b border-gray-200">5-day dining schedule</p>

            <div className="space-y-3 pb-6">
              {weeklyMenus.map((menu) => (
                <div
                  key={menu.id}
                  className={`bg-white rounded-[14px] card-shadow overflow-hidden transition-all ${
                    menu.is_today ? 'ring-2 ring-[var(--color-orange)]' : ''
                  }`}
                >
                  <button
                    onClick={() => setExpandedDay(expandedDay === menu.id ? null : menu.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-serif font-bold text-[var(--color-orange)]">
                          {menu.day_number}
                        </div>
                        <div className="text-xs text-gray-500 uppercase">{menu.day_name}</div>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-[var(--color-navy)]">
                          {menu.main_dish}
                        </div>
                        <div className="text-sm text-gray-600 mt-0.5">{menu.side_dish}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {menu.is_today && (
                        <span className="text-xs font-bold text-[var(--color-orange)] bg-orange-50 px-2 py-1 rounded">
                          TODAY
                        </span>
                      )}
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedDay === menu.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {expandedDay === menu.id && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      <div className="space-y-2">
                        {(menu.items as Array<{ name: string; calories: number }>).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-navy)]">{item.name}</span>
                            <span className="text-sm text-gray-500">{item.calories} cal</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeSubTab === 'allergens' && (
          <>
            <h2 className="text-2xl lg:text-3xl font-bold text-[var(--color-navy)] mb-1">Allergen Alerts</h2>
            <p className="text-sm lg:text-base text-gray-600 mb-6">
              Enable alerts for items containing these allergens
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
              {Object.entries(allergenToggles).map(([allergen, enabled]) => (
                <div
                  key={allergen}
                  className="bg-white rounded-[14px] p-4 card-shadow flex items-center justify-between"
                >
                  <span className="font-semibold text-[var(--color-navy)] capitalize">
                    {allergen}
                  </span>
                  <button
                    onClick={() => handleAllergenToggle(allergen as keyof typeof allergenToggles)}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      enabled ? 'bg-[var(--color-orange)]' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                        enabled ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded-[14px] p-4 col-span-2 lg:col-span-3">
                <p className="text-sm text-blue-900">
                  We'll notify you when menu items contain your selected allergens and highlight them in our menus.
                </p>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
