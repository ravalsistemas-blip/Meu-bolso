import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Download, ArrowCounterClockwise, ChartLine, TrendUp, TrendDown, CurrencyDollar } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { spreadsheetSync, type ConsolidatedSpreadsheet as ConsolidatedSpreadsheetData, SpreadsheetData } from '../lib/spreadsheet-sync'

interface ConsolidatedSpreadsheetProps {
  isOpen: boolean
  onClose: () => void
}

export function ConsolidatedSpreadsheet({ isOpen, onClose }: ConsolidatedSpreadsheetProps) {
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedSpreadsheetData>(
    spreadsheetSync.getConsolidatedData()
  )
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    // Inscrever-se para atualizações
    const unsubscribe = spreadsheetSync.subscribe((data) => {
      setConsolidatedData(data)
    })

    return unsubscribe
  }, [isOpen])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success('Planilha atualizada!')
    }, 1000)
  }

  const handleExportCSV = () => {
    const csv = spreadsheetSync.exportToCSV()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `planilha_consolidada_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    toast.success('Planilha exportada com sucesso!')
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800'
      case 'update': return 'bg-blue-100 text-blue-800'
      case 'delete': return 'bg-red-100 text-red-800'
      case 'reset': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'income': return <TrendUp size={16} className="text-green-600" />
      case 'expense': return <TrendDown size={16} className="text-red-600" />
      case 'investment': return <CurrencyDollar size={16} className="text-blue-600" />
      case 'monthly': return <ChartLine size={16} className="text-purple-600" />
      case 'history': return <ArrowCounterClockwise size={16} className="text-gray-600" />
      default: return <ChartLine size={16} />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Planilha Consolidada</h2>
            <p className="text-muted-foreground">
              Visão integrada de todas as funcionalidades do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
            >
              <ArrowCounterClockwise size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
            >
              <Download size={16} className="mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              Fechar
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            {/* Resumo Geral */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartLine size={20} />
                  Resumo Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Receita Total</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(consolidatedData.summary.totalIncome)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Despesas Totais</div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(consolidatedData.summary.totalExpenses)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Investimentos</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(consolidatedData.summary.totalInvestments)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Saldo Líquido</div>
                    <div className={`text-2xl font-bold ${consolidatedData.summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(consolidatedData.summary.netBalance)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground text-center">
                  Última atualização: {formatDate(consolidatedData.summary.lastUpdated)}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="sections" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sections">Seções Detalhadas</TabsTrigger>
                <TabsTrigger value="logs">Log de Atividades</TabsTrigger>
                <TabsTrigger value="analytics">Análises</TabsTrigger>
              </TabsList>

              <TabsContent value="sections" className="space-y-4">
                {/* Seção de Renda */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendUp size={20} className="text-green-600" />
                      Renda
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Salário</div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(consolidatedData.sections.income.salary)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Renda Extra</div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(consolidatedData.sections.income.extraIncome)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Total</div>
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(consolidatedData.sections.income.totalIncome)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Atualizado: {formatDate(consolidatedData.sections.income.lastUpdated)}
                    </div>
                  </CardContent>
                </Card>

                {/* Seção de Despesas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendDown size={20} className="text-red-600" />
                      Despesas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Despesas Fixas</div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(consolidatedData.sections.expenses.totalFixed)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {consolidatedData.sections.expenses.fixed.length} itens
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Despesas Variáveis</div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(consolidatedData.sections.expenses.totalVariable)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {consolidatedData.sections.expenses.variable.length} itens
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Total Geral</div>
                        <div className="text-lg font-semibold text-red-600">
                          {formatCurrency(consolidatedData.sections.expenses.totalFixed + consolidatedData.sections.expenses.totalVariable)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Atualizado: {formatDate(consolidatedData.sections.expenses.lastUpdated)}
                    </div>
                  </CardContent>
                </Card>

                {/* Seção de Investimentos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CurrencyDollar size={20} className="text-blue-600" />
                      Investimentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Investido</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {formatCurrency(consolidatedData.sections.investments.totalInvested)}
                        </div>
                      </div>
                      {consolidatedData.sections.investments.consolidated.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Investimentos Consolidados:</div>
                          {consolidatedData.sections.investments.consolidated.map((investment, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                              <div>
                                <div className="font-medium">{investment.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Investido: {formatCurrency(investment.totalInvested)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{formatCurrency(investment.currentBalance)}</div>
                                <div className={`text-xs ${investment.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {investment.performance >= 0 ? '+' : ''}{investment.performance.toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Atualizado: {formatDate(consolidatedData.sections.investments.lastUpdated)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção Mensal Atual */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChartLine size={20} className="text-purple-600" />
                      Mês Atual: {consolidatedData.sections.monthly.currentMonth} {consolidatedData.sections.monthly.currentYear}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Receita do Mês</div>
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(consolidatedData.sections.monthly.monthlyData.totalIncome)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Despesas do Mês</div>
                        <div className="text-lg font-semibold text-red-600">
                          {formatCurrency(consolidatedData.sections.monthly.monthlyData.totalExpenses)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Saldo do Mês</div>
                        <div className={`text-lg font-semibold ${consolidatedData.sections.monthly.monthlyData.remainingIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(consolidatedData.sections.monthly.monthlyData.remainingIncome)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Atualizado: {formatDate(consolidatedData.sections.monthly.lastUpdated)}
                    </div>
                  </CardContent>
                </Card>

                {/* Histórico Anual */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowCounterClockwise size={20} className="text-gray-600" />
                      Resumo Anual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {consolidatedData.sections.history.yearlyTotals.length > 0 ? (
                      <div className="space-y-2">
                        {consolidatedData.sections.history.yearlyTotals.map((yearData, index) => (
                          <div key={index} className="flex justify-between items-center p-3 border rounded">
                            <div className="font-medium">{yearData.year}</div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div className="text-center">
                                <div className="text-muted-foreground">Receita</div>
                                <div className="font-medium text-green-600">{formatCurrency(yearData.totalIncome)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-muted-foreground">Despesas</div>
                                <div className="font-medium text-red-600">{formatCurrency(yearData.totalExpenses)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-muted-foreground">Investimentos</div>
                                <div className="font-medium text-blue-600">{formatCurrency(yearData.totalInvestments)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-muted-foreground">Saldo</div>
                                <div className={`font-medium ${yearData.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(yearData.netBalance)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhum histórico anual disponível ainda.
                      </p>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground">
                      Atualizado: {formatDate(consolidatedData.sections.history.lastUpdated)}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Log de Atividades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {consolidatedData.logs.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {consolidatedData.logs.slice().reverse().map((log, index) => (
                          <div key={log.id} className="flex items-center gap-3 p-3 border rounded">
                            <div className="flex-shrink-0">
                              {getSectionIcon(log.section)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getActionColor(log.action)}>
                                  {log.action}
                                </Badge>
                                <span className="text-sm font-medium capitalize">{log.section}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {log.metadata.description}
                                {log.metadata.amount && ` - ${formatCurrency(log.metadata.amount)}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(log.timestamp)} | {log.metadata.monthYear}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhuma atividade registrada ainda.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Análises e Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Distribuição de Gastos */}
                      <div>
                        <h4 className="font-medium mb-3">Distribuição de Gastos</h4>
                        <div className="space-y-2">
                          {consolidatedData.sections.expenses.totalFixed > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm">Despesas Fixas</span>
                              <span className="text-sm font-medium">
                                {((consolidatedData.sections.expenses.totalFixed / (consolidatedData.sections.expenses.totalFixed + consolidatedData.sections.expenses.totalVariable)) * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                          {consolidatedData.sections.expenses.totalVariable > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm">Despesas Variáveis</span>
                              <span className="text-sm font-medium">
                                {((consolidatedData.sections.expenses.totalVariable / (consolidatedData.sections.expenses.totalFixed + consolidatedData.sections.expenses.totalVariable)) * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Performance dos Investimentos */}
                      <div>
                        <h4 className="font-medium mb-3">Performance dos Investimentos</h4>
                        <div className="space-y-2">
                          {consolidatedData.sections.investments.consolidated.map((investment, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-sm">{investment.name}</span>
                              <span className={`text-sm font-medium ${investment.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {investment.performance >= 0 ? '+' : ''}{investment.performance.toFixed(1)}%
                              </span>
                            </div>
                          ))}
                          {consolidatedData.sections.investments.consolidated.length === 0 && (
                            <p className="text-sm text-muted-foreground">Nenhum investimento para analisar</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
