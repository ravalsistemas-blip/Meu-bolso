import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Wallet, 
  TrendUp, 
  TrendDown, 
  Warning,
  Trash,
  CurrencyDollar,
  Download,
  ClockCounterClockwise,
  ArrowCounterClockwise,
  ChatCircle,
  Robot,
  Copy,
  ChartLine,
  // Ícones adicionais para melhor interface
  PiggyBank,
  CreditCard,
  Bank,
  Receipt,
  Calculator,
  Target,
  Calendar,
  Circle,
  Minus,
  PlusCircle,
  MinusCircle,
  Eye,
  EyeSlash,
  User,
  Users,
  Building,
  Car,
  Heart,
  GraduationCap,
  GameController,
  TShirt,
  ShoppingCart,
  Coffee,
  Wrench,
  Briefcase,
  Gift,
  Star,
  CheckCircle,
  XCircle,
  Info
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/formatters'
import { ConsolidatedSpreadsheet } from '@/components/ConsolidatedSpreadsheet'
import { spreadsheetSync } from '@/lib/spreadsheet-sync'
import { useAuth } from '@/hooks/useAuth'
import { AuthPage } from '@/components/AuthPage'
import { AuthCallback } from '@/components/AuthCallback'
import { AppHeader } from '@/components/AppHeader'
import { AdminPage } from '@/components/AdminPage'

type Expense = {
  id: string
  name: string
  amount: number
  category: string
  paymentMethod: 'salary' | 'extra'
  type: 'fixed' | 'variable' | 'investment'
  date: string
  investmentBalance?: number
}

type Income = {
  salary: number
  extraIncome: number
}

type MonthlyData = {
  month: string
  year: number
  income: Income
  expenses: Expense[]
  totalIncome: number
  totalExpenses: number
  remainingIncome: number
}

type CurrentMonth = {
  month: string
  year: number
}

const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Transporte', 
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Roupas',
  'Investimentos',
  'Outros'
]

function App() {
  const { user, loading } = useAuth()
  const [currentView, setCurrentView] = useState<'app' | 'admin'>('app')
  
  // Check if this is an auth callback
  const isAuthCallback = window.location.hash.includes('access_token') && 
                        (window.location.hash.includes('type=signup') || 
                         window.location.hash.includes('type=email_change'))
  
  // Show auth callback page if this is a callback
  if (isAuthCallback) {
    return <AuthCallback />
  }
  
  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-lg inline-block mb-4">
            <Wallet className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Show auth page if user is not logged in
  if (!user) {
    return <AuthPage />
  }

  // Show admin page if requested
  if (currentView === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader onAdminClick={() => setCurrentView('app')} />
        <AdminPage />
      </div>
    )
  }

  // Main app content for authenticated users
  return <ExpenseTrackerApp onAdminClick={() => setCurrentView('admin')} />
}

