
-- Store vital signs per user
CREATE TABLE public.vital_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  heart_rate integer,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  temperature numeric(4,1),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own vitals
CREATE POLICY "Users can insert own vitals"
ON public.vital_signs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own vitals
CREATE POLICY "Users can view own vitals"
ON public.vital_signs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Caregivers can view connected parents' vitals
CREATE POLICY "Caregivers can view connected parent vitals"
ON public.vital_signs FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT parent_id FROM public.caregiver_connections WHERE caregiver_id = auth.uid()
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vital_signs;
