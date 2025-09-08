-- Simple Supabase Setup for Fresh Installation
-- Run this script if you're starting with a completely new Supabase project

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
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

-- Create monthly_income table
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

-- Create monthly_summary table
CREATE TABLE public.monthly_summary (
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

-- Create activity_logs table
CREATE TABLE public.activity_logs (
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

-- Create indexes
CREATE INDEX idx_expenses_user_month_year ON public.expenses(user_id, month, year);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_expenses_type ON public.expenses(expense_type);
CREATE INDEX idx_monthly_income_user_month_year ON public.monthly_income(user_id, month, year);
CREATE INDEX idx_monthly_summary_user_month_year ON public.monthly_summary(user_id, month, year);
CREATE INDEX idx_activity_logs_user_date ON public.activity_logs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Expenses
CREATE POLICY "Users can view own expenses" ON public.expenses
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Monthly Income
CREATE POLICY "Users can view own monthly income" ON public.monthly_income
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own monthly income" ON public.monthly_income
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own monthly income" ON public.monthly_income
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own monthly income" ON public.monthly_income
    FOR DELETE USING (auth.uid() = user_id);

-- Monthly Summary
CREATE POLICY "Users can view own monthly summary" ON public.monthly_summary
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own monthly summary" ON public.monthly_summary
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own monthly summary" ON public.monthly_summary
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own monthly summary" ON public.monthly_summary
    FOR DELETE USING (auth.uid() = user_id);

-- Activity Logs
CREATE POLICY "Users can view own activity logs" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_income_updated_at
    BEFORE UPDATE ON public.monthly_income
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_summary_updated_at
    BEFORE UPDATE ON public.monthly_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Success message
SELECT 'Supabase database setup completed successfully!' as message;
