
CREATE TABLE public.exercise_reps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_type TEXT NOT NULL,
  rep_count INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercise_reps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reps"
  ON public.exercise_reps FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reps"
  ON public.exercise_reps FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Caregivers can view connected parent reps"
  ON public.exercise_reps FOR SELECT TO authenticated
  USING (user_id IN (
    SELECT parent_id FROM public.caregiver_connections
    WHERE caregiver_id = auth.uid()
  ));
