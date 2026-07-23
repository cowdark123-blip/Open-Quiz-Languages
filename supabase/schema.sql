-- ========================================================
-- OPENQUIZ AI - SUPABASE POSTGRESQL SCHEMA (PRODUCTION DATABASE)
-- ========================================================

-- 1. PROFILES TABLE (Linked with Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'Học viên OpenQuiz',
  avatar_url TEXT,
  streak_count INT DEFAULT 1,
  last_active_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. VOCAB SETS TABLE
CREATE TABLE IF NOT EXISTS public.vocab_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  title TEXT NOT NULL,
  description TEXT,
  target_language TEXT DEFAULT 'en',
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VOCAB ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.vocab_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID REFERENCES public.vocab_sets(id) ON DELETE CASCADE NOT NULL,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  ipa TEXT,
  example_sentence TEXT,
  vietnamese_translation TEXT,
  synonyms TEXT[] DEFAULT '{}',
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USER SRS PROGRESS TABLE (SuperMemo 2 Algorithm State)
CREATE TABLE IF NOT EXISTS public.user_srs_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  item_id UUID REFERENCES public.vocab_items(id) ON DELETE CASCADE NOT NULL,
  interval INT DEFAULT 1,
  repetition INT DEFAULT 0,
  ease_factor FLOAT DEFAULT 2.5,
  next_review_date TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ
);

-- 5. SPEAKING SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.speaking_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  target_word_ids UUID[] NOT NULL DEFAULT '{}',
  scenario_prompt TEXT NOT NULL,
  audio_url TEXT,
  transcript TEXT,
  ai_feedback JSONB,
  pronunciation_scores JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - OPEN ACCESS FOR DATABASE PERSISTENCE
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_srs_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for Database persistence
CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vocab_sets" ON public.vocab_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vocab_items" ON public.vocab_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on user_srs_progress" ON public.user_srs_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on speaking_sessions" ON public.speaking_sessions FOR ALL USING (true) WITH CHECK (true);
