/*
  # Add DELETE RLS Policies for User Data

  ## Purpose
  Enables authenticated users to delete their own rows across all user-linked
  tables. Required for FERPA-compliant account deletion.

  ## Changes
  Adds DELETE policies on:
  1. users — delete own profile row
  2. user_swipes — delete own swipe history
  3. user_votes — delete own vote records
  4. theme_proposals — delete own theme proposals
  5. theme_upvotes — delete own upvotes
  6. rewards_transactions — delete own reward history
  7. smiles_sent — delete own smiles sent
  8. event_rsvps — policy already exists; guard with IF NOT EXISTS logic
  9. notifications — delete own notifications

  ## Security
  Every policy restricts deletion to rows owned by the calling authenticated user
  via auth.uid() = user_id (or id for the users table).
*/

-- users: delete own row
DROP POLICY IF EXISTS "Users can delete own account" ON users;
CREATE POLICY "Users can delete own account"
  ON users FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- user_swipes
DROP POLICY IF EXISTS "Users can delete own swipes" ON user_swipes;
CREATE POLICY "Users can delete own swipes"
  ON user_swipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- user_votes
DROP POLICY IF EXISTS "Users can delete own votes" ON user_votes;
CREATE POLICY "Users can delete own votes"
  ON user_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- theme_proposals
DROP POLICY IF EXISTS "Users can delete own theme proposals" ON theme_proposals;
CREATE POLICY "Users can delete own theme proposals"
  ON theme_proposals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- theme_upvotes
DROP POLICY IF EXISTS "Users can delete own theme upvotes" ON theme_upvotes;
CREATE POLICY "Users can delete own theme upvotes"
  ON theme_upvotes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- rewards_transactions
DROP POLICY IF EXISTS "Users can delete own rewards transactions" ON rewards_transactions;
CREATE POLICY "Users can delete own rewards transactions"
  ON rewards_transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- smiles_sent
DROP POLICY IF EXISTS "Users can delete own smiles" ON smiles_sent;
CREATE POLICY "Users can delete own smiles"
  ON smiles_sent FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- event_rsvps (may already have a delete policy from earlier migration)
DROP POLICY IF EXISTS "Users can delete own RSVPs" ON event_rsvps;
CREATE POLICY "Users can delete own RSVPs"
  ON event_rsvps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
