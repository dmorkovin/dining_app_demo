import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { formatEventDateTime } from './HomeTab';

type Event = Database['public']['Tables']['events']['Row'];

interface EventsTabProps {
  userId: string;
}

export function EventsTab({ userId }: EventsTabProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvpedEvents, setRsvpedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEvents();
    fetchUserRsvps();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    if (data) setEvents(data);
  };

  const fetchUserRsvps = async () => {
    const { data } = await supabase
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', userId);
    if (data) {
      setRsvpedEvents(new Set(data.map((rsvp) => rsvp.event_id)));
    }
  };

  const handleRSVP = async (eventId: string, currentlyRsvped: boolean) => {
    if (currentlyRsvped) {
      await supabase
        .from('event_rsvps')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId);

      await supabase.rpc('decrement_event_attendees', { event_id: eventId });

      setRsvpedEvents((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    } else {
      await supabase.from('event_rsvps').insert({
        user_id: userId,
        event_id: eventId,
      });

      await supabase
        .from('events')
        .update({ attendee_count: events.find((e) => e.id === eventId)!.attendee_count + 1 })
        .eq('id', eventId);

      setRsvpedEvents((prev) => new Set([...prev, eventId]));
    }

    fetchEvents();
  };

  return (
    <div className="pb-20 px-5 lg:px-6 pt-6">
      <h2 className="text-2xl lg:text-3xl font-bold text-[var(--color-navy)] mb-1">Events</h2>
      <p className="text-sm lg:text-base text-gray-600 mb-6">
        Join us for special dining experiences and community gatherings
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-6">
        {events.map((event) => {
          const isRsvped = rsvpedEvents.has(event.id);
          return (
            <div
              key={event.id}
              className="bg-white rounded-[14px] overflow-hidden card-shadow hover:shadow-lg transition-shadow"
            >
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.name}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-5">
                <h3 className="text-xl font-bold text-[var(--color-navy)] mb-2">{event.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-[var(--color-orange)]" />
                    {new Date(event.event_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-[var(--color-orange)]" />
                    {formatEventDateTime(event.event_date).time}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-[var(--color-orange)]" />
                      {event.location}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    <UserPlus className="w-4 h-4 inline mr-1" />
                    {event.attendee_count} attending
                  </span>
                  <button
                    onClick={() => handleRSVP(event.id, isRsvped)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isRsvped
                        ? 'bg-[var(--color-teal)] text-white hover:bg-teal-700'
                        : 'bg-[var(--color-orange)] text-white hover:bg-orange-600'
                    }`}
                  >
                    {isRsvped ? 'RSVP\'d' : 'RSVP'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
