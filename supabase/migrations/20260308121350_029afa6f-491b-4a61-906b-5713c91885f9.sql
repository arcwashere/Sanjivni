
-- Drop the overly permissive policy
DROP POLICY "System can insert notifications" ON public.notifications;

-- The trigger function uses SECURITY DEFINER so it bypasses RLS.
-- For direct user inserts, restrict to own user_id
CREATE POLICY "Users can insert own notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
