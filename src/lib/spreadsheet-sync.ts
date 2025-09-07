// Sistema de sincronização de planilha integrada
import { Expense, Income, MonthlyData } from '../types'

export interface SpreadsheetData {
  id: string
  timestamp: string
  section: 'income' | 'expense' | 'investment' | 'monthly' | 'history'
  action: 'create' | 'update' | 'delete' | 'reset'
  data: any
  relatedSections: string[]
  metadata: {
    userId?: string
    monthYear: string
    category?: string
    amount?: number
    description?: string
  }
}

export interface ConsolidatedSpreadsheet {
  summary: {
    totalIncome: number
    totalExpenses: number
    totalInvestments: number
    netBalance: number
    lastUpdated: string
  }
  sections: {
    income: {
      salary: number
      extraIncome: number
      totalIncome: number
      lastUpdated: string
    }
    expenses: {
      fixed: Expense[]
      variable: Expense[]
      totalFixed: number
      totalVariable: number
      lastUpdated: string
    }
    investments: {
      transactions: Expense[]
      consolidated: Array<{
        name: string
        totalInvested: number
        currentBalance: number
        performance: number
      }>
      totalInvested: number
      lastUpdated: string
    }
    monthly: {
      currentMonth: string
      currentYear: number
      monthlyData: MonthlyData
      lastUpdated: string
    }
    history: {
      months: MonthlyData[]
      yearlyTotals: Array<{
        year: number
        totalIncome: number
        totalExpenses: number
        totalInvestments: number
        netBalance: number
      }>
      lastUpdated: string
    }
  }
  logs: SpreadsheetData[]
}

class SpreadsheetSyncService {
  private listeners: Array<(data: ConsolidatedSpreadsheet) => void> = []
  private consolidatedData: ConsolidatedSpreadsheet
  private logs: SpreadsheetData[] = []

  constructor() {
    this.consolidatedData = this.initializeSpreadsheet()
  }

