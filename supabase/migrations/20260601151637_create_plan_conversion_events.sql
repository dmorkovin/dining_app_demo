/*
  # Create plan_conversion_events table

  1. New Tables
    - `plan_conversion_events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `event_type` (text) — one of: card_shown, card_tapped, comparison_viewed, card_dismissed
      - `cumulative_orders_at_event` (integer) — order count at time of event
      - `cumulative_spend_at_event` (numeric) — total spend at time of event
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `plan_conversion_events` table
    - Add policy for authenticated users to insert their own events
    - Add policy for authenticated users to read their own events
*/

CREATE TABLE IF NOT EXISTS plan_conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  cumulative_orders_at_event integer NOT NULL DEFAULT 0,
  cumulative_spend_at_event numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plan_conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own plan conversion events"
  ON plan_conversion_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own plan conversion events"
  ON plan_conversion_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
