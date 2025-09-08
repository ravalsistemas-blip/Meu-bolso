import React, { forwardRef } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'
import { useSimpleCurrencyInput } from '@/hooks/useCurrencyInput'

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number
  onValueChange?: (value: number) => void
  showCurrencySymbol?: boolean
}

/**
 * Componente de input com formatação automática de moeda
 * Remove as setas do input number e aplica formatação brasileira
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value = 0, onValueChange, showCurrencySymbol = false, className, placeholder = '0,00', ...props }, ref) => {
    const { 
      value: displayValue, 
      setValue, 
      getNumericValue,
      setNumericValue 
    } = useSimpleCurrencyInput(value)

    // Sincroniza com valor externo
    React.useEffect(() => {
      const currentNumeric = getNumericValue()
      if (value !== currentNumeric) {
        setNumericValue(value)
      }
    }, [value, getNumericValue, setNumericValue])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      setValue(inputValue)
      
      // Converte para número e chama callback
      const numericValue = parseCurrency(inputValue)
      onValueChange?.(numericValue)
    }

    const handleBlur = () => {
      const numericValue = getNumericValue()
      onValueChange?.(numericValue)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permite: backspace, delete, tab, escape, enter, números, vírgula, ponto
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End'
      ]
      
      const isNumber = /^[0-9]$/.test(e.key)
      const isCommaOrDot = /^[,.]$/.test(e.key)
      
      if (!allowedKeys.includes(e.key) && !isNumber && !isCommaOrDot) {
        e.preventDefault()
      }
    }

    // Função auxiliar para converter string para número
    const parseCurrency = (str: string): number => {
      if (!str) return 0
      const cleanValue = str
        .replace(/[^\d.,]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
      return parseFloat(cleanValue) || 0
    }

    return (
      <div className="relative">
        {showCurrencySymbol && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
            R$
          </div>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            // Remove setas do input number
            'currency-input',
            showCurrencySymbol && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
