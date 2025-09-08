-- ================================
-- HABILITAR REAL-TIME NO SUPABASE
-- ================================

-- Verificar quais tabelas já estão na publicação
SELECT 
    schemaname,
    tablename,
    'Já habilitado' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
ORDER BY tablename;

-- Habilitar Real-time apenas nas tabelas que ainda não estão na publicação
-- Usar DO block para verificar antes de adicionar

DO $$
BEGIN
    -- 1. PROFILES - Mudanças no perfil em tempo real
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
        RAISE NOTICE 'Profiles adicionado ao real-time';
    ELSE
        RAISE NOTICE 'Profiles já estava no real-time';
    END IF;

    -- 2. EXPENSES - Despesas atualizadas instantaneamente
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'expenses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
        RAISE NOTICE 'Expenses adicionado ao real-time';
    ELSE
        RAISE NOTICE 'Expenses já estava no real-time';
    END IF;

    -- 3. MONTHLY INCOME - Renda atualizada em tempo real
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'monthly_income'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_income;
        RAISE NOTICE 'Monthly_income adicionado ao real-time';
    ELSE
        RAISE NOTICE 'Monthly_income já estava no real-time';
    END IF;

    -- 4. MONTHLY SUMMARY - Resumos calculados instantaneamente
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'monthly_summary'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_summary;
        RAISE NOTICE 'Monthly_summary adicionado ao real-time';
    ELSE
        RAISE NOTICE 'Monthly_summary já estava no real-time';
    END IF;

    -- 5. ACTIVITY LOGS - Logs de atividade em tempo real
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'activity_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
        RAISE NOTICE 'Activity_logs adicionado ao real-time';
    ELSE
        RAISE NOTICE 'Activity_logs já estava no real-time';
    END IF;
END $$;

-- ================================
-- CONFIGURAR FILTROS RLS PARA REAL-TIME
-- ================================

-- O Real-time respeita as políticas RLS que já configuramos
-- Cada usuário só receberá updates dos seus próprios dados

-- ================================
-- VERIFICAR CONFIGURAÇÃO
-- ================================

-- Listar tabelas com Real-time habilitado
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

-- Status
SELECT 'Real-time habilitado com sucesso! 🚀
✓ Mudanças em tempo real ativadas
✓ Sincronização instantânea
✓ Respeitando políticas de privacidade' as status;
