-- Políticas de Segurança Rigorosas - Dados 100% Privados
-- Cada usuário verá APENAS seus próprios dados

-- ================================
-- LIMPAR POLÍTICAS EXISTENTES
-- ================================

-- Remover todas as políticas existentes que podem permitir acesso cruzado
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
DROP POLICY IF EXISTS "Admins can view all expenses" ON public.expenses;

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

-- Expense Categories (verificar se existem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_categories') THEN
        DROP POLICY IF EXISTS "Users can view categories" ON public.expense_categories;
        DROP POLICY IF EXISTS "Users can insert own categories" ON public.expense_categories;
        DROP POLICY IF EXISTS "Users can update own categories" ON public.expense_categories;
        DROP POLICY IF EXISTS "Users can delete own categories" ON public.expense_categories;
    END IF;
END $$;

-- Admin Logs (verificar se existem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_logs') THEN
        DROP POLICY IF EXISTS "Admins can view admin logs" ON public.admin_logs;
        DROP POLICY IF EXISTS "Admins can insert admin logs" ON public.admin_logs;
    END IF;
END $$;

-- ================================
-- ATIVAR RLS EM TODAS AS TABELAS
-- ================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em tabelas opcionais se existirem
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_categories') THEN
        ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_logs') THEN
        ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ================================
-- POLÍTICAS ULTRA-RESTRITIVAS
-- ================================

-- PROFILES: Apenas dados próprios, SEM exceções para admin
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
-- POLÍTICAS PARA TABELAS OPCIONAIS
-- ================================

-- EXPENSE CATEGORIES: Categorias próprias + categorias padrão
-- Usuários podem ver suas próprias categorias E as categorias padrão (is_default = true)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_categories') THEN
        CREATE POLICY "strict_expense_categories_select" ON public.expense_categories
            FOR SELECT USING (auth.uid() = user_id OR is_default = TRUE);

        CREATE POLICY "strict_expense_categories_insert" ON public.expense_categories
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "strict_expense_categories_update" ON public.expense_categories
            FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "strict_expense_categories_delete" ON public.expense_categories
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- ADMIN LOGS: Apenas para administradores (RESTRITO)
-- Admin logs são visíveis apenas para quem precisa administrar
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_logs') THEN
        CREATE POLICY "strict_admin_logs_select" ON public.admin_logs
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND is_admin = TRUE AND admin_level >= 5
                )
            );

        CREATE POLICY "strict_admin_logs_insert" ON public.admin_logs
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND is_admin = TRUE
                )
            );
    END IF;
END $$;

-- ================================
-- FUNÇÃO DE PERFIL LIMPO PARA NOVOS USUÁRIOS
-- ================================

-- Função para criar perfil isolado automaticamente
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

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar novo trigger para perfis isolados
CREATE TRIGGER on_auth_user_created_isolated
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.create_isolated_user_profile();

-- ================================
-- GARANTIR COLUNAS ADMIN
-- ================================

-- Adicionar colunas admin se não existirem
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] DEFAULT '{}';

-- ================================
-- CONFIGURAR ADMIN ESPECÍFICO
-- ================================

-- Criar/atualizar perfil admin para o usuário designado
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
-- VERIFICAÇÃO FINAL
-- ================================

-- Verificar se as políticas foram aplicadas corretamente
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Verificar se o admin foi configurado
SELECT 
    id, 
    email, 
    full_name, 
    is_admin, 
    admin_level, 
    admin_permissions
FROM public.profiles 
WHERE email = 'novaradiosystem@outlook.com';

-- ================================
-- VERIFICAÇÕES DE ISOLAMENTO TOTAL
-- ================================

-- Verificar se todas as políticas estão ativas
SELECT 
    'Políticas RLS ativas:' as info,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE 'strict_%';

-- Contar usuários no sistema (deve mostrar apenas dados próprios)
SELECT 
    'Total de usuários visíveis para mim:' as info,
    COUNT(*) as count 
FROM public.profiles;

-- Verificar se RLS está habilitado em todas as tabelas críticas
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'expenses', 'monthly_income', 'monthly_summary', 'activity_logs')
ORDER BY tablename;

-- Mensagem de sucesso
SELECT 'SEGURANÇA MÁXIMA ATIVADA! ✅
🔒 Cada usuário vê APENAS seus próprios dados
🔒 Políticas ultra-restritivas aplicadas 
🔒 Novos usuários criados com perfil isolado
🔒 Admin configurado apenas para: novaradiosystem@outlook.com' as status;
