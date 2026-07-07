CREATE TABLE public.general_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  category text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.general_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_general_feedback" ON public.general_feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_general_feedback" ON public.general_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX general_feedback_user_id_idx ON public.general_feedback (user_id, created_at DESC);