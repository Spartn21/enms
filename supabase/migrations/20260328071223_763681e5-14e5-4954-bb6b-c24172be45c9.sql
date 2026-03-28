
-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'parent');
CREATE TYPE public.user_status AS ENUM ('active', 'inactive');
CREATE TYPE public.gender_type AS ENUM ('male', 'female');
CREATE TYPE public.child_status AS ENUM ('active', 'graduated', 'withdrawn');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE public.payment_method AS ENUM ('mobile_money', 'cash', 'bank');
CREATE TYPE public.payment_provider AS ENUM ('MTN', 'Airtel', 'N/A');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE public.meal_status AS ENUM ('consumed', 'partial', 'none');
CREATE TYPE public.nap_quality AS ENUM ('good', 'fair', 'poor', 'none');
CREATE TYPE public.mood_type AS ENUM ('happy', 'okay', 'upset', 'tired');
CREATE TYPE public.announcement_audience AS ENUM ('all', 'class', 'parents');

-- Schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  status public.user_status NOT NULL DEFAULT 'active',
  school_id UUID REFERENCES public.schools(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL,
  age_group TEXT,
  teacher_id UUID REFERENCES public.profiles(id),
  school_id UUID REFERENCES public.schools(id),
  capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Children table
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender public.gender_type,
  photo_url TEXT,
  medical_info TEXT,
  allergies TEXT,
  dietary_restrictions TEXT,
  special_needs TEXT,
  class_id UUID REFERENCES public.classes(id),
  school_id UUID REFERENCES public.schools(id),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status public.child_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Guardians table
CREATE TABLE public.guardians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_authorized_pickup BOOLEAN DEFAULT true,
  pickup_pin TEXT
);
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

-- Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.attendance_status NOT NULL DEFAULT 'present',
  check_in_time TIME,
  check_in_by UUID REFERENCES public.profiles(id),
  check_out_time TIME,
  check_out_by UUID REFERENCES public.profiles(id),
  guardian_id UUID REFERENCES public.guardians(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (child_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Fees table
CREATE TABLE public.fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  tuition_amount NUMERIC DEFAULT 0,
  meals_amount NUMERIC DEFAULT 0,
  transport_amount NUMERIC DEFAULT 0,
  extras_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

-- Payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_id UUID REFERENCES public.fees(id),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL,
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  transaction_reference TEXT,
  provider public.payment_provider DEFAULT 'N/A',
  status public.payment_status NOT NULL DEFAULT 'pending',
  received_by UUID REFERENCES public.profiles(id),
  receipt_number TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id),
  child_id UUID REFERENCES public.children(id),
  subject TEXT,
  message_body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  posted_by UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience public.announcement_audience NOT NULL DEFAULT 'all',
  class_id UUID REFERENCES public.classes(id),
  school_id UUID REFERENCES public.schools(id),
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Activity logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES public.profiles(id),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_breakfast public.meal_status,
  meal_lunch public.meal_status,
  meal_snack public.meal_status,
  nap_duration INTEGER,
  nap_quality public.nap_quality,
  activities_description TEXT,
  bathroom_notes TEXT,
  behavior_notes TEXT,
  health_notes TEXT,
  mood public.mood_type,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (child_id, log_date)
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  -- Insert role from metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'parent')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON public.children FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles: users can read all profiles in their school, update own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User roles: users can read own role
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Schools
CREATE POLICY "Authenticated users can view schools" ON public.schools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage schools" ON public.schools FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Classes
CREATE POLICY "Authenticated users can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage classes" ON public.classes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Children
CREATE POLICY "Admins can manage children" ON public.children FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers see their class children" ON public.children FOR SELECT USING (
  class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
);
CREATE POLICY "Parents see own children" ON public.children FOR SELECT USING (
  id IN (SELECT child_id FROM public.guardians WHERE user_id = auth.uid())
);

-- Guardians
CREATE POLICY "Admins can manage guardians" ON public.guardians FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents can view own guardian records" ON public.guardians FOR SELECT USING (user_id = auth.uid());

-- Attendance
CREATE POLICY "Admins can manage attendance" ON public.attendance FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can manage attendance for their class" ON public.attendance FOR ALL USING (
  child_id IN (SELECT c.id FROM public.children c JOIN public.classes cl ON c.class_id = cl.id WHERE cl.teacher_id = auth.uid())
);
CREATE POLICY "Parents can view own children attendance" ON public.attendance FOR SELECT USING (
  child_id IN (SELECT child_id FROM public.guardians WHERE user_id = auth.uid())
);

-- Fees
CREATE POLICY "Admins can manage fees" ON public.fees FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents can view own children fees" ON public.fees FOR SELECT USING (
  child_id IN (SELECT child_id FROM public.guardians WHERE user_id = auth.uid())
);

-- Payments
CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents can view own payments" ON public.payments FOR SELECT USING (
  child_id IN (SELECT child_id FROM public.guardians WHERE user_id = auth.uid())
);
CREATE POLICY "Parents can insert payments" ON public.payments FOR INSERT WITH CHECK (
  child_id IN (SELECT child_id FROM public.guardians WHERE user_id = auth.uid())
);

-- Messages
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own received messages" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);

-- Announcements
CREATE POLICY "Authenticated users can view announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Activity logs
CREATE POLICY "Admins can manage activity logs" ON public.activity_logs FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can manage activity logs for their class" ON public.activity_logs FOR ALL USING (
  child_id IN (SELECT c.id FROM public.children c JOIN public.classes cl ON c.class_id = cl.id WHERE cl.teacher_id = auth.uid())
);
CREATE POLICY "Parents can view own children activity logs" ON public.activity_logs FOR SELECT USING (
  child_id IN (SELECT child_id FROM public.guardians WHERE user_id = auth.uid())
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
