import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Staff = Database['public']['Tables']['staff']['Row'];

interface StaffTabProps {
  userId: string;
  onSendSmile: (staff: Staff) => void;
}

export function StaffTab({ userId, onSendSmile }: StaffTabProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [sentSmiles, setSentSmiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStaff();
    fetchSentSmiles();
  }, []);

  const fetchStaff = async () => {
    const { data } = await supabase
      .from('staff')
      .select('*')
      .order('name', { ascending: true });
    if (data) setStaff(data);
  };

  const fetchSentSmiles = async () => {
    const { data } = await supabase
      .from('smiles_sent')
      .select('staff_id')
      .eq('user_id', userId);
    if (data) {
      setSentSmiles(new Set(data.map((smile) => smile.staff_id)));
    }
  };

  return (
    <div className="pb-20 px-5 lg:px-6 pt-6">
      <h2 className="text-2xl lg:text-3xl font-bold text-[var(--color-navy)] mb-1">Our Team</h2>
      <p className="text-sm lg:text-base text-gray-600 mb-6">
        Meet the people who make your dining experience special
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
        {staff.map((member) => {
          const hasSentSmile = sentSmiles.has(member.id);
          return (
            <div
              key={member.id}
              className="bg-white rounded-[14px] overflow-hidden card-shadow hover:shadow-lg transition-shadow"
            >
              <div className="relative">
                <img
                  src={member.image_url || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'}
                  alt={member.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                  <span className="text-xs font-bold text-gray-700">{member.smile_count}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-[var(--color-navy)] mb-1">{member.name}</h3>
                <p className="text-sm text-[var(--color-orange)] font-semibold mb-3">{member.role}</p>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{member.bio}</p>
                <button
                  onClick={() => onSendSmile(member)}
                  disabled={hasSentSmile}
                  className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    hasSentSmile
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[var(--color-orange)] text-white hover:bg-orange-600'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${hasSentSmile ? 'fill-gray-400' : ''}`} />
                  {hasSentSmile ? 'Smile Sent' : 'Send a Smile'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
