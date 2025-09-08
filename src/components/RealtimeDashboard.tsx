import React from 'react'
import { useRealtimeExpenses, useRealtimeMonthlyIncome, useRealtimeMonthlySummary, useRealtimeNotifications } from '@/hooks/useRealtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Exemplo de componente usando dados em tempo real
 * Os dados são atualizados automaticamente quando há mudanças no banco
 */
export function RealtimeDashboard() {
  // Hooks para dados em tempo real
  const { data: expenses, loading: expensesLoading, error: expensesError } = useRealtimeExpenses()
  const { data: income, loading: incomeLoading } = useRealtimeMonthlyIncome()
  const { data: summary, loading: summaryLoading } = useRealtimeMonthlySummary()

  // Hook para notificações (opcional)
  useRealtimeNotifications('expenses')
  useRealtimeNotifications('monthly_income')

  if (expensesLoading || incomeLoading || summaryLoading) {
    return <DashboardSkeleton />
  }

  if (expensesError) {
    return (
      <div className="p-4 text-center text-red-600">
        Erro ao carregar dados: {expensesError}
      </div>
    )
  }

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long' })
  const currentYear = new Date().getFullYear()
  
  const currentSummary = summary.find(s => 
    s.month.toLowerCase() === currentMonth.toLowerCase() && 
    s.year === currentYear
  )

  const currentIncome = income.find(i => 
    i.month.toLowerCase() === currentMonth.toLowerCase() && 
    i.year === currentYear
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Real-time</h1>
        <Badge variant="outline" className="bg-green-50 text-green-700">
          🔄 Dados em tempo real
        </Badge>
      </div>

      {/* Resumo do Mês Atual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Renda Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {currentIncome?.total_income?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonth} {currentYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {currentSummary?.total_expenses?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Restante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (currentSummary?.remaining_income || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              R$ {currentSummary?.remaining_income?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponível para gastos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Despesas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas Recentes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Atualizações em tempo real - {expenses.length} despesas
          </p>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma despesa cadastrada ainda
            </p>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{expense.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {expense.category} • {expense.expense_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">
                      R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(expense.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
