-- ========================================================
-- OPENQUIZ AI - SUPABASE POSTGRESQL SCHEMA (MULTI-TENANT AUTHORIZATION)
-- ========================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'Học viên OpenQuiz',
  avatar_url TEXT,
  streak_count INT DEFAULT 1,
  target_band TEXT DEFAULT 'co_ban',
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
  )
  ON CONFLICT (id) DO NOTHING;
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
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

-- 4. USER SRS PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.user_srs_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  item_id UUID REFERENCES public.vocab_items(id) ON DELETE CASCADE NOT NULL,
  interval INT DEFAULT 1,
  repetition INT DEFAULT 0,
  ease_factor FLOAT DEFAULT 2.5,
  next_review_date TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  UNIQUE(user_id, item_id)
);

-- 5. SPEAKING SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.speaking_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  target_word_ids UUID[] NOT NULL DEFAULT '{}',
  scenario_prompt TEXT NOT NULL,
  audio_url TEXT,
  transcript TEXT,
  ai_feedback JSONB,
  pronunciation_scores JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - STRICT USER ISOLATION
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_srs_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, write own profile
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
CREATE POLICY "Profiles read policy" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles write policy" ON public.profiles;
CREATE POLICY "Profiles write policy" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Vocab Sets: Read own or public, Write own only
DROP POLICY IF EXISTS "Vocab Sets SELECT" ON public.vocab_sets;
CREATE POLICY "Vocab Sets SELECT" ON public.vocab_sets FOR SELECT USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Vocab Sets INSERT" ON public.vocab_sets;
CREATE POLICY "Vocab Sets INSERT" ON public.vocab_sets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vocab Sets UPDATE" ON public.vocab_sets;
CREATE POLICY "Vocab Sets UPDATE" ON public.vocab_sets FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vocab Sets DELETE" ON public.vocab_sets;
CREATE POLICY "Vocab Sets DELETE" ON public.vocab_sets FOR DELETE USING (auth.uid() = user_id);

-- Vocab Items: Read items of accessible sets, Write own sets' items
DROP POLICY IF EXISTS "Vocab Items SELECT" ON public.vocab_items;
CREATE POLICY "Vocab Items SELECT" ON public.vocab_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.vocab_sets
    WHERE public.vocab_sets.id = public.vocab_items.set_id
    AND (public.vocab_sets.user_id = auth.uid() OR public.vocab_sets.is_public = true)
  )
);

DROP POLICY IF EXISTS "Vocab Items ALL" ON public.vocab_items;
CREATE POLICY "Vocab Items ALL" ON public.vocab_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.vocab_sets
    WHERE public.vocab_sets.id = public.vocab_items.set_id
    AND public.vocab_sets.user_id = auth.uid()
  )
);

-- SRS Progress & Speaking Sessions: Strict User Ownership
DROP POLICY IF EXISTS "SRS Progress Own Access" ON public.user_srs_progress;
CREATE POLICY "SRS Progress Own Access" ON public.user_srs_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Speaking Sessions Own Access" ON public.speaking_sessions;
CREATE POLICY "Speaking Sessions Own Access" ON public.speaking_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. QUIZ RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  set_id UUID REFERENCES public.vocab_sets(id) ON DELETE CASCADE NOT NULL,
  score FLOAT NOT NULL,
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  wrong_answers INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quiz Results Own Access" ON public.quiz_results;
CREATE POLICY "Quiz Results Own Access" ON public.quiz_results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
