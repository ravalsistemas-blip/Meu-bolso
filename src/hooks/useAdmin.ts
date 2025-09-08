import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

type AdminUser = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  is_admin: boolean
  admin_level: number
  admin_permissions: string[]
  created_at: string
  updated_at: string
  // Aggregate data
  total_expenses?: number
  expense_count?: number
  last_activity?: string
}

type AdminLog = {
  id: string
  admin_user_id: string
  target_user_id: string | null
  action: string
  description: string
  metadata: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
  admin_profile?: {
    full_name: string | null
    email: string
  }
  target_profile?: {
    full_name: string | null
    email: string
  }
}

export const useAdmin = () => {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLevel, setAdminLevel] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      checkAdminStatus()
    } else {
      setIsAdmin(false)
      setAdminLevel(0)
      setLoading(false)
    }
  }, [user])

  const checkAdminStatus = async () => {
    if (!user) return

    try {
      console.log('Checking admin status for user:', user.id, user.email)
      
      // Force admin for specific user as fallback
      if (user.email === 'novaradiosystem@outlook.com') {
        console.log('Force admin access for designated admin user')
        setIsAdmin(true)
        setAdminLevel(9)
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin, admin_level, admin_permissions')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        
        // If profile doesn't exist, try to create it for admin user
        if (user.email === 'novaradiosystem@outlook.com') {
          console.log('Creating admin profile for designated user')
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: 'Cristiano Ramos Mendes',
              is_admin: true,
              admin_level: 9,
              admin_permissions: ['full_access', 'user_management', 'system_settings']
            })
          
          if (!insertError) {
            setIsAdmin(true)
            setAdminLevel(9)
            console.log('Admin profile created successfully')
          } else {
            console.error('Failed to create admin profile:', insertError)
            setIsAdmin(false)
            setAdminLevel(0)
          }
        } else {
          setIsAdmin(false)
          setAdminLevel(0)
        }
      } else {
        console.log('Profile data:', data)
        setIsAdmin(data?.is_admin || false)
        setAdminLevel(data?.admin_level || 0)
        console.log('Admin status set to:', data?.is_admin || false)
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      
      // Fallback for designated admin user
      if (user.email === 'novaradiosystem@outlook.com') {
        setIsAdmin(true)
        setAdminLevel(9)
      } else {
        setIsAdmin(false)
        setAdminLevel(0)
      }
    } finally {
      setLoading(false)
    }
  }

  const getAllUsers = async (): Promise<AdminUser[]> => {
    if (!isAdmin) throw new Error('Access denied')

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        expenses!expenses_user_id_fkey (
          amount,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate aggregate data
    return data.map(user => ({
      ...user,
      total_expenses: user.expenses?.reduce((sum: number, expense: any) => sum + Number(expense.amount), 0) || 0,
      expense_count: user.expenses?.length || 0,
      last_activity: user.expenses?.[0]?.created_at || user.updated_at
    }))
  }

  const getUserDetails = async (userId: string) => {
    if (!isAdmin) throw new Error('Access denied')

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        expenses!expenses_user_id_fkey (*),
        monthly_income!monthly_income_user_id_fkey (*),
        monthly_summary!monthly_summary_user_id_fkey (*),
        activity_logs!activity_logs_user_id_fkey (*)
      `)
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  const updateUserAdminStatus = async (userId: string, isAdmin: boolean, adminLevel: number = 0) => {
    if (adminLevel < 100) throw new Error('Only super admins can change admin status')

    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_admin: isAdmin, 
        admin_level: isAdmin ? adminLevel : 0,
        admin_permissions: isAdmin ? ['users', 'reports'] : []
      })
      .eq('id', userId)

    if (error) throw error

    // Log the action
    await logAdminAction('USER_ADMIN_CHANGE', `Changed admin status for user ${userId}`, {
      target_user_id: userId,
      new_admin_status: isAdmin,
      new_admin_level: adminLevel
    })
  }

  const deleteUser = async (userId: string) => {
    if (adminLevel < 50) throw new Error('Insufficient permissions')

    // First get user details for logging
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    // Delete from auth.users (this will cascade delete everything else)
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) throw error

    // Log the action
    await logAdminAction('USER_DELETE', `Deleted user ${userProfile?.email}`, {
      target_user_id: userId,
      user_email: userProfile?.email,
      user_name: userProfile?.full_name
    })
  }

  const getAdminLogs = async (limit: number = 50): Promise<AdminLog[]> => {
    if (!isAdmin) throw new Error('Access denied')

    const { data, error } = await supabase
      .from('admin_logs')
      .select(`
        *,
        admin_profile:profiles!admin_logs_admin_user_id_fkey (full_name, email),
        target_profile:profiles!admin_logs_target_user_id_fkey (full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  const logAdminAction = async (action: string, description: string, metadata: any = {}) => {
    if (!isAdmin || !user) return

    const { error } = await supabase
      .from('admin_logs')
      .insert({
        admin_user_id: user.id,
        action,
        description,
        metadata,
        target_user_id: metadata.target_user_id || null
      })

    if (error) console.error('Error logging admin action:', error)
  }

  const getUserStats = async () => {
    if (!isAdmin) throw new Error('Access denied')

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get total admins
    const { count: totalAdmins } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', true)

    // Get users registered today
    const today = new Date().toISOString().split('T')[0]
    const { count: usersToday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    // Get total expenses across all users
    const { data: expenseData } = await supabase
      .from('expenses')
      .select('amount')

    const totalExpenses = expenseData?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0

    return {
      totalUsers: totalUsers || 0,
      totalAdmins: totalAdmins || 0,
      usersToday: usersToday || 0,
      totalExpenses
    }
  }

  return {
    isAdmin,
    adminLevel,
    loading,
    getAllUsers,
    getUserDetails,
    updateUserAdminStatus,
    deleteUser,
    getAdminLogs,
    logAdminAction,
    getUserStats,
    checkAdminStatus
  }
}
