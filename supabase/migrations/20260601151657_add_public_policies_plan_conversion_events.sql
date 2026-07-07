/*
  # Add public access policies for plan_conversion_events

  This migration adds public insert/select policies to support the demo user
  who may not be authenticated via Supabase Auth.

  1. Security Changes
    - Add public insert policy for plan_conversion_events
    - Add public select policy for plan_conversion_events
*/

CREATE POLICY "Public can insert plan conversion events"
  ON plan_conversion_events
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can read plan conversion events"
  ON plan_conversion_events
  FOR SELECT
  TO public
  USING (true);
