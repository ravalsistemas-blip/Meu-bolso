import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vxobrkwqmeqacxjgbowy.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4b2Jya3dxbWVxYWN4amdib3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyODMxMTAsImV4cCI6MjA3Mjg1OTExMH0.SGMVNms9CK_Ax0Db8oWmPZb62GimnyYTQG9CuwqCw3Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database Types (Updated for new schema)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          is_admin: boolean
          admin_level: number
          admin_permissions: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          admin_level?: number
          admin_permissions?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          admin_level?: number
          admin_permissions?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          category: string
          payment_method: 'salary' | 'extra'
          expense_type: 'fixed' | 'variable' | 'investment'
          investment_balance: number | null
          month: string
          year: number
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: number
          category: string
          payment_method: 'salary' | 'extra'
          expense_type: 'fixed' | 'variable' | 'investment'
          investment_balance?: number | null
          month: string
          year: number
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          category?: string
          payment_method?: 'salary' | 'extra'
          expense_type?: 'fixed' | 'variable' | 'investment'
          investment_balance?: number | null
          month?: string
          year?: number
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      monthly_income: {
        Row: {
          id: string
          user_id: string
          month: string
          year: number
          salary: number
          extra_income: number
          total_income: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          year: number
          salary?: number
          extra_income?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          year?: number
          salary?: number
          extra_income?: number
          created_at?: string
          updated_at?: string
        }
      }
      monthly_summary: {
        Row: {
          id: string
          user_id: string
          month: string
          year: number
          total_income: number
          total_expenses: number
          total_fixed_expenses: number
          total_variable_expenses: number
          total_investment_expenses: number
          remaining_income: number
          salary_usage_percent: number
          extra_usage_percent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
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
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          year?: number
          total_income?: number
          total_expenses?: number
          total_fixed_expenses?: number
          total_variable_expenses?: number
          total_investment_expenses?: number
          salary_usage_percent?: number
          extra_usage_percent?: number
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          section: string
          action: string
          description: string
          amount: number | null
          category: string | null
          month: string | null
          year: number | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          section: string
          action: string
          description: string
          amount?: number | null
          category?: string | null
          month?: string | null
          year?: number | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          section?: string
          action?: string
          description?: string
          amount?: number | null
          category?: string | null
          month?: string | null
          year?: number | null
          metadata?: any
          created_at?: string
        }
      }
      admin_logs: {
        Row: {
          id: string
          admin_user_id: string
          target_user_id: string | null
          action: string
          description: string
          metadata: any
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id: string
          target_user_id?: string | null
          action: string
          description: string
          metadata?: any
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string
          target_user_id?: string | null
          action?: string
          description?: string
          metadata?: any
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Type aliases for convenience
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Auth helpers
export const signUp = async (email: string, password: string, metadata?: any) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
}

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password
  })
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
