import { useKV } from '@github/spark/hooks'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Trash2,
  DollarSign
} from '@phosphor-icons/react'
import { toast } from 'sonner'

type Expense = {
  id: string
  name: string
  amount: number
  category: string
  paymentMethod: 'salary' | 'credit' | 'extra'
  type: 'fixed' | 'variable'
  date: string
}

type Income = {
  salary: number
  extraIncome: number
}

const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Transporte', 
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Roupas',
  'Outros'
]

function App() {
  const [income, setIncome] = useKV<Income>('income', { salary: 0, extraIncome: 0 })
  const [expenses, setExpenses] = useKV<Expense[]>('expenses', [])
  
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  
  const [newIncome, setNewIncome] = useState<Income>(income)
  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: '',
    category: '',
    paymentMethod: 'salary' as const,
    type: 'variable' as const
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const parseCurrency = (value: string) => {
    return parseFloat(value.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0
  }

  const fixedExpenses = expenses.filter(e => e.type === 'fixed')
  const variableExpenses = expenses.filter(e => e.type === 'variable')
  
  const totalFixedExpenses = fixedExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalVariableExpenses = variableExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalExpenses = totalFixedExpenses + totalVariableExpenses
  
  const salaryExpenses = expenses.filter(e => e.paymentMethod === 'salary').reduce((sum, e) => sum + e.amount, 0)
  const creditExpenses = expenses.filter(e => e.paymentMethod === 'credit').reduce((sum, e) => sum + e.amount, 0)
  const extraExpenses = expenses.filter(e => e.paymentMethod === 'extra').reduce((sum, e) => sum + e.amount, 0)
  
  const totalIncome = income.salary + income.extraIncome
  const remainingIncome = totalIncome - totalExpenses
  const remainingSalary = income.salary - salaryExpenses
  const remainingExtra = income.extraIncome - extraExpenses

  const salaryUsagePercent = income.salary > 0 ? (salaryExpenses / income.salary) * 100 : 0

  const handleSaveIncome = () => {
    setIncome(newIncome)
    setIncomeDialogOpen(false)
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

    const expense: Expense = {
      id: Date.now().toString(),
      name: newExpense.name,
      amount,
      category: newExpense.category,
      paymentMethod: newExpense.paymentMethod,
      type: newExpense.type,
      date: new Date().toISOString()
    }

    setExpenses((current) => [...current, expense])
    setNewExpense({
      name: '',
      amount: '',
      category: '',
      paymentMethod: 'salary',
      type: 'variable'
    })
    setExpenseDialogOpen(false)
    toast.success('Despesa adicionada com sucesso!')
  }

  const handleDeleteExpense = (id: string) => {
    setExpenses((current) => current.filter(e => e.id !== id))
    toast.success('Despesa removida com sucesso!')
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Controle Financeiro</h1>
          <p className="text-muted-foreground">Gerencie suas despesas fixas e variáveis</p>
        </header>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Renda Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary font-numbers">{formatCurrency(totalIncome)}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={16} className="text-primary" />
                <span className="text-sm text-muted-foreground">Mensal</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Gasto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive font-numbers">{formatCurrency(totalExpenses)}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown size={16} className="text-destructive" />
                <span className="text-sm text-muted-foreground">Este mês</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Restante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-numbers ${remainingIncome >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(remainingIncome)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Wallet size={16} className={remainingIncome >= 0 ? 'text-primary' : 'text-destructive'} />
                <span className="text-sm text-muted-foreground">Disponível</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Renda Extra</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent font-numbers">{formatCurrency(remainingExtra)}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={16} className="text-accent" />
                <span className="text-sm text-muted-foreground">Disponível</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {salaryUsagePercent > 90 && (
          <Alert className="mb-6 border-destructive">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              Cuidado! Você já usou {salaryUsagePercent.toFixed(1)}% do seu salário.
            </AlertDescription>
          </Alert>
        )}

        {/* Controles principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-20 text-left flex-col items-start justify-center" variant="outline">
                <DollarSign size={24} className="mb-2" />
                <div className="text-sm font-medium">Definir Renda</div>
                <div className="text-xs text-muted-foreground">Salário e renda extra</div>
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
                    type="number"
                    placeholder="0,00"
                    value={newIncome.salary}
                    onChange={(e) => setNewIncome({ ...newIncome, salary: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="extra">Renda Extra</Label>
                  <Input
                    id="extra"
                    type="number"
                    placeholder="0,00"
                    value={newIncome.extraIncome}
                    onChange={(e) => setNewIncome({ ...newIncome, extraIncome: parseFloat(e.target.value) || 0 })}
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
                    type="number"
                    placeholder="0,00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
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
                  <Select value={newExpense.type} onValueChange={(value: 'fixed' | 'variable') => setNewExpense({ ...newExpense, type: value })}>
                    <SelectTrigger id="expense-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Despesa Fixa</SelectItem>
                      <SelectItem value="variable">Despesa Variável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment-method">Forma de Pagamento</Label>
                  <Select value={newExpense.paymentMethod} onValueChange={(value: 'salary' | 'credit' | 'extra') => setNewExpense({ ...newExpense, paymentMethod: value })}>
                    <SelectTrigger id="payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">Salário</SelectItem>
                      <SelectItem value="credit">Cartão de Crédito</SelectItem>
                      <SelectItem value="extra">Renda Extra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddExpense} className="w-full">
                  Adicionar Despesa
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
                <TrendingUp size={20} />
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="fixed">Fixas</TabsTrigger>
            <TabsTrigger value="variable">Variáveis</TabsTrigger>
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
                            <Badge variant={expense.type === 'fixed' ? 'default' : 'secondary'}>
                              {expense.type === 'fixed' ? 'Fixa' : 'Variável'}
                            </Badge>
                            <Badge variant="outline">{expense.category}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-numbers font-medium">{formatCurrency(expense.amount)}</span>
                            <span className="flex items-center gap-1">
                              {expense.paymentMethod === 'credit' ? 💳 : <Wallet size={14} />}
                              {expense.paymentMethod === 'salary' ? 'Salário' : 
                               expense.paymentMethod === 'credit' ? 'Cartão' : 'Renda Extra'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={16} />
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
                              {expense.paymentMethod === 'credit' ? 💳 : <Wallet size={14} />}
                              {expense.paymentMethod === 'salary' ? 'Salário' : 
                               expense.paymentMethod === 'credit' ? 'Cartão' : 'Renda Extra'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={16} />
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
                              {expense.paymentMethod === 'credit' ? 💳 : <Wallet size={14} />}
                              {expense.paymentMethod === 'salary' ? 'Salário' : 
                               expense.paymentMethod === 'credit' ? 'Cartão' : 'Renda Extra'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App