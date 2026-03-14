
CREATE POLICY "Parents can view other parent profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (role = 'parent');

CREATE POLICY "Parents can view all parent activities"
  ON public.daily_activities FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT user_id FROM public.profiles WHERE role = 'parent'
    )
  );