  private initializeSpreadsheet(): ConsolidatedSpreadsheet {
    const now = new Date().toISOString()
    return {
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        totalInvestments: 0,
        netBalance: 0,
        lastUpdated: now
      },
      sections: {
        income: {
          salary: 0,
          extraIncome: 0,
          totalIncome: 0,
          lastUpdated: now
        },
        expenses: {
          fixed: [],
          variable: [],
          totalFixed: 0,
          totalVariable: 0,
          lastUpdated: now
        },
        investments: {
          transactions: [],
          consolidated: [],
          totalInvested: 0,
          lastUpdated: now
        },
        monthly: {
          currentMonth: new Date().toLocaleDateString('pt-BR', { month: 'long' }),
          currentYear: new Date().getFullYear(),
          monthlyData: {
            month: new Date().toLocaleDateString('pt-BR', { month: 'long' }),
            year: new Date().getFullYear(),
            income: { salary: 0, extraIncome: 0 },
            expenses: [],
            totalIncome: 0,
            totalExpenses: 0,
            remainingIncome: 0
          },
          lastUpdated: now
        },
        history: {
          months: [],
          yearlyTotals: [],
          lastUpdated: now
        }
      },
      logs: []
    }
  }

  // Registrar mudanças e sincronizar todas as seções
  public syncChange(changeData: Omit<SpreadsheetData, 'id' | 'timestamp'>): void {
    const logEntry: SpreadsheetData = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...changeData
    }

    this.logs.push(logEntry)
    this.updateConsolidatedData(logEntry)
    this.notifyListeners()
  }

  private updateConsolidatedData(change: SpreadsheetData): void {
    const now = new Date().toISOString()

    switch (change.section) {
      case 'income':
        this.updateIncomeSection(change, now)
        break
      case 'expense':
        this.updateExpenseSection(change, now)
        break
      case 'investment':
        this.updateInvestmentSection(change, now)
        break
      case 'monthly':
        this.updateMonthlySection(change, now)
        break
      case 'history':
        this.updateHistorySection(change, now)
        break
    }

    this.updateSummary(now)
  }

  private updateIncomeSection(change: SpreadsheetData, timestamp: string): void {
    const incomeData = change.data as Income
    this.consolidatedData.sections.income = {
      salary: incomeData.salary,
      extraIncome: incomeData.extraIncome,
      totalIncome: incomeData.salary + incomeData.extraIncome,
      lastUpdated: timestamp
    }

    // Atualizar seção mensal também
    this.consolidatedData.sections.monthly.monthlyData.income = incomeData
    this.consolidatedData.sections.monthly.monthlyData.totalIncome = incomeData.salary + incomeData.extraIncome
    this.consolidatedData.sections.monthly.lastUpdated = timestamp
  }

  private updateExpenseSection(change: SpreadsheetData, timestamp: string): void {
    const expenses = change.data as Expense[]
    const fixedExpenses = expenses.filter(e => e.type === 'fixed')
    const variableExpenses = expenses.filter(e => e.type === 'variable')

    this.consolidatedData.sections.expenses = {
      fixed: fixedExpenses,
      variable: variableExpenses,
      totalFixed: fixedExpenses.reduce((sum, e) => sum + e.amount, 0),
      totalVariable: variableExpenses.reduce((sum, e) => sum + e.amount, 0),
      lastUpdated: timestamp
    }

    // Atualizar seção mensal
    const allExpenses = expenses.filter(e => e.type !== 'investment')
    this.consolidatedData.sections.monthly.monthlyData.expenses = allExpenses
    this.consolidatedData.sections.monthly.monthlyData.totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0)
    this.consolidatedData.sections.monthly.lastUpdated = timestamp
  }

  private updateInvestmentSection(change: SpreadsheetData, timestamp: string): void {
    const expenses = change.data as Expense[]
    const investments = expenses.filter(e => e.type === 'investment')
    
    // Consolidar investimentos por nome
    const consolidatedInvestments = this.consolidateInvestments(investments)

    this.consolidatedData.sections.investments = {
      transactions: investments,
      consolidated: consolidatedInvestments,
      totalInvested: investments.reduce((sum, e) => sum + e.amount, 0),
      lastUpdated: timestamp
    }
  }

  private consolidateInvestments(investments: Expense[]) {
    const investmentMap = new Map<string, { totalInvested: number, currentBalance: number, lastEntry: Expense }>()
    
    investments.forEach(expense => {
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
      performance: ((data.currentBalance - data.totalInvested) / data.totalInvested) * 100
    }))
  }

  private updateMonthlySection(change: SpreadsheetData, timestamp: string): void {
    const monthlyData = change.data as MonthlyData
    this.consolidatedData.sections.monthly = {
      currentMonth: monthlyData.month,
      currentYear: monthlyData.year,
      monthlyData,
      lastUpdated: timestamp
    }
  }

  private updateHistorySection(change: SpreadsheetData, timestamp: string): void {
    const historyData = change.data as MonthlyData[]
    
    // Calcular totais anuais
    const yearlyTotals = this.calculateYearlyTotals(historyData)

    this.consolidatedData.sections.history = {
      months: historyData,
      yearlyTotals,
      lastUpdated: timestamp
    }
  }

  private calculateYearlyTotals(historyData: MonthlyData[]) {
    const yearlyMap = new Map<number, { totalIncome: number, totalExpenses: number, totalInvestments: number }>()

    historyData.forEach(month => {
      const year = month.year
      const totalInvestments = month.expenses.filter(e => e.type === 'investment').reduce((sum, e) => sum + e.amount, 0)
      
      if (yearlyMap.has(year)) {
        const existing = yearlyMap.get(year)!
        existing.totalIncome += month.totalIncome
        existing.totalExpenses += month.totalExpenses
        existing.totalInvestments += totalInvestments
      } else {
        yearlyMap.set(year, {
          totalIncome: month.totalIncome,
          totalExpenses: month.totalExpenses,
          totalInvestments
        })
      }
    })

    return Array.from(yearlyMap.entries()).map(([year, data]) => ({
      year,
      ...data,
      netBalance: data.totalIncome - data.totalExpenses
    }))
  }

  private updateSummary(timestamp: string): void {
    const income = this.consolidatedData.sections.income.totalIncome
    const expenses = this.consolidatedData.sections.expenses.totalFixed + this.consolidatedData.sections.expenses.totalVariable
    const investments = this.consolidatedData.sections.investments.totalInvested

    this.consolidatedData.summary = {
      totalIncome: income,
      totalExpenses: expenses,
      totalInvestments: investments,
      netBalance: income - expenses,
      lastUpdated: timestamp
    }

    // Atualizar logs na planilha consolidada
    this.consolidatedData.logs = this.logs.slice(-100) // Manter apenas os últimos 100 logs
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  // Métodos para componentes se inscreverem para atualizações
  public subscribe(callback: (data: ConsolidatedSpreadsheet) => void): () => void {
    this.listeners.push(callback)
    
    // Retornar função para cancelar inscrição
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.consolidatedData))
  }

  // Métodos públicos para obter dados
  public getConsolidatedData(): ConsolidatedSpreadsheet {
    return this.consolidatedData
  }

  public getLogs(): SpreadsheetData[] {
    return this.logs
  }

  public exportToCSV(): string {
    const headers = ['Timestamp', 'Section', 'Action', 'Description', 'Amount', 'Category', 'Month/Year']
    const rows: string[][] = []

    this.logs.forEach(log => {
      rows.push([
        new Date(log.timestamp).toLocaleString('pt-BR'),
        log.section,
        log.action,
        log.metadata.description || '',
        log.metadata.amount?.toString() || '',
        log.metadata.category || '',
        log.metadata.monthYear
      ])
    })

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  // Inicializar com dados existentes
  public initializeWithData(income: Income, expenses: Expense[], monthlyHistory: MonthlyData[]): void {
    const now = new Date()
    const monthYear = `${now.toLocaleDateString('pt-BR', { month: 'long' })} ${now.getFullYear()}`

    // Sincronizar renda
    this.syncChange({
      section: 'income',
      action: 'update',
      data: income,
      relatedSections: ['monthly', 'summary'],
      metadata: {
        monthYear,
        description: 'Inicialização da renda'
      }
    })

    // Sincronizar despesas
    this.syncChange({
      section: 'expense',
      action: 'update',
      data: expenses,
      relatedSections: ['monthly', 'summary'],
      metadata: {
        monthYear,
        description: 'Inicialização das despesas'
      }
    })

    // Sincronizar investimentos
    this.syncChange({
      section: 'investment',
      action: 'update',
      data: expenses,
      relatedSections: ['summary'],
      metadata: {
        monthYear,
        description: 'Inicialização dos investimentos'
      }
    })

    // Sincronizar histórico
    this.syncChange({
      section: 'history',
      action: 'update',
      data: monthlyHistory,
      relatedSections: ['summary'],
      metadata: {
        monthYear,
        description: 'Inicialização do histórico'
      }
    })
  }
}

// Exportar instância singleton
export const spreadsheetSync = new SpreadsheetSyncService()
