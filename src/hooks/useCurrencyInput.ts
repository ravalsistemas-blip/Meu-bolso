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
    // Permite apenas números, vírgulas e pontos
    const allowedChars = inputValue.replace(/[^0-9.,]/g, '');
    
    // Se estiver vazio, limpa o estado
    if (allowedChars === '') {
      setValue('');
      return;
    }

    // Para formatação automática, remove tudo que não é dígito
    const numbersOnly = allowedChars.replace(/\D/g, '');
    
    if (numbersOnly === '') {
      setValue('');
      return;
    }

    // Se tem menos de 3 dígitos, trata como entrada direta
    if (numbersOnly.length <= 2) {
      setValue(numbersOnly);
      return;
    }

    // Para 3+ dígitos, trata como centavos e formata
    const valueInCents = parseInt(numbersOnly, 10);
    const valueInReais = valueInCents / 100;

    // Formata para o padrão brasileiro (ex: "1.234,56")
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valueInReais);

    setValue(formattedValue);
  }, []);

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
