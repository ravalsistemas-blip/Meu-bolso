-- Supabase SQL Schema para Expense Tracker Pro
-- Execute este script no SQL Editor do Supabase Dashboard

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de renda mensal
CREATE TABLE IF NOT EXISTS public.monthly_income (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL, -- ex: "janeiro", "fevereiro"
    year INTEGER NOT NULL,
    salary DECIMAL(10,2) DEFAULT 0,
    extra_income DECIMAL(10,2) DEFAULT 0,
    total_income DECIMAL(10,2) GENERATED ALWAYS AS (salary + extra_income) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month, year)
);

-- Tabela de despesas
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('salary', 'extra')),
    expense_type TEXT NOT NULL CHECK (expense_type IN ('fixed', 'variable', 'investment')),
    investment_balance DECIMAL(10,2),
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico mensal consolidado
CREATE TABLE IF NOT EXISTS public.monthly_summary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    total_income DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_expenses DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_fixed_expenses DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_variable_expenses DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_investment_expenses DECIMAL(10,2) NOT NULL DEFAULT 0,
    remaining_income DECIMAL(10,2) GENERATED ALWAYS AS (total_income - total_expenses) STORED,
    salary_usage_percent DECIMAL(5,2) DEFAULT 0,
    extra_usage_percent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month, year)
);

-- Tabela de atividades/logs para auditoria
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    section TEXT NOT NULL, -- 'income', 'expense', 'investment', 'monthly', 'summary'
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'sync'
    description TEXT NOT NULL,
    amount DECIMAL(10,2),
    category TEXT,
    month TEXT,
    year INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias personalizadas (opcional)
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Inserir categorias padrão
INSERT INTO public.expense_categories (user_id, name, is_default) VALUES
    ('00000000-0000-0000-0000-000000000000', 'Alimentação', TRUE),
    ('00000000-0000-0000-0000-000000000000', 'Transporte', TRUE),
    ('00000000-0000-0000-0000-000000000000', 'Moradia', TRUE),
    ('00000000-0000-0000-0000-000000000000', 'Saúde', TRUE),
    ('00000000-0000-0000-0000-000000000000', 'Educação', TRUE),
    ('00000000-0000-0000-0000-000000000000', 'Lazer', TRUE),
    ('00000000-0000-0000-0000-000000000000', 'Roupas', TRUE),
    ('00000000-0000-0000-0000-000000000000', 'Investimentos', TRUE),
    ('00000000-0000-0000-0000-000000000000', 'Outros', TRUE)
