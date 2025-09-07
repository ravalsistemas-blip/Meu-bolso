import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { runAllTests } from '@/lib/supabase-test'

export function SupabaseTestComponent() {
  const handleTest = async () => {
    try {
      await runAllTests()
    } catch (error) {
      console.error('Erro nos testes:', error)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>🔧 Teste do Supabase</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Clique no botão abaixo para testar a conexão com o Supabase. 
          Verifique o console do navegador (F12) para ver os resultados.
        </p>
        <Button onClick={handleTest} variant="outline">
          🚀 Executar Testes
        </Button>
      </CardContent>
    </Card>
  )
}

export default SupabaseTestComponent
