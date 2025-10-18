-- File: supabase/schema.sql

-- User profile table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  native_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable row-level security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Supported languages
CREATE TABLE public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  flag_emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read languages" ON public.languages FOR SELECT USING (true);

-- Languages a user is learning
CREATE TABLE public.user_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  language_id UUID REFERENCES public.languages(id) ON DELETE CASCADE NOT NULL,
  proficiency_level TEXT DEFAULT 'beginner',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, language_id)
);

ALTER TABLE public.user_languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own languages" ON public.user_languages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Add language" ON public.user_languages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update language" ON public.user_languages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete language" ON public.user_languages FOR DELETE USING (auth.uid() = user_id);

-- Practice session history
CREATE TABLE public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  language_id UUID REFERENCES public.languages(id) ON DELETE CASCADE NOT NULL,
  session_type TEXT DEFAULT 'conversation',
  messages JSONB DEFAULT '[]'::jsonb,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own sessions" ON public.practice_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Create session" ON public.practice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update session" ON public.practice_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Vocabulary tracking
CREATE TABLE public.vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  language_id UUID REFERENCES public.languages(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  example_sentence TEXT,
  learned_at TIMESTAMPTZ DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ
);

ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own vocabulary" ON public.vocabulary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Add vocabulary" ON public.vocabulary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update vocabulary" ON public.vocabulary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete vocabulary" ON public.vocabulary FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed default languages
INSERT INTO public.languages (code, name, flag_emoji) VALUES
  ('en', 'English', '🇬🇧'),
  ('es', 'Spanish', '🇪🇸'),
  ('fr', 'French', '🇫🇷'),
  ('de', 'German', '🇩🇪'),
  ('it', 'Italian', '🇮🇹'),
  ('pt', 'Portuguese', '🇵🇹'),
  ('zh', 'Chinese', '🇨🇳'),
  ('ja', 'Japanese', '🇯🇵'),
  ('ko', 'Korean', '🇰🇷'),
  ('ar', 'Arabic', '🇸🇦');