function ExpenseTrackerApp({ onAdminClick }: { onAdminClick: () => void }) {
  const [income, setIncome] = useState<Income>({ salary: 0, extraIncome: 0 })
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [currentMonth, setCurrentMonth] = useState<CurrentMonth>({ 
    month: new Date().toLocaleDateString('pt-BR', { month: 'long' }), 
    year: new Date().getFullYear() 
  })
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyData[]>([])
  
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [spreadsheetDialogOpen, setSpreadsheetDialogOpen] = useState(false)
  
  const [newIncome, setNewIncome] = useState<Income>({ salary: 0, extraIncome: 0 })
  const [newExpense, setNewExpense] = useState<{
    name: string
    amount: string
    category: string
    paymentMethod: 'salary' | 'extra'
    type: 'fixed' | 'variable' | 'investment'
    investmentBalance: string
  }>({
    name: '',
    amount: '',
    category: '',
    paymentMethod: 'salary',
    type: 'variable',
    investmentBalance: ''
  })
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [isProcessingWhatsapp, setIsProcessingWhatsapp] = useState(false)

  // Sync newIncome when dialog opens
  useEffect(() => {
    if (incomeDialogOpen) {
      setNewIncome(income)
    }
  }, [incomeDialogOpen, income])

  // Check if month changed and reset if needed
  useEffect(() => {
    const now = new Date()
    const currentMonthName = now.toLocaleDateString('pt-BR', { month: 'long' })
    const currentYear = now.getFullYear()

    if (currentMonth.month !== currentMonthName || currentMonth.year !== currentYear) {
      // Save current month data to history before resetting
      if (expenses.length > 0 || income.salary > 0 || income.extraIncome > 0) {
        const totalIncome = income.salary + income.extraIncome
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
        
        const monthData: MonthlyData = {
          month: currentMonth.month,
          year: currentMonth.year,
          income: income,
          expenses: expenses,
          totalIncome,
          totalExpenses,
          remainingIncome: totalIncome - totalExpenses
        }

        setMonthlyHistory((current) => [...(current || []), monthData])
      }

      // Reset current month data
      setExpenses([])
      setIncome({ salary: 0, extraIncome: 0 })
      setCurrentMonth({ month: currentMonthName, year: currentYear })
      
      toast.success(`Novo mês iniciado: ${currentMonthName} ${currentYear}`)
    }
  }, [currentMonth, expenses, income, setExpenses, setIncome, setCurrentMonth, setMonthlyHistory])

  // Initialize spreadsheet sync with current data
  useEffect(() => {
    spreadsheetSync.initializeWithData(income, expenses, monthlyHistory)
  }, [income, expenses, monthlyHistory])

  const parseCurrency = (value: string) => {
    if (!value || value === '') return 0
    // Remove tudo exceto números, vírgulas e pontos
    const cleanValue = value.toString()
      .replace(/[^\d.,]/g, '')
      .replace(/\./g, '') // Remove pontos de milhares
      .replace(',', '.') // Converte vírgula decimal para ponto
    return parseFloat(cleanValue) || 0
  }

  const fixedExpenses = expenses.filter(e => e.type === 'fixed')
  const variableExpenses = expenses.filter(e => e.type === 'variable')
  const investmentExpenses = expenses.filter(e => e.type === 'investment')
  
  // Calculate consolidated investment balances
  const getConsolidatedInvestments = () => {
    const investmentMap = new Map<string, { totalInvested: number, currentBalance: number, lastEntry: Expense }>()
    
    investmentExpenses.forEach(expense => {
      const key = expense.name.toLowerCase()
      if (investmentMap.has(key)) {
        const existing = investmentMap.get(key)!
        existing.totalInvested += expense.amount
        if (expense.investmentBalance !== undefined) {
          existing.currentBalance = expense.investmentBalance
          existing.lastEntry = expense
        }
      } else {
        investmentMap.set(key, {
          totalInvested: expense.amount,
          currentBalance: expense.investmentBalance || expense.amount,
          lastEntry: expense
        })
      }
    })
    
    return Array.from(investmentMap.entries()).map(([name, data]) => ({
      name: data.lastEntry.name,
      totalInvested: data.totalInvested,
      currentBalance: data.currentBalance,
      category: data.lastEntry.category,
      paymentMethod: data.lastEntry.paymentMethod
    }))
  }
  
  const totalFixedExpenses = fixedExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalVariableExpenses = variableExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalInvestmentExpenses = investmentExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalExpenses = totalFixedExpenses + totalVariableExpenses + totalInvestmentExpenses
  
  const salaryExpenses = expenses.filter(e => e.paymentMethod === 'salary').reduce((sum, e) => sum + e.amount, 0)
  const extraExpenses = expenses.filter(e => e.paymentMethod === 'extra').reduce((sum, e) => sum + e.amount, 0)
  
  const totalIncome = income.salary + income.extraIncome
  const remainingIncome = totalIncome - totalExpenses
  const remainingSalary = income.salary - salaryExpenses
  const remainingExtra = income.extraIncome - extraExpenses

  const salaryUsagePercent = income.salary > 0 ? (salaryExpenses / income.salary) * 100 : 0

  const handleSaveIncome = () => {
    setIncome(newIncome)
    setIncomeDialogOpen(false)
    
    // Sync with spreadsheet system
    spreadsheetSync.syncChange({
      section: 'income',
      action: 'update',
      data: newIncome,
      relatedSections: ['monthly', 'summary'],
      metadata: {
        monthYear: `${currentMonth.month} ${currentMonth.year}`,
        description: `Renda atualizada: Salário ${formatCurrency(newIncome.salary)}, Extra ${formatCurrency(newIncome.extraIncome)}`,
        amount: newIncome.salary + newIncome.extraIncome
      }
    })
    
    toast.success('Renda atualizada com sucesso!')
  }

  const handleAddExpense = () => {
    if (!newExpense.name || !newExpense.amount || !newExpense.category) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const amount = parseCurrency(newExpense.amount)
    if (amount <= 0) {
      toast.error('O valor deve ser maior que zero')
      return
    }

    let investmentBalance: number | undefined

    if (newExpense.type === 'investment') {
      // Check if this investment already exists
      const existingInvestment = expenses.find(e => 
        e.type === 'investment' && 
        e.name.toLowerCase() === newExpense.name.toLowerCase()
      )

      if (existingInvestment && existingInvestment.investmentBalance !== undefined) {
        // Add to existing balance
        investmentBalance = existingInvestment.investmentBalance + amount
      } else {
        // First time or no existing balance - use provided initial balance or amount as balance
        const initialBalance = parseCurrency(newExpense.investmentBalance)
        investmentBalance = initialBalance > 0 ? initialBalance : amount
      }
    }

    const expense: Expense = {
      id: Date.now().toString(),
      name: newExpense.name,
      amount,
      category: newExpense.category,
      paymentMethod: newExpense.paymentMethod,
      type: newExpense.type,
      date: new Date().toISOString(),
      investmentBalance
    }

    setExpenses((current) => [...(current || []), expense])
    setNewExpense({
      name: '',
      amount: '',
      category: '',
      paymentMethod: 'salary',
      type: 'variable',
      investmentBalance: ''
    })
    setExpenseDialogOpen(false)
    
    // Sync with spreadsheet system
    const updatedExpenses = [...expenses, expense]
    spreadsheetSync.syncChange({
      section: expense.type === 'investment' ? 'investment' : 'expense',
      action: 'create',
      data: updatedExpenses,
      relatedSections: ['monthly', 'summary'],
      metadata: {
        monthYear: `${currentMonth.month} ${currentMonth.year}`,
        description: `${expense.type === 'investment' ? 'Investimento' : 'Despesa'} adicionada: ${expense.name}`,
        amount: expense.amount,
        category: expense.category
      }
    })
    
    toast.success(newExpense.type === 'investment' ? 'Investimento adicionado com sucesso!' : 'Despesa adicionada com sucesso!')
  }

  const handleDeleteExpense = (id: string) => {
    const expenseToDelete = expenses.find(e => e.id === id)
    const updatedExpenses = expenses.filter(e => e.id !== id)
    
    setExpenses((current) => (current || []).filter(e => e.id !== id))
    
    // Sync with spreadsheet system
    if (expenseToDelete) {
      spreadsheetSync.syncChange({
        section: expenseToDelete.type === 'investment' ? 'investment' : 'expense',
        action: 'delete',
        data: updatedExpenses,
        relatedSections: ['monthly', 'summary'],
        metadata: {
          monthYear: `${currentMonth.month} ${currentMonth.year}`,
          description: `${expenseToDelete.type === 'investment' ? 'Investimento' : 'Despesa'} removida: ${expenseToDelete.name}`,
          amount: -expenseToDelete.amount,
          category: expenseToDelete.category
        }
      })
    }
    
    toast.success('Despesa removida com sucesso!')
  }

  const generateCSV = (data: MonthlyData) => {
    const headers = ['Tipo', 'Nome', 'Categoria', 'Valor', 'Forma de Pagamento', 'Saldo Investimento']
    const rows: string[][] = []
    
    // Add income rows
    if (data.income.salary > 0) {
      rows.push(['Receita', 'Salário', 'Renda', data.income.salary.toFixed(2), 'Salário', ''])
    }
    if (data.income.extraIncome > 0) {
      rows.push(['Receita', 'Renda Extra', 'Renda', data.income.extraIncome.toFixed(2), 'Extra', ''])
    }
    
    // Add expense rows
    data.expenses.forEach(expense => {
      rows.push([
        expense.type === 'investment' ? 'Investimento' : 'Despesa',
        expense.name,
        expense.category,
        expense.amount.toFixed(2),
        expense.paymentMethod === 'salary' ? 'Salário' : 'Renda Extra',
        expense.investmentBalance ? expense.investmentBalance.toFixed(2) : ''
      ])
    })
    
    // Add summary
    rows.push(['', '', '', '', '', ''])
    rows.push(['Resumo', 'Total Receitas', '', data.totalIncome.toFixed(2), '', ''])
    rows.push(['Resumo', 'Total Despesas', '', data.totalExpenses.toFixed(2), '', ''])
    rows.push(['Resumo', 'Saldo', '', data.remainingIncome.toFixed(2), '', ''])
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    return csvContent
  }

  const downloadCSV = (data: MonthlyData) => {
    const csv = generateCSV(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `financeiro_${data.month}_${data.year}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    toast.success('Planilha baixada com sucesso!')
  }

  const processWhatsAppMessage = async () => {
    if (!whatsappMessage.trim()) {
      toast.error('Digite uma mensagem para processar')
      return
    }

    setIsProcessingWhatsapp(true)

    try {
      // Para agora, vamos apenas extrair informações básicas
      // TODO: Implementar processamento com IA quando disponível
      
      const hasIncome = whatsappMessage.toLowerCase().includes('recebi') || 
                       whatsappMessage.toLowerCase().includes('salário') ||
                       whatsappMessage.toLowerCase().includes('renda')
      
      if (hasIncome) {
        toast.info('Funcionalidade de processamento automático em desenvolvimento')
      } else {
        toast.info('Funcionalidade de processamento automático em desenvolvimento')
      }
      
      setWhatsappDialogOpen(false)
      setWhatsappMessage('')
      
    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
      toast.error('Erro ao processar mensagem do WhatsApp')
    } finally {
      setIsProcessingWhatsapp(false)
    }
  }
  
  const getWhatsappExamples = () => {
    return [
      "Gastei R$ 45 no Uber hoje",
      "Paguei R$ 1.200 de aluguel",
      "Recebi R$ 3.500 de salário",
      "Investi R$ 500 na poupança, saldo R$ 2.000",
      "Comprei R$ 80 de comida no mercado",
      "Freelance de R$ 800 caiu na conta"
    ]
  }

  const copyExampleToClipboard = (example: string) => {
    setWhatsappMessage(example)
    toast.success('Exemplo copiado!')
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onAdminClick={onAdminClick} />
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Controle Financeiro</h1>
                <p className="text-muted-foreground">
                  {currentMonth.month} {currentMonth.year} - Gerencie suas despesas fixas e variáveis
                </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setSpreadsheetDialogOpen(true)}
                variant="outline"
                size="sm"
                className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
              >
                <ChartLine size={16} className="mr-2" />
                Planilha Consolidada
              </Button>
              <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ClockCounterClockwise size={16} className="mr-2" />
                    Histórico
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Histórico Anual</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {monthlyHistory.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum histórico disponível ainda.
                      </p>
                    ) : (
                      <div className="grid gap-4">
                        {monthlyHistory
                          .sort((a, b) => b.year - a.year || new Date(`${b.month} 1, 2000`).getMonth() - new Date(`${a.month} 1, 2000`).getMonth())
                          .map((data, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold">
                                {data.month} {data.year}
                              </h3>
                              <Button
                                onClick={() => downloadCSV(data)}
                                variant="outline"
                                size="sm"
                              >
                                <Download size={16} className="mr-2" />
                                Baixar CSV
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="text-center">
                                <div className="text-sm text-muted-foreground">Receitas</div>
                                <div className="text-lg font-semibold text-primary">
                                  {formatCurrency(data.totalIncome)}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-muted-foreground">Despesas</div>
                                <div className="text-lg font-semibold text-destructive">
                                  {formatCurrency(data.totalExpenses)}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-muted-foreground">Saldo</div>
                                <div className={`text-lg font-semibold ${data.remainingIncome >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                  {formatCurrency(data.remainingIncome)}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {data.expenses.length} despesas registradas
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Resumo Financeiro */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${totalInvestmentExpenses > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 mb-8`}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet size={16} />
                Renda Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-numbers text-income">{formatCurrency(totalIncome)}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendUp size={16} />
                <span className="text-sm text-muted-foreground">Mensal</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MinusCircle size={16} />
                Total Gasto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-numbers text-expense">{formatCurrency(totalExpenses)}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendDown size={16} />
                <span className="text-sm text-muted-foreground">Este mês</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PiggyBank size={16} />
                Saldo Restante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-numbers text-available`}>
                {formatCurrency(remainingIncome)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Wallet size={16} />
                <span className="text-sm text-muted-foreground">Disponível</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PlusCircle size={16} />
                Renda Extra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-numbers text-extra-income">{formatCurrency(remainingExtra)}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendUp size={16} />
                <span className="text-sm text-muted-foreground">Disponível</span>
              </div>
            </CardContent>
          </Card>

          {totalInvestmentExpenses > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target size={16} />
                  Total Investido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-numbers text-income">{formatCurrency(totalInvestmentExpenses)}</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendUp size={16} />
                  <span className="text-sm text-muted-foreground">Aplicado</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Alertas */}
        {salaryUsagePercent > 90 && (
          <Alert className="mb-6 border-destructive">
            <Warning className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              Cuidado! Você já usou {salaryUsagePercent.toFixed(1)}% do seu salário.
            </AlertDescription>
          </Alert>
        )}

        {/* Controles principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-20 text-left flex-col items-start justify-center bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" variant="outline">
                <CurrencyDollar size={24} className="mb-2" />
                <div className="text-sm font-medium">Definir Renda</div>
                <div className="text-xs text-emerald-100">Salário e renda extra</div>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Definir Renda Mensal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="salary">Salário</Label>
                  <Input
                    id="salary"
                    type="text"
                    placeholder="0,00"
                    value={newIncome.salary || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      setNewIncome({ ...newIncome, salary: value })
                    }}
                    className="currency-input"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="extra">Renda Extra</Label>
                  <Input
                    id="extra"
                    type="text"
                    placeholder="0,00"
                    value={newIncome.extraIncome || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      setNewIncome({ ...newIncome, extraIncome: value })
                    }}
                    className="currency-input"
                    autoComplete="off"
                  />
                </div>
                <Button onClick={handleSaveIncome} className="w-full">
                  Salvar Renda
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-20 text-left flex-col items-start justify-center" variant="outline">
                <Plus size={24} className="mb-2" />
                <div className="text-sm font-medium">Nova Despesa</div>
                <div className="text-xs text-muted-foreground">Fixa ou variável</div>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Despesa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="expense-name">Nome da Despesa</Label>
                  <Input
                    id="expense-name"
                    placeholder="Ex: Aluguel, Supermercado..."
                    value={newExpense.name}
                    onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expense-amount">Valor</Label>
                  <Input
                    id="expense-amount"
                    type="text"
                    placeholder="0,00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="currency-input"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="expense-category">Categoria</Label>
                  <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
                    <SelectTrigger id="expense-category">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expense-type">Tipo</Label>
                  <Select value={newExpense.type} onValueChange={(value: 'fixed' | 'variable' | 'investment') => setNewExpense({ ...newExpense, type: value })}>
                    <SelectTrigger id="expense-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Despesa Fixa</SelectItem>
                      <SelectItem value="variable">Despesa Variável</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newExpense.type === 'investment' && (() => {
                  // Check if this investment already exists
                  const existingInvestment = expenses.find(e => 
                    e.type === 'investment' && 
                    e.name.toLowerCase() === newExpense.name.toLowerCase()
                  )
                  
                  // Only show balance field for first investment of this name
                  return !existingInvestment ? (
                    <div>
                      <Label htmlFor="investment-balance">Saldo Inicial do Investimento</Label>
                      <Input
                        id="investment-balance"
                        type="text"
                        placeholder="0,00 (opcional)"
                        value={newExpense.investmentBalance}
                        onChange={(e) => setNewExpense({ ...newExpense, investmentBalance: e.target.value })}
                        className="currency-input"
                        autoComplete="off"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Deixe vazio para usar o valor do investimento como saldo inicial
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <div className="text-sm font-medium text-foreground mb-1">
                        ✅ Investimento existente encontrado
                      </div>
                      <div className="text-xs text-muted-foreground">
                        O saldo será atualizado automaticamente adicionando este valor ao saldo atual.
                      </div>
                    </div>
                  )
                })()}
                <div>
                  <Label htmlFor="payment-method">Forma de Pagamento</Label>
                  <Select value={newExpense.paymentMethod} onValueChange={(value: 'salary' | 'extra') => setNewExpense({ ...newExpense, paymentMethod: value })}>
                    <SelectTrigger id="payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">Salário</SelectItem>
                      <SelectItem value="extra">Renda Extra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddExpense} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Adicionar Despesa
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-20 text-left flex-col items-start justify-center bg-green-600 hover:bg-green-700 text-white border-green-600" variant="outline">
                <ChatCircle size={24} className="mb-2" />
                <div className="text-sm font-medium">WhatsApp</div>
                <div className="text-xs text-green-100">Adicionar por mensagem</div>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Robot size={20} />
                  Adicionar via WhatsApp
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="whatsapp-message">Cole sua mensagem do WhatsApp</Label>
                  <Textarea
                    id="whatsapp-message"
                    placeholder="Ex: Gastei R$ 150 no supermercado hoje"
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Robot size={16} />
                    Exemplos de mensagens que funcionam:
                  </h4>
                  <div className="grid gap-2">
                    {getWhatsappExamples().map((example, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-background rounded border">
                        <span className="text-muted-foreground">"{example}"</span>
                        <Button
                          onClick={() => copyExampleToClipboard(example)}
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                        >
                          <Copy size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Alert>
                  <Robot className="h-4 w-4" />
                  <AlertDescription>
                    A IA irá analisar sua mensagem e extrair automaticamente o valor, categoria e tipo de transação.
                    Seja específico sobre valores e descrições para melhores resultados.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={processWhatsAppMessage} 
                  className="w-full"
                  disabled={isProcessingWhatsapp || !whatsappMessage.trim()}
                >
                  {isProcessingWhatsapp ? (
                    <>
                      <Robot size={16} className="mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Robot size={16} className="mr-2" />
                      Processar Mensagem
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Indicadores de Uso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet size={20} />
                Uso do Salário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usado: {formatCurrency(salaryExpenses)}</span>
                  <span>Disponível: {formatCurrency(remainingSalary)}</span>
                </div>
                <Progress value={Math.min(salaryUsagePercent, 100)} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  {salaryUsagePercent.toFixed(1)}% utilizado
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendUp size={20} />
                Uso da Renda Extra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usado: {formatCurrency(extraExpenses)}</span>
                  <span>Disponível: {formatCurrency(remainingExtra)}</span>
                </div>
                <Progress 
                  value={income.extraIncome > 0 ? Math.min((extraExpenses / income.extraIncome) * 100, 100) : 0} 
                  className="h-2" 
                />
                <div className="text-xs text-muted-foreground text-center">
                  {income.extraIncome > 0 ? ((extraExpenses / income.extraIncome) * 100).toFixed(1) : 0}% utilizado
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Despesas */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="fixed">Fixas</TabsTrigger>
            <TabsTrigger value="variable">Variáveis</TabsTrigger>
            <TabsTrigger value="investment">Investimentos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma despesa cadastrada. Clique em "Nova Despesa" para começar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{expense.name}</span>
                            <Badge variant={expense.type === 'fixed' ? 'default' : expense.type === 'investment' ? 'default' : 'secondary'} 
                                   className={expense.type === 'investment' ? 'bg-accent text-accent-foreground' : ''}>
                              {expense.type === 'fixed' ? 'Fixa' : expense.type === 'investment' ? 'Investimento' : 'Variável'}
                            </Badge>
                            <Badge variant="outline">{expense.category}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-numbers font-medium">
                              {expense.type === 'investment' ? 'Aplicado: ' : ''}{formatCurrency(expense.amount)}
                            </span>
                            {expense.type === 'investment' && expense.investmentBalance && (
                              <span className="font-numbers font-medium text-primary">
                                Saldo: {formatCurrency(expense.investmentBalance)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              {expense.paymentMethod === 'salary' ? <Wallet size={14} /> : <TrendUp size={14} />}
                              {expense.paymentMethod === 'salary' ? 'Salário' : 'Renda Extra'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fixed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Despesas Fixas ({formatCurrency(totalFixedExpenses)})</CardTitle>
              </CardHeader>
              <CardContent>
                {fixedExpenses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma despesa fixa cadastrada.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {fixedExpenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{expense.name}</span>
                            <Badge variant="outline">{expense.category}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-numbers font-medium">{formatCurrency(expense.amount)}</span>
                            <span className="flex items-center gap-1">
                              {expense.paymentMethod === 'salary' ? <Wallet size={14} /> : <TrendUp size={14} />}
                              {expense.paymentMethod === 'salary' ? 'Salário' : 'Renda Extra'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variable" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Despesas Variáveis ({formatCurrency(totalVariableExpenses)})</CardTitle>
              </CardHeader>
              <CardContent>
                {variableExpenses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma despesa variável cadastrada.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {variableExpenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{expense.name}</span>
                            <Badge variant="outline">{expense.category}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-numbers font-medium">{formatCurrency(expense.amount)}</span>
                            <span className="flex items-center gap-1">
                              {expense.paymentMethod === 'salary' ? <Wallet size={14} /> : <TrendUp size={14} />}
                              {expense.paymentMethod === 'salary' ? 'Salário' : 'Renda Extra'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Investimentos ({formatCurrency(totalInvestmentExpenses)})</CardTitle>
              </CardHeader>
              <CardContent>
                {investmentExpenses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum investimento cadastrado.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Consolidated view */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Resumo por Investimento</h4>
                      {getConsolidatedInvestments().map((investment, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-card/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{investment.name}</span>
                              <Badge variant="default" className="bg-accent text-accent-foreground">Investimento</Badge>
                              <Badge variant="outline">{investment.category}</Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total Investido:</span>
                              <div className="font-numbers font-medium">{formatCurrency(investment.totalInvested)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Saldo Atual:</span>
                              <div className="font-numbers font-medium text-primary">{formatCurrency(investment.currentBalance)}</div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {investment.paymentMethod === 'salary' ? <Wallet size={12} /> : <TrendUp size={12} />}
                              {investment.paymentMethod === 'salary' ? 'Salário' : 'Renda Extra'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Individual transactions */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Histórico de Transações</h4>
                      {investmentExpenses.map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{expense.name}</span>
                              <Badge variant="default" className="bg-accent text-accent-foreground">Investimento</Badge>
                              <Badge variant="outline">{expense.category}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="font-numbers font-medium">Aplicado: {formatCurrency(expense.amount)}</span>
                              {expense.investmentBalance && (
                                <span className="font-numbers font-medium text-primary">
                                  Saldo após: {formatCurrency(expense.investmentBalance)}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                {expense.paymentMethod === 'salary' ? <Wallet size={14} /> : <TrendUp size={14} />}
                                {expense.paymentMethod === 'salary' ? 'Salário' : 'Renda Extra'}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Planilha Consolidada */}
      <ConsolidatedSpreadsheet 
        isOpen={spreadsheetDialogOpen} 
        onClose={() => setSpreadsheetDialogOpen(false)}
      />
      </div>
    </div>
  )
}

export default App