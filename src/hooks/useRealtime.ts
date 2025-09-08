import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

type RealtimeData<T> = {
  data: T[]
  loading: boolean
  error: string | null
  refresh: () => void
}

/**
 * Hook para dados em tempo real com filtro por usuário
 * Automatically filters data by current user and updates in real-time
 */
export function useRealtimeData<T extends { user_id: string }>(
  table: string,
  select = '*'
): RealtimeData<T> {
  const { user } = useAuth()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!user) {
      setData([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data: result, error } = await supabase
        .from(table)
        .select(select)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setData((result as any) || [])
      setError(null)
    } catch (err) {
      console.error(`Error fetching ${table}:`, err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return

    // Initial fetch
    fetchData()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel(`realtime_${table}_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: table,
          filter: `user_id=eq.${user.id}` // Only get changes for current user
        },
        (payload) => {
          console.log(`Real-time change in ${table}:`, payload)
          
          // Refresh data when changes occur
          fetchData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, table, select])

  return {
    data,
    loading,
    error,
    refresh: fetchData
  }
}

/**
 * Hook específico para despesas em tempo real
 */
export function useRealtimeExpenses() {
  return useRealtimeData<{
    id: string
    user_id: string
    name: string
    amount: number
    category: string
    payment_method: 'salary' | 'extra'
    expense_type: 'fixed' | 'variable' | 'investment'
    investment_balance?: number
    month: string
    year: number
    date: string
    created_at: string
    updated_at: string
  }>('expenses')
}

/**
 * Hook específico para renda mensal em tempo real
 */
export function useRealtimeMonthlyIncome() {
  return useRealtimeData<{
    id: string
    user_id: string
    month: string
    year: number
    salary: number
    extra_income: number
    total_income: number
    created_at: string
    updated_at: string
  }>('monthly_income')
}

/**
 * Hook específico para resumo mensal em tempo real
 */
export function useRealtimeMonthlySummary() {
  return useRealtimeData<{
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
  }>('monthly_summary')
}

/**
 * Hook para notificações em tempo real
 * Shows toast notifications when data changes
 */
export function useRealtimeNotifications(table: string) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel(`notifications_${table}_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload

          // Show notification based on event type
          switch (eventType) {
            case 'INSERT':
              console.log(`✅ Novo registro adicionado em ${table}`)
              break
            case 'UPDATE':
              console.log(`📝 Registro atualizado em ${table}`)
              break
            case 'DELETE':
              console.log(`🗑️ Registro removido de ${table}`)
              break
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, table])
}
