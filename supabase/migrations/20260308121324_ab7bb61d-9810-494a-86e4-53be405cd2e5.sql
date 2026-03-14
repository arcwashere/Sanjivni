
-- Notifications table for in-app alerts
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  related_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- System can insert notifications (via trigger)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger function: when vitals are inserted, notify connected caregivers
CREATE OR REPLACE FUNCTION public.notify_caregivers_on_vitals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_name text;
  caregiver record;
BEGIN
  SELECT full_name INTO parent_name FROM public.profiles WHERE user_id = NEW.user_id;
  
  FOR caregiver IN
    SELECT caregiver_id FROM public.caregiver_connections WHERE parent_id = NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, related_user_id)
    VALUES (
      caregiver.caregiver_id,
      'Vital Signs Updated',
      COALESCE(parent_name, 'Your connected parent') || '''s vitals have been updated. HR: ' || COALESCE(NEW.heart_rate::text, '--') || ' bpm, BP: ' || COALESCE(NEW.blood_pressure_systolic::text, '--') || '/' || COALESCE(NEW.blood_pressure_diastolic::text, '--') || ' mmHg',
      'vitals',
      NEW.user_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_vital_signs_insert
AFTER INSERT ON public.vital_signs
FOR EACH ROW
EXECUTE FUNCTION public.notify_caregivers_on_vitals();
