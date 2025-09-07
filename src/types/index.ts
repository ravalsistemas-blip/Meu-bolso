// Tipos compartilhados do projeto
export type Expense = {
  id: string
  name: string
  amount: number
  category: string
  paymentMethod: 'salary' | 'extra'
  type: 'fixed' | 'variable' | 'investment'
  date: string
  investmentBalance?: number
}

export type Income = {
  salary: number
  extraIncome: number
}

export type MonthlyData = {
  month: string
  year: number
  income: Income
  expenses: Expense[]
  totalIncome: number
  totalExpenses: number
  remainingIncome: number
}

export type CurrentMonth = {
  month: string
  year: number
}
