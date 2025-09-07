import { supabase, type Database } from './supabase'

// Type definitions that work with our actual database schema
type ExpenseRow = Database['public']['Tables']['expenses']['Row']
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
type MonthlyIncomeInsert = {
  user_id: string
  month: string
  year: number
  salary?: number
  extra_income?: number
}
type MonthlySummaryInsert = {
  user_id: string
  month: string
  year: number
  total_income?: number
  total_expenses?: number
  total_fixed_expenses?: number
  total_variable_expenses?: number
  total_investment_expenses?: number
  salary_usage_percent?: number
  extra_usage_percent?: number
}
type ActivityLogInsert = {
  user_id: string
  section: string
  action: string
  description: string
  amount?: number | null
  category?: string | null
  month?: string | null
  year?: number | null
  metadata?: any
}
type ProfileUpdate = {
  email?: string
  full_name?: string | null
  avatar_url?: string | null
}

// Expenses operations
export const expenseService = {
  // Get all expenses for current month/year
  async getExpenses(month: string, year: number, userId?: string) {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('month', month)
      .eq('year', year)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  // Add new expense
  async addExpense(expense: ExpenseInsert) {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update expense
  async updateExpense(id: string, expense: Partial<ExpenseInsert>) {
    const { data, error } = await supabase
      .from('expenses')
      .update({ ...expense, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete expense
  async deleteExpense(id: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// Income operations
export const incomeService = {
  // Get income for current month/year
  async getIncome(month: string, year: number, userId?: string) {
    let query = supabase
      .from('monthly_income')
      .select('*')
      .eq('month', month)
      .eq('year', year)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.single()
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data
  },

  // Set income for month/year
  async setIncome(income: MonthlyIncomeInsert) {
    const existing = await this.getIncome(income.month, income.year, income.user_id)
    
    if (existing) {
      const { data, error } = await supabase
        .from('monthly_income')
        .update({ 
          salary: income.salary, 
          extra_income: income.extra_income,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('monthly_income')
        .insert(income)
        .select()
        .single()

      if (error) throw error
      return data
    }
  }
}

// Monthly summary operations (replaces monthly history)
export const monthlySummaryService = {
  // Get all monthly summaries
  async getMonthlySummaries(userId?: string) {
    let query = supabase
      .from('monthly_summary')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  // Get specific monthly summary
  async getMonthlySummary(month: string, year: number, userId?: string) {
    let query = supabase
      .from('monthly_summary')
      .select('*')
      .eq('month', month)
      .eq('year', year)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Add monthly summary record (usually done automatically by triggers)
  async addMonthlySummary(summary: MonthlySummaryInsert) {
    const { data, error } = await supabase
      .from('monthly_summary')
      .insert(summary)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update monthly summary
  async updateMonthlySummary(id: string, summary: Partial<MonthlySummaryInsert>) {
    const { data, error } = await supabase
      .from('monthly_summary')
      .update({ ...summary, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Authentication helper
export const authService = {
  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Sign in with email
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  // Sign up with email
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Activity logs service
export const activityLogsService = {
  // Get activity logs for user
  async getActivityLogs(userId?: string, limit = 50) {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  // Add activity log
  async addActivityLog(log: ActivityLogInsert) {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert(log)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Profile service
export const profileService = {
  // Get user profile
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Update user profile
  async updateProfile(userId: string, profile: ProfileUpdate) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...profile, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
