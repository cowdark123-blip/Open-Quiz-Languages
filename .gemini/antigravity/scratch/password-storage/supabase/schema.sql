-- Kích hoạt extension pgcrypto (nếu cần thiết cho UUID, dù Supabase có sẵn)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tạo bảng vaults
CREATE TABLE IF NOT EXISTS public.vaults (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vault_data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT vaults_user_id_key UNIQUE (user_id) -- Đảm bảo mỗi user chỉ có 1 vault
);

-- Bật Row Level Security (RLS) để tăng cường bảo mật
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;

-- Tạo Policy: Cho phép người dùng đọc vault của chính mình
CREATE POLICY "Users can view own vault" ON public.vaults
    FOR SELECT USING (auth.uid() = user_id);

-- Tạo Policy: Cho phép người dùng tạo vault của chính mình
CREATE POLICY "Users can insert own vault" ON public.vaults
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tạo Policy: Cho phép người dùng cập nhật vault của chính mình
CREATE POLICY "Users can update own vault" ON public.vaults
    FOR UPDATE USING (auth.uid() = user_id);

-- Tạo Policy: Cho phép người dùng xóa vault của chính mình
CREATE POLICY "Users can delete own vault" ON public.vaults
    FOR DELETE USING (auth.uid() = user_id);

-- Function để tự động cập nhật trường updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger để tự động chạy function update_modified_column trước khi UPDATE
CREATE TRIGGER update_vaults_updated_at
    BEFORE UPDATE ON public.vaults
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
