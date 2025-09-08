import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export function AuthCallback() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        if (type === 'signup' || type === 'email_change') {
          if (accessToken && refreshToken) {
            // Set the session
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })

            if (error) {
              throw error
            }

            setSuccess(true)
            
            // Redirect to app after 3 seconds
            setTimeout(() => {
              window.location.href = '/'
            }, 3000)
          } else {
            throw new Error('Tokens de acesso não encontrados')
          }
        } else {
          throw new Error('Tipo de confirmação inválido')
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao confirmar email')
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [])

  const handleBackToLogin = () => {
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Confirmando Email...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center space-x-2">
            {success ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span>Email Confirmado!</span>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                <span>Erro na Confirmação</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Seu email foi confirmado com sucesso! Você será redirecionado para a aplicação em breve.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error || 'Ocorreu um erro ao confirmar seu email. Tente novamente.'}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleBackToLogin}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Login
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
