/*
  # Update Events Table

  1. Changes
    - Add `event_date` column (timestamptz)
    - Add `location` column for event location
    - Add `title` column
    - Create function to decrement event attendees

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns if they don't exist
DO $$
BEGIN
  -- Add event_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'event_date'
  ) THEN
    ALTER TABLE events ADD COLUMN event_date timestamptz DEFAULT now();
  END IF;

  -- Add title column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'title'
  ) THEN
    ALTER TABLE events ADD COLUMN title text DEFAULT '';
    -- Copy from name if exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'events' AND column_name = 'name'
    ) THEN
      UPDATE events SET title = name WHERE name IS NOT NULL AND title = '';
    END IF;
  END IF;

  -- Add location column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'location'
  ) THEN
    ALTER TABLE events ADD COLUMN location text DEFAULT '';
  END IF;
END $$;

-- Update event_date with proper dates for existing events
UPDATE events SET event_date = '2026-04-12 18:00:00'::timestamptz WHERE title = '' AND date = 'April 12';
UPDATE events SET event_date = '2026-04-19 12:00:00'::timestamptz WHERE title = '' AND date = 'April 19';
UPDATE events SET event_date = '2026-04-26 11:00:00'::timestamptz WHERE title = '' AND date = 'April 26';
UPDATE events SET event_date = '2026-05-03 19:00:00'::timestamptz WHERE title = '' AND date = 'May 3';
UPDATE events SET event_date = '2026-05-10 17:00:00'::timestamptz WHERE title = '' AND date = 'May 10';

-- Create function to decrement event attendees
CREATE OR REPLACE FUNCTION decrement_event_attendees(event_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE events
  SET attendee_count = GREATEST(0, attendee_count - 1)
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
