
-- 1. child_access_requests table
CREATE TABLE public.child_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT 'Parent',
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_access_requests TO authenticated;
GRANT ALL ON public.child_access_requests TO service_role;

ALTER TABLE public.child_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents create own requests"
  ON public.child_access_requests FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents view own requests"
  ON public.child_access_requests FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update requests"
  ON public.child_access_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete requests"
  ON public.child_access_requests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_child_access_requests_updated_at
  BEFORE UPDATE ON public.child_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Trigger to create guardian link on approval
CREATE OR REPLACE FUNCTION public.handle_access_request_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.guardians (user_id, child_id, relationship, is_primary, is_authorized_pickup)
    VALUES (NEW.parent_id, NEW.child_id, NEW.relationship, true, true)
    ON CONFLICT DO NOTHING;
    NEW.reviewed_at := now();
    NEW.reviewed_by := COALESCE(NEW.reviewed_by, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_access_request_approval
  BEFORE UPDATE ON public.child_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_access_request_approval();

-- 3. Public directory view (no PII)
CREATE OR REPLACE VIEW public.children_directory
WITH (security_invoker = on) AS
SELECT
  c.id,
  c.first_name,
  LEFT(c.last_name, 1) AS last_initial,
  cl.class_name
FROM public.children c
LEFT JOIN public.classes cl ON cl.id = c.class_id
WHERE c.status = 'active';

GRANT SELECT ON public.children_directory TO authenticated;

-- Allow authenticated parents to SELECT minimal child rows through the view by adding a permissive SELECT for the view query path.
-- Since security_invoker=on, the view runs with caller privileges; parents need to be able to read children rows.
-- Add a SELECT policy on children for authenticated users restricted to no-PII context isn't trivial; instead use a SECURITY DEFINER RPC.

DROP VIEW IF EXISTS public.children_directory;

CREATE OR REPLACE FUNCTION public.get_children_directory()
RETURNS TABLE(id uuid, first_name text, last_initial text, class_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.first_name, LEFT(c.last_name, 1), cl.class_name
  FROM public.children c
  LEFT JOIN public.classes cl ON cl.id = c.class_id
  WHERE c.status = 'active'
  ORDER BY c.first_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_children_directory() TO authenticated;

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.child_access_requests;
