
-- 1. Class level enum
DO $$ BEGIN
  CREATE TYPE public.class_level AS ENUM ('daycare','baby','middle','top');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Extend classes
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS level public.class_level,
  ADD COLUMN IF NOT EXISTS has_afternoon_session boolean NOT NULL DEFAULT false;

-- 3. Extend children
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS afternoon_session_enrolled boolean NOT NULL DEFAULT false;

-- 4. Seed standard classes if empty
INSERT INTO public.classes (class_name, level, age_group, has_afternoon_session)
SELECT * FROM (VALUES
  ('Daycare','daycare'::public.class_level,'1-2 yrs',true),
  ('Baby Class','baby'::public.class_level,'3 yrs',true),
  ('Middle Class','middle'::public.class_level,'4 yrs',true),
  ('Top Class','top'::public.class_level,'5-6 yrs',true)
) AS v(class_name, level, age_group, has_afternoon_session)
WHERE NOT EXISTS (SELECT 1 FROM public.classes);

-- 5. Attendance unique constraint for upsert
DO $$ BEGIN
  ALTER TABLE public.attendance ADD CONSTRAINT attendance_child_date_unique UNIQUE (child_id, date);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

-- 6. Fee templates table
CREATE TABLE IF NOT EXISTS public.fee_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  term text NOT NULL,
  academic_year text NOT NULL,
  tuition_amount numeric NOT NULL DEFAULT 0,
  meals_amount numeric NOT NULL DEFAULT 0,
  transport_amount numeric NOT NULL DEFAULT 0,
  afternoon_amount numeric NOT NULL DEFAULT 0,
  extras_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric GENERATED ALWAYS AS (tuition_amount + meals_amount + transport_amount + afternoon_amount + extras_amount) STORED,
  due_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE (class_id, term, academic_year)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_templates TO authenticated;
GRANT ALL ON public.fee_templates TO service_role;

ALTER TABLE public.fee_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view fee templates" ON public.fee_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage fee templates" ON public.fee_templates
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER fee_templates_updated_at BEFORE UPDATE ON public.fee_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Apply template function: creates/updates fee rows for every active child in the class
CREATE OR REPLACE FUNCTION public.apply_fee_template(_template_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.fee_templates%ROWTYPE;
  inserted_count integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only admins can apply fee templates';
  END IF;
  SELECT * INTO t FROM public.fee_templates WHERE id = _template_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Template not found'; END IF;

  WITH upserted AS (
    INSERT INTO public.fees (child_id, term, academic_year, tuition_amount, meals_amount, transport_amount, extras_amount, total_amount, due_date)
    SELECT
      c.id, t.term, t.academic_year,
      t.tuition_amount, t.meals_amount, t.transport_amount,
      t.extras_amount + (CASE WHEN c.afternoon_session_enrolled THEN t.afternoon_amount ELSE 0 END),
      t.tuition_amount + t.meals_amount + t.transport_amount + t.extras_amount + (CASE WHEN c.afternoon_session_enrolled THEN t.afternoon_amount ELSE 0 END),
      t.due_date
    FROM public.children c
    WHERE c.class_id = t.class_id AND c.status = 'active'
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO inserted_count FROM upserted;
  RETURN inserted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_fee_template(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.apply_fee_template(uuid) TO authenticated;

-- 8. children updated_at trigger if missing
DO $$ BEGIN
  CREATE TRIGGER children_updated_at BEFORE UPDATE ON public.children
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
