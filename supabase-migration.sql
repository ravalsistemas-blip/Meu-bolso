-- Migration script to update existing Supabase database
-- Use this if you already have data and want to add new features

-- Check if tables exist and create them if they don't
DO $$
BEGIN
    -- Create expenses table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
        CREATE TABLE public.expenses (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
    ELSE
        -- Add missing columns to existing table
        ALTER TABLE public.expenses 
        ADD COLUMN IF NOT EXISTS month TEXT,
        ADD COLUMN IF NOT EXISTS year INTEGER,
        ADD COLUMN IF NOT EXISTS expense_type TEXT;

        -- Update expense_type column if it exists but is empty
        UPDATE public.expenses 
        SET expense_type = type 
        WHERE expense_type IS NULL AND type IS NOT NULL;

        -- Add constraints if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.check_constraints 
            WHERE constraint_name = 'expenses_expense_type_check'
        ) THEN
            ALTER TABLE public.expenses 
            ADD CONSTRAINT expenses_expense_type_check 
            CHECK (expense_type IN ('fixed', 'variable', 'investment'));
        END IF;
    END IF;

    -- Create income table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'income') THEN
        CREATE TABLE public.income (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            salary DECIMAL(10,2) DEFAULT 0,
            extra_income DECIMAL(10,2) DEFAULT 0,
            month TEXT NOT NULL,
            year INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, month, year)
        );
    END IF;

    -- Create monthly_income table if it doesn't exist (new structure)
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monthly_income') THEN
        CREATE TABLE public.monthly_income (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            month TEXT NOT NULL,
            year INTEGER NOT NULL,
            salary DECIMAL(10,2) DEFAULT 0,
            extra_income DECIMAL(10,2) DEFAULT 0,
            total_income DECIMAL(10,2) GENERATED ALWAYS AS (salary + extra_income) STORED,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, month, year)
        );
    END IF;

    -- Create profiles table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
            id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Create new tables if they don't exist
CREATE TABLE IF NOT EXISTS public.monthly_summary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    section TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2),
    category TEXT,
    month TEXT,
    year INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrate data from old structure to new structure
-- Update month/year in expenses based on date (only if data exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
        -- Check if there are any rows with NULL month/year
        IF EXISTS (SELECT 1 FROM public.expenses WHERE month IS NULL OR year IS NULL) THEN
            UPDATE public.expenses 
            SET 
                month = CASE EXTRACT(MONTH FROM date::timestamp)
                    WHEN 1 THEN 'janeiro'
                    WHEN 2 THEN 'fevereiro'
                    WHEN 3 THEN 'março'
                    WHEN 4 THEN 'abril'
                    WHEN 5 THEN 'maio'
                    WHEN 6 THEN 'junho'
                    WHEN 7 THEN 'julho'
                    WHEN 8 THEN 'agosto'
                    WHEN 9 THEN 'setembro'
                    WHEN 10 THEN 'outubro'
                    WHEN 11 THEN 'novembro'
                    WHEN 12 THEN 'dezembro'
                END,
                year = EXTRACT(YEAR FROM date::timestamp)
            WHERE month IS NULL OR year IS NULL;
        END IF;
    END IF;
END $$;

-- Enable RLS on all tables
DO $$
BEGIN
    -- Enable RLS on existing tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
        ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'income') THEN
        ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monthly_income') THEN
        ALTER TABLE public.monthly_income ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on new tables
    ALTER TABLE public.monthly_summary ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
END $$;

