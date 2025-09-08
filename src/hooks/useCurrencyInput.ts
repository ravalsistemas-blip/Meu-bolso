import { useState, useCallback } from 'react'

/**
 * Hook para formatação automática de valores monetários
 * Aplica formatação brasileira com pontos e vírgulas automaticamente
 */
export function useCurrencyInput(initialValue: number = 0) {
  const [displayValue, setDisplayValue] = useState<string>(
    initialValue > 0 ? formatCurrency(initialValue) : ''
  )
  const [numericValue, setNumericValue] = useState<number>(initialValue)

  const handleChange = useCallback((value: string) => {
    // Remove tudo que não é número
    const numbersOnly = value.replace(/\D/g, '')
    
    if (numbersOnly === '') {
      setDisplayValue('')
      setNumericValue(0)
      return
    }

    // Converte para número (em centavos)
    const numericValueInCents = parseInt(numbersOnly, 10)
    const numericValueInReais = numericValueInCents / 100

    // Formata para exibição
    const formatted = formatCurrency(numericValueInReais)
    
    setDisplayValue(formatted)
    setNumericValue(numericValueInReais)
  }, [])

  const setValue = useCallback((value: number) => {
    setNumericValue(value)
    setDisplayValue(value > 0 ? formatCurrency(value) : '')
  }, [])

  const clear = useCallback(() => {
    setDisplayValue('')
    setNumericValue(0)
  }, [])

  return {
    displayValue,
    numericValue,
    handleChange,
    setValue,
    clear
  }
}

/**
 * Formata um número para moeda brasileira
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
 * Formata um número para exibição sem símbolo de moeda
 */
export function formatCurrencyInput(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Converte string formatada para número
 */
export function parseCurrency(value: string): number {
  if (!value) return 0
  
  // Remove símbolos de moeda e espaços
  const cleanValue = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '') // Remove pontos dos milhares
    .replace(',', '.') // Substitui vírgula por ponto decimal
  
  return parseFloat(cleanValue) || 0
}

/**
 * Hook para input de moeda simplificado (apenas números com formatação)
 */
export function useSimpleCurrencyInput(initialValue: number = 0) {
  const [value, setValue] = useState<string>(
    initialValue > 0 ? formatCurrencyInput(initialValue) : ''
  )

  const handleChange = useCallback((inputValue: string) => {
    // Remove tudo que não é número ou vírgula/ponto
    let cleaned = inputValue.replace(/[^\d,]/g, '')
    
    // Se tiver vírgula, mantém apenas a primeira
    const commaIndex = cleaned.indexOf(',')
    if (commaIndex !== -1) {
      cleaned = cleaned.substring(0, commaIndex + 1) + cleaned.substring(commaIndex + 1).replace(/,/g, '')
      
      // Limita a 2 casas decimais após a vírgula
      const parts = cleaned.split(',')
      if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].substring(0, 2)
        cleaned = parts.join(',')
      }
    }

    // Adiciona pontos para milhares se não tiver vírgula
    if (!cleaned.includes(',') && cleaned.length > 3) {
      cleaned = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }

    setValue(cleaned)
  }, [])

  const getNumericValue = useCallback((): number => {
    return parseCurrency(value)
  }, [value])

  const setNumericValue = useCallback((numValue: number) => {
    setValue(numValue > 0 ? formatCurrencyInput(numValue) : '')
  }, [])

  const clear = useCallback(() => {
    setValue('')
  }, [])

  return {
    value,
    setValue: handleChange,
    getNumericValue,
    setNumericValue,
    clear
  }
}
