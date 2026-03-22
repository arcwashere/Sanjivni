
CREATE TABLE public.reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id uuid NOT NULL,
  caregiver_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  reminder_time timestamp with time zone,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their reminders"
  ON public.reminders FOR SELECT TO authenticated
  USING (auth.uid() = parent_id);

CREATE POLICY "Caregivers can view reminders they created"
  ON public.reminders FOR SELECT TO authenticated
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can insert reminders"
  ON public.reminders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can update reminders they created"
  ON public.reminders FOR UPDATE TO authenticated
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Parents can mark reminders complete"
  ON public.reminders FOR UPDATE TO authenticated
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);
