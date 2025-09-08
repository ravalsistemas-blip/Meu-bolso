-- SEGURANÇA TOTAL - Versão Compatível
-- Script seguro que só trabalha com tabelas existentes

-- ================================
-- 1. LIMPAR POLÍTICAS PRINCIPAIS
-- ================================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Expenses
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

-- Monthly Income
DROP POLICY IF EXISTS "Users can view own monthly income" ON public.monthly_income;
DROP POLICY IF EXISTS "Users can insert own monthly income" ON public.monthly_income;
DROP POLICY IF EXISTS "Users can update own monthly income" ON public.monthly_income;
DROP POLICY IF EXISTS "Users can delete own monthly income" ON public.monthly_income;

-- Monthly Summary
DROP POLICY IF EXISTS "Users can view own monthly summary" ON public.monthly_summary;
DROP POLICY IF EXISTS "Users can insert own monthly summary" ON public.monthly_summary;
DROP POLICY IF EXISTS "Users can update own monthly summary" ON public.monthly_summary;
DROP POLICY IF EXISTS "Users can delete own monthly summary" ON public.monthly_summary;

-- Activity Logs
DROP POLICY IF EXISTS "Users can view own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.activity_logs;

-- ================================
-- 2. ATIVAR RLS NAS TABELAS PRINCIPAIS
-- ================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ================================
-- 3. POLÍTICAS ULTRA-RESTRITIVAS
-- ================================

-- PROFILES: Apenas dados próprios
CREATE POLICY "strict_profiles_select" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "strict_profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "strict_profiles_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "strict_profiles_delete" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- EXPENSES: Apenas despesas próprias
CREATE POLICY "strict_expenses_select" ON public.expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "strict_expenses_insert" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "strict_expenses_update" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "strict_expenses_delete" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- MONTHLY INCOME: Apenas renda própria
CREATE POLICY "strict_monthly_income_select" ON public.monthly_income
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "strict_monthly_income_insert" ON public.monthly_income
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "strict_monthly_income_update" ON public.monthly_income
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "strict_monthly_income_delete" ON public.monthly_income
    FOR DELETE USING (auth.uid() = user_id);

-- MONTHLY SUMMARY: Apenas resumos próprios
CREATE POLICY "strict_monthly_summary_select" ON public.monthly_summary
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "strict_monthly_summary_insert" ON public.monthly_summary
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "strict_monthly_summary_update" ON public.monthly_summary
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "strict_monthly_summary_delete" ON public.monthly_summary
    FOR DELETE USING (auth.uid() = user_id);

-- ACTIVITY LOGS: Apenas logs próprios
CREATE POLICY "strict_activity_logs_select" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "strict_activity_logs_insert" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================
-- 4. GARANTIR COLUNAS ADMIN
-- ================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] DEFAULT '{}';

-- ================================
-- 5. CONFIGURAR ADMIN ÚNICO
-- ================================

-- Criar/atualizar perfil admin
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    is_admin,
    admin_level,
    admin_permissions,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.email,
    'Cristiano Ramos Mendes',
    true,
    9,
    ARRAY['full_access', 'user_management', 'system_settings'],
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'novaradiosystem@outlook.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  )
ON CONFLICT (id) DO UPDATE SET
    is_admin = true,
    admin_level = 9,
    admin_permissions = ARRAY['full_access', 'user_management', 'system_settings'],
    updated_at = NOW();

-- ================================
-- 6. FUNÇÃO PARA NOVOS USUÁRIOS ISOLADOS
-- ================================

CREATE OR REPLACE FUNCTION public.create_isolated_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name,
        is_admin,
        admin_level,
        admin_permissions,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name',
        FALSE,  -- Nunca admin por padrão
        0,      -- Nível 0 por padrão
        '{}',   -- Sem permissões por padrão
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo e criar novo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_isolated ON auth.users;

CREATE TRIGGER on_auth_user_created_isolated
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.create_isolated_user_profile();

-- ================================
-- 7. VERIFICAÇÕES FINAIS
-- ================================

-- Verificar admin configurado
SELECT 
    'Admin configurado:' as info,
    id, 
    email, 
    full_name, 
    is_admin, 
    admin_level
FROM public.profiles 
WHERE email = 'novaradiosystem@outlook.com';

-- Verificar políticas ativas
SELECT 
    'Políticas de privacidade ativas:' as info,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE 'strict_%';

-- Verificar RLS habilitado
SELECT 
    'Tabelas com RLS:' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'expenses', 'monthly_income', 'monthly_summary', 'activity_logs')
ORDER BY tablename;

-- Status final
SELECT '🔒 PRIVACIDADE TOTAL ATIVADA! ✅
✓ Cada usuário vê APENAS seus próprios dados
✓ Políticas restritivas aplicadas
✓ Admin único configurado
✓ Novos usuários criados isolados' as status;
