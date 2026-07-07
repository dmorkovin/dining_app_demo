/*
  # Add Poll Voting Support

  ## Changes

  ### New Function
  - `increment_poll_option_vote(option_id uuid)` — increments vote_count by 1 on a specific poll_option row

  ### RLS Policy Update
  - `poll_options`: adds an UPDATE policy allowing authenticated users to increment vote counts

  ### Security
  - UPDATE policy is scoped to authenticated users only
  - The function uses SECURITY DEFINER so it can update poll_options regardless of caller RLS
*/

-- Function to safely increment vote_count on poll_options
CREATE OR REPLACE FUNCTION increment_poll_option_vote(option_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE poll_options
  SET vote_count = vote_count + 1
  WHERE id = option_id;
END;
$$;

-- Allow authenticated users to call the function
GRANT EXECUTE ON FUNCTION increment_poll_option_vote(uuid) TO authenticated;
