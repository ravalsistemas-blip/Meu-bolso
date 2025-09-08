/**
 * Utilitários globais de formatação para o projeto
 * Centraliza todas as funções de formatação de moeda e números
 */

/**
 * Formata um número para moeda brasileira completa (com R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Formata um número para moeda brasileira sem símbolo
 */
export function formatCurrencyInput(value: number): string {
  if (value === 0) return ''
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Converte string formatada para número
 */
export function parseCurrency(value: string): number {
  if (!value || value.trim() === '') return 0
  
  // Remove símbolos de moeda, espaços e caracteres especiais
  const cleanValue = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '') // Remove pontos dos milhares
    .replace(',', '.') // Substitui vírgula por ponto decimal
  
  const parsed = parseFloat(cleanValue)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Formata número para porcentagem brasileira
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100)
}

/**
 * Formata data para padrão brasileiro
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj)
}

/**
 * Formata data e hora para padrão brasileiro
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

/**
 * Converte mês em inglês para português
 */
export function translateMonth(month: string): string {
  const months: { [key: string]: string } = {
    'january': 'Janeiro',
    'february': 'Fevereiro',
    'march': 'Março',
    'april': 'Abril',
    'may': 'Maio',
    'june': 'Junho',
    'july': 'Julho',
    'august': 'Agosto',
    'september': 'Setembro',
    'october': 'Outubro',
    'november': 'Novembro',
    'december': 'Dezembro'
  }
  
  return months[month.toLowerCase()] || month
}

/**
 * Aplica formatação de moeda a um input em tempo real
 */
export function applyCurrencyMask(value: string): string {
  // Remove tudo que não é número
  const numbersOnly = value.replace(/\D/g, '')
  
  if (numbersOnly === '') return ''
  
  // Converte para número (em centavos)
  const numericValueInCents = parseInt(numbersOnly, 10)
  const numericValueInReais = numericValueInCents / 100
  
  // Formata para exibição brasileira
  return numericValueInReais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Valida se uma string é um valor monetário válido
 */
export function isValidCurrency(value: string): boolean {
  if (!value || value.trim() === '') return true // Vazio é válido
  
  // Regex para formato brasileiro: 1.234,56 ou 1234,56 ou 1234.56
  const brazilianCurrencyRegex = /^(\d{1,3}\.)*\d{1,3}(,\d{2})?$|^\d+(.\d{2})?$/
  
  return brazilianCurrencyRegex.test(value.replace(/[R$\s]/g, ''))
}

/**
 * Formata número com separadores de milhares brasileiros
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

/**
 * Trunca texto mantendo apenas os primeiros N caracteres
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Capitaliza primeira letra de cada palavra
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}