-- Add RLS policies for all tables (with safety checks)
DO $$
BEGIN
    -- Policies for expenses table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'Users can view own expenses') THEN
            CREATE POLICY "Users can view own expenses" ON public.expenses
                FOR SELECT USING (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'Users can insert own expenses') THEN
            CREATE POLICY "Users can insert own expenses" ON public.expenses
                FOR INSERT WITH CHECK (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'Users can update own expenses') THEN
            CREATE POLICY "Users can update own expenses" ON public.expenses
                FOR UPDATE USING (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'Users can delete own expenses') THEN
            CREATE POLICY "Users can delete own expenses" ON public.expenses
                FOR DELETE USING (auth.uid() = user_id);
        END IF;
    END IF;

    -- Policies for income table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'income') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'income' AND policyname = 'Users can view own income') THEN
            CREATE POLICY "Users can view own income" ON public.income
                FOR SELECT USING (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'income' AND policyname = 'Users can insert own income') THEN
            CREATE POLICY "Users can insert own income" ON public.income
                FOR INSERT WITH CHECK (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'income' AND policyname = 'Users can update own income') THEN
            CREATE POLICY "Users can update own income" ON public.income
                FOR UPDATE USING (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'income' AND policyname = 'Users can delete own income') THEN
            CREATE POLICY "Users can delete own income" ON public.income
                FOR DELETE USING (auth.uid() = user_id);
        END IF;
    END IF;

    -- Policies for monthly_income table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monthly_income') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'monthly_income' AND policyname = 'Users can view own monthly income') THEN
            CREATE POLICY "Users can view own monthly income" ON public.monthly_income
                FOR SELECT USING (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'monthly_income' AND policyname = 'Users can insert own monthly income') THEN
            CREATE POLICY "Users can insert own monthly income" ON public.monthly_income
                FOR INSERT WITH CHECK (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'monthly_income' AND policyname = 'Users can update own monthly income') THEN
            CREATE POLICY "Users can update own monthly income" ON public.monthly_income
                FOR UPDATE USING (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'monthly_income' AND policyname = 'Users can delete own monthly income') THEN
            CREATE POLICY "Users can delete own monthly income" ON public.monthly_income
                FOR DELETE USING (auth.uid() = user_id);
        END IF;
    END IF;

    -- Policies for profiles table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
            CREATE POLICY "Users can view own profile" ON public.profiles
                FOR SELECT USING (auth.uid() = id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
            CREATE POLICY "Users can update own profile" ON public.profiles
                FOR UPDATE USING (auth.uid() = id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
            CREATE POLICY "Users can insert own profile" ON public.profiles
                FOR INSERT WITH CHECK (auth.uid() = id);
        END IF;
    END IF;
END $$;

-- Policies for new tables (monthly_summary and activity_logs)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'monthly_summary' AND policyname = 'Users can view own monthly summary') THEN
        CREATE POLICY "Users can view own monthly summary" ON public.monthly_summary
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'monthly_summary' AND policyname = 'Users can insert own monthly summary') THEN
        CREATE POLICY "Users can insert own monthly summary" ON public.monthly_summary
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'monthly_summary' AND policyname = 'Users can update own monthly summary') THEN
        CREATE POLICY "Users can update own monthly summary" ON public.monthly_summary
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'monthly_summary' AND policyname = 'Users can delete own monthly summary') THEN
        CREATE POLICY "Users can delete own monthly summary" ON public.monthly_summary
            FOR DELETE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'Users can view own activity logs') THEN
        CREATE POLICY "Users can view own activity logs" ON public.activity_logs
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'Users can insert own activity logs') THEN
        CREATE POLICY "Users can insert own activity logs" ON public.activity_logs
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Add triggers for new tables (with safety checks)
DO $$
BEGIN
    -- Create update_updated_at_column function if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ language 'plpgsql';
    END IF;
    
    -- Add trigger for monthly_summary
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_monthly_summary_updated_at') THEN
        CREATE TRIGGER update_monthly_summary_updated_at
            BEFORE UPDATE ON public.monthly_summary
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Add triggers for other tables if they exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_expenses_updated_at') THEN
            CREATE TRIGGER update_expenses_updated_at
                BEFORE UPDATE ON public.expenses
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'income') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_income_updated_at') THEN
            CREATE TRIGGER update_income_updated_at
                BEFORE UPDATE ON public.income
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monthly_income') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_monthly_income_updated_at') THEN
            CREATE TRIGGER update_monthly_income_updated_at
                BEFORE UPDATE ON public.monthly_income
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
            CREATE TRIGGER update_profiles_updated_at
                BEFORE UPDATE ON public.profiles
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

-- Create the calculation function and triggers (with safety checks)
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
    ELSIF TG_TABLE_NAME = 'income' THEN
        user_uuid := COALESCE(NEW.user_id, OLD.user_id);
        month_name := COALESCE(NEW.month, OLD.month);
        year_num := COALESCE(NEW.year, OLD.year);
    ELSIF TG_TABLE_NAME = 'monthly_income' THEN
        user_uuid := COALESCE(NEW.user_id, OLD.user_id);
        month_name := COALESCE(NEW.month, OLD.month);
        year_num := COALESCE(NEW.year, OLD.year);
    END IF;
    
    -- Get income data (try new table first, then old table)
    SELECT 
        COALESCE(salary, 0) as salary,
        COALESCE(extra_income, 0) as extra_income,
        COALESCE(salary + extra_income, 0) as total_income
    INTO income_data
    FROM public.monthly_income 
    WHERE user_id = user_uuid AND month = month_name AND year = year_num;
    
    -- If no data in new table, try old table
    IF income_data.total_income = 0 AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'income') THEN
        SELECT 
            COALESCE(salary, 0) as salary,
            COALESCE(extra_income, 0) as extra_income,
            COALESCE(salary + extra_income, 0) as total_income
        INTO income_data
        FROM public.income 
        WHERE user_id = user_uuid AND month = month_name AND year = year_num;
    END IF;
    
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

-- Create triggers if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_calculate_monthly_summary_expenses') THEN
        CREATE TRIGGER trigger_calculate_monthly_summary_expenses
            AFTER INSERT OR UPDATE OR DELETE ON public.expenses
            FOR EACH ROW EXECUTE FUNCTION public.calculate_monthly_summary();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_calculate_monthly_summary_income') THEN
        CREATE TRIGGER trigger_calculate_monthly_summary_income
            AFTER INSERT OR UPDATE OR DELETE ON public.income
            FOR EACH ROW EXECUTE FUNCTION public.calculate_monthly_summary();
    END IF;
END $$;
