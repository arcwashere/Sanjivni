
-- Drop overly permissive policies
DROP POLICY "Caregivers can view codes to validate" ON public.connection_codes;
DROP POLICY "Caregivers can update codes to mark used" ON public.connection_codes;

-- Replace with tighter policies: anyone authenticated can look up a code (needed for validation), but only unused/unexpired
CREATE POLICY "Authenticated users can view valid codes"
ON public.connection_codes FOR SELECT
TO authenticated
USING (is_used = false AND expires_at > now());

-- Only allow marking a code as used (not changing other fields)
CREATE POLICY "Authenticated users can mark codes as used"
ON public.connection_codes FOR UPDATE
TO authenticated
USING (is_used = false AND expires_at > now())
WITH CHECK (is_used = true);
