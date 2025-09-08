import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any; data: any }>
  signOut: () => Promise<void>
  resendConfirmation: (email: string) => Promise<{ error: any }>
}

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Get the correct redirect URL based on environment
  const getRedirectUrl = () => {
    const hostname = window.location.hostname
    
    // Production domain
    if (hostname === 'meubolso.crmvsystem.com') {
      return 'https://meubolso.crmvsystem.com/auth/callback'
    }
    
    // Vercel preview/production
    if (hostname.includes('vercel.app')) {
      return `${window.location.origin}/auth/callback`
    }
    
    // Local development
    return 'http://localhost:5173/auth/callback'
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: getRedirectUrl()
      }
    })
    return { error, data }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getRedirectUrl()
      }
    })
    return { error }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resendConfirmation
  }
}