ON CONFLICT (user_id, name) DO NOTHING;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_month_year ON public.expenses(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON public.expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_monthly_income_user_month_year ON public.monthly_income(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_monthly_summary_user_month_year ON public.monthly_summary(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON public.activity_logs(user_id, created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Monthly Income policies
CREATE POLICY "Users can view own monthly income" ON public.monthly_income
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly income" ON public.monthly_income
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly income" ON public.monthly_income
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly income" ON public.monthly_income
    FOR DELETE USING (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Users can view own expenses" ON public.expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Monthly Summary policies
CREATE POLICY "Users can view own monthly summary" ON public.monthly_summary
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly summary" ON public.monthly_summary
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly summary" ON public.monthly_summary
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly summary" ON public.monthly_summary
    FOR DELETE USING (auth.uid() = user_id);

-- Activity Logs policies
CREATE POLICY "Users can view own activity logs" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Expense Categories policies
CREATE POLICY "Users can view categories" ON public.expense_categories
    FOR SELECT USING (auth.uid() = user_id OR is_default = TRUE);

CREATE POLICY "Users can insert own categories" ON public.expense_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.expense_categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.expense_categories
    FOR DELETE USING (auth.uid() = user_id);

-- Funções para atualização automática de timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_income_updated_at
    BEFORE UPDATE ON public.monthly_income
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_summary_updated_at
    BEFORE UPDATE ON public.monthly_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para calcular resumo mensal automaticamente
CREATE OR REPLACE FUNCTION public.calculate_monthly_summary()
RETURNS TRIGGER AS $$
DECLARE
    user_uuid UUID;
    month_name TEXT;
    year_num INTEGER;
    income_data RECORD;
    expense_data RECORD;
BEGIN
    -- Determine user_id, month, year based on trigger table
    IF TG_TABLE_NAME = 'expenses' THEN
        user_uuid := COALESCE(NEW.user_id, OLD.user_id);
        month_name := COALESCE(NEW.month, OLD.month);
        year_num := COALESCE(NEW.year, OLD.year);
    ELSIF TG_TABLE_NAME = 'monthly_income' THEN
        user_uuid := COALESCE(NEW.user_id, OLD.user_id);
        month_name := COALESCE(NEW.month, OLD.month);
        year_num := COALESCE(NEW.year, OLD.year);
    END IF;
    
    -- Get income data
    SELECT 
        COALESCE(salary, 0) as salary,
        COALESCE(extra_income, 0) as extra_income,
        COALESCE(total_income, 0) as total_income
    INTO income_data
    FROM public.monthly_income 
    WHERE user_id = user_uuid AND month = month_name AND year = year_num;
    
    -- Get expense data
    SELECT 
        COALESCE(SUM(amount), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN expense_type = 'fixed' THEN amount ELSE 0 END), 0) as total_fixed,
        COALESCE(SUM(CASE WHEN expense_type = 'variable' THEN amount ELSE 0 END), 0) as total_variable,
        COALESCE(SUM(CASE WHEN expense_type = 'investment' THEN amount ELSE 0 END), 0) as total_investment,
        COALESCE(SUM(CASE WHEN payment_method = 'salary' THEN amount ELSE 0 END), 0) as salary_expenses,
        COALESCE(SUM(CASE WHEN payment_method = 'extra' THEN amount ELSE 0 END), 0) as extra_expenses
    INTO expense_data
    FROM public.expenses 
    WHERE user_id = user_uuid AND month = month_name AND year = year_num;
    
    -- Calculate usage percentages
    DECLARE
        salary_percent DECIMAL(5,2) := 0;
        extra_percent DECIMAL(5,2) := 0;
    BEGIN
        IF income_data.salary > 0 THEN
            salary_percent := (expense_data.salary_expenses / income_data.salary) * 100;
        END IF;
        
        IF income_data.extra_income > 0 THEN
            extra_percent := (expense_data.extra_expenses / income_data.extra_income) * 100;
        END IF;
        
        -- Upsert monthly summary
        INSERT INTO public.monthly_summary (
            user_id, 
            month, 
            year, 
            total_income, 
            total_expenses, 
            total_fixed_expenses, 
            total_variable_expenses, 
            total_investment_expenses,
            salary_usage_percent,
            extra_usage_percent
        ) VALUES (
            user_uuid, 
            month_name, 
            year_num, 
            COALESCE(income_data.total_income, 0), 
            COALESCE(expense_data.total_expenses, 0), 
            COALESCE(expense_data.total_fixed, 0), 
            COALESCE(expense_data.total_variable, 0), 
            COALESCE(expense_data.total_investment, 0),
            salary_percent,
            extra_percent
        )
        ON CONFLICT (user_id, month, year) 
        DO UPDATE SET
            total_income = EXCLUDED.total_income,
            total_expenses = EXCLUDED.total_expenses,
            total_fixed_expenses = EXCLUDED.total_fixed_expenses,
            total_variable_expenses = EXCLUDED.total_variable_expenses,
            total_investment_expenses = EXCLUDED.total_investment_expenses,
            salary_usage_percent = EXCLUDED.salary_usage_percent,
            extra_usage_percent = EXCLUDED.extra_usage_percent,
            updated_at = NOW();
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para recalcular resumo mensal
CREATE TRIGGER trigger_calculate_monthly_summary_expenses
    AFTER INSERT OR UPDATE OR DELETE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.calculate_monthly_summary();

CREATE TRIGGER trigger_calculate_monthly_summary_income
    AFTER INSERT OR UPDATE OR DELETE ON public.monthly_income
    FOR EACH ROW EXECUTE FUNCTION public.calculate_monthly_summary();

-- Views úteis
-- View para consolidar investimentos por nome
CREATE VIEW public.consolidated_investments AS
SELECT 
    user_id,
    month,
    year,
    name,
    category,
    payment_method,
    SUM(amount) as total_invested,
    MAX(investment_balance) as current_balance,
    COUNT(*) as transaction_count,
    MAX(date) as last_transaction_date
FROM public.expenses 
WHERE expense_type = 'investment'
GROUP BY user_id, month, year, name, category, payment_method
ORDER BY user_id, year DESC, month, name;

-- View para relatório mensal completo
CREATE VIEW public.monthly_report AS
SELECT 
    ms.user_id,
    ms.month,
    ms.year,
    ms.total_income,
    ms.total_expenses,
    ms.total_fixed_expenses,
    ms.total_variable_expenses,
    ms.total_investment_expenses,
    ms.remaining_income,
    ms.salary_usage_percent,
    ms.extra_usage_percent,
    mi.salary,
    mi.extra_income,
    COUNT(e.id) as total_transactions
FROM public.monthly_summary ms
LEFT JOIN public.monthly_income mi ON (
    ms.user_id = mi.user_id AND 
    ms.month = mi.month AND 
    ms.year = mi.year
)
LEFT JOIN public.expenses e ON (
    ms.user_id = e.user_id AND 
    ms.month = e.month AND 
    ms.year = e.year
)
GROUP BY 
    ms.user_id, ms.month, ms.year, ms.total_income, ms.total_expenses, 
    ms.total_fixed_expenses, ms.total_variable_expenses, ms.total_investment_expenses,
    ms.remaining_income, ms.salary_usage_percent, ms.extra_usage_percent,
    mi.salary, mi.extra_income
ORDER BY ms.user_id, ms.year DESC, ms.month;

-- Função para exportar dados em formato CSV
CREATE OR REPLACE FUNCTION public.export_monthly_data(
    p_user_id UUID,
    p_month TEXT,
    p_year INTEGER
)
RETURNS TABLE (
    tipo TEXT,
    nome TEXT,
    categoria TEXT,
    valor DECIMAL(10,2),
    forma_pagamento TEXT,
    saldo_investimento DECIMAL(10,2),
    data_transacao TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Return income data
    RETURN QUERY
    SELECT 
        'Receita'::TEXT as tipo,
        'Salário'::TEXT as nome,
        'Renda'::TEXT as categoria,
        mi.salary as valor,
        'Salário'::TEXT as forma_pagamento,
        NULL::DECIMAL(10,2) as saldo_investimento,
        mi.created_at as data_transacao
    FROM public.monthly_income mi
    WHERE mi.user_id = p_user_id AND mi.month = p_month AND mi.year = p_year AND mi.salary > 0
    
    UNION ALL
    
    SELECT 
        'Receita'::TEXT as tipo,
        'Renda Extra'::TEXT as nome,
        'Renda'::TEXT as categoria,
        mi.extra_income as valor,
        'Extra'::TEXT as forma_pagamento,
        NULL::DECIMAL(10,2) as saldo_investimento,
        mi.created_at as data_transacao
    FROM public.monthly_income mi
    WHERE mi.user_id = p_user_id AND mi.month = p_month AND mi.year = p_year AND mi.extra_income > 0
    
    UNION ALL
    
    -- Return expense data
    SELECT 
        CASE e.expense_type 
            WHEN 'investment' THEN 'Investimento'
            ELSE 'Despesa'
        END as tipo,
        e.name as nome,
        e.category as categoria,
        e.amount as valor,
        CASE e.payment_method 
            WHEN 'salary' THEN 'Salário'
            WHEN 'extra' THEN 'Renda Extra'
        END as forma_pagamento,
        e.investment_balance as saldo_investimento,
        e.date as data_transacao
    FROM public.expenses e
    WHERE e.user_id = p_user_id AND e.month = p_month AND e.year = p_year
    
    ORDER BY data_transacao;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários nas tabelas
COMMENT ON TABLE public.profiles IS 'Perfis dos usuários do sistema';
COMMENT ON TABLE public.monthly_income IS 'Renda mensal dos usuários (salário + renda extra)';
COMMENT ON TABLE public.expenses IS 'Despesas dos usuários (fixas, variáveis e investimentos)';
COMMENT ON TABLE public.monthly_summary IS 'Resumo mensal consolidado automaticamente calculado';
COMMENT ON TABLE public.activity_logs IS 'Log de atividades para auditoria e sincronização';
COMMENT ON TABLE public.expense_categories IS 'Categorias de despesas (padrão + personalizadas)';

COMMENT ON VIEW public.consolidated_investments IS 'View para consolidar investimentos por nome';
COMMENT ON VIEW public.monthly_report IS 'View para relatório mensal completo';

COMMENT ON FUNCTION public.export_monthly_data IS 'Função para exportar dados mensais em formato tabular para CSV';
